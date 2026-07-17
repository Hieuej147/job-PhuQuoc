import json
from typing import cast, List, Literal, Optional

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool
from core.api_client import ApiClient


class BlogSectionInput(BaseModel):
    type: Literal["heading2", "heading3", "paragraph", "bullet_list", "ordered_list"] = Field(
        description="Loại khối nội dung, theo đúng thứ tự sẽ hiển thị trong bài viết"
    )
    text: Optional[str] = Field(
        default=None, description="Nội dung văn bản — dùng cho type=heading2/heading3/paragraph"
    )
    items: Optional[List[str]] = Field(
        default=None, description="Danh sách các mục — dùng cho type=bullet_list/ordered_list"
    )


class CreateBlogPostInput(BaseModel):
    title: str = Field(description="Tiêu đề bài viết")
    sections: List[BlogSectionInput] = Field(
        description="Danh sách khối nội dung theo đúng thứ tự hiển thị (heading, đoạn văn, danh sách...)"
    )
    excerpt: Optional[str] = Field(default=None, description="Tóm tắt ngắn hiển thị ở trang danh sách blog")
    category_id: Optional[str] = Field(default=None, description="ID danh mục blog, nếu đã biết")
    is_published: bool = Field(
        default=False, description="true để đăng công khai ngay, false (mặc định) để lưu nháp"
    )


def _text_content(text: Optional[str]) -> list:
    """Trả về mảng content dạng text node của Tiptap, hoặc [] nếu rỗng —
    khớp đúng cách BlogEditor.tsx (frontend) xử lý paragraph rỗng (không có
    "content" key thay vì content: [])."""
    cleaned = (text or "").strip()
    return [{"type": "text", "text": cleaned}] if cleaned else []


def _build_tiptap_doc(sections: List[BlogSectionInput]) -> dict:
    """Tự dựng JSON Tiptap chuẩn từ danh sách section có cấu trúc đơn giản —
    KHÔNG để LLM tự viết JSON thô, tránh rủi ro sai schema (thiếu "type", sai
    tên node, lồng sai cấp...). Chỉ hỗ trợ đúng tập node mà BlogEditor.tsx
    (frontend) thực sự dùng: StarterKit với heading giới hạn level [2, 3],
    bulletList/orderedList/listItem, paragraph — KHÔNG có node "image" vì AI
    không có cách tạo URL ảnh thật (ảnh phải upload tay qua toolbar)."""
    content: list = []

    for section in sections:
        if section.type in ("heading2", "heading3"):
            text_nodes = _text_content(section.text)
            if text_nodes:
                level = 2 if section.type == "heading2" else 3
                content.append({"type": "heading", "attrs": {"level": level}, "content": text_nodes})

        elif section.type == "paragraph":
            text_nodes = _text_content(section.text)
            content.append({"type": "paragraph", "content": text_nodes} if text_nodes else {"type": "paragraph"})

        elif section.type in ("bullet_list", "ordered_list"):
            items = [i for i in (section.items or []) if i and i.strip()]
            if not items:
                continue
            list_node_type = "bulletList" if section.type == "bullet_list" else "orderedList"
            content.append(
                {
                    "type": list_node_type,
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": _text_content(item)}]}
                        for item in items
                    ],
                }
            )

    if not content:
        # Doc rỗng vẫn phải có ít nhất 1 paragraph rỗng — khớp EMPTY_BLOG_DOC
        # trong BlogEditor.tsx, tránh backend/editor lỗi khi content=null.
        content = [{"type": "paragraph"}]

    return {"type": "doc", "content": content}


class CreateBlogPostTool(BaseTool):
    """Tool DÙNG CHUNG cho cả CandidateAgent và RecruiterAgent — backend cho
    phép cả CANDIDATE, EMPLOYER, ADMIN tự viết blog (POST /blogs), không phân
    biệt role. Đặt ở tools/shared/ thay vì tools/candidate/ hoặc
    tools/recruiter/ để tránh trùng lặp logic. Mỗi agent vẫn phải tự đăng ký
    node riêng (_add_custom_nodes lặp qua self.tools của chính nó), nhưng
    logic build Tiptap JSON và gọi API thì dùng chung 100%."""

    name = "create_blog_post"
    description = (
        "Tạo bài viết blog mới (tin tức, chia sẻ kinh nghiệm, thông báo...). "
        "Nội dung được chia thành các khối (sections) theo thứ tự: heading2/heading3 (tiêu đề "
        "phụ), paragraph (đoạn văn), bullet_list/ordered_list (danh sách). Mặc định lưu nháp "
        "(is_published=false), chỉ đăng công khai khi người dùng xác nhận rõ ràng."
    )
    args_schema = CreateBlogPostInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def run(
        self,
        title: str,
        sections: List[BlogSectionInput],
        excerpt: Optional[str] = None,
        category_id: Optional[str] = None,
        is_published: bool = False,
    ) -> dict:
        try:
            content_json = _build_tiptap_doc(sections)
            payload: dict = {
                "title": title,
                "type": "NORMAL",
                "content": content_json,
                "isPublished": is_published,
            }
            if excerpt:
                payload["excerpt"] = excerpt
            if category_id:
                payload["categoryId"] = category_id

            response = await self.api_client.post("/blogs", json=payload)
            data = response.get("data", response) if isinstance(response, dict) else response

            return {
                "success": True,
                "post_id": data.get("id") if isinstance(data, dict) else None,
                "slug": data.get("slug") if isinstance(data, dict) else None,
                "title": title,
                "is_published": is_published,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            state["status"] = "running"
            state["currentStep"] = "Đang tạo bài viết..."
            state["toolStatus"] = "create_blog_post"
            state["progress"] = 70
            await copilotkit_emit_state(config, state)

            tool_instance.sync_auth_from_state(state)

            raw_sections = args.get("sections", [])
            sections = [BlogSectionInput(**s) if isinstance(s, dict) else s for s in raw_sections]

            result = await tool_instance.run(
                title=args.get("title"),
                sections=sections,
                excerpt=args.get("excerpt"),
                category_id=args.get("category_id"),
                is_published=args.get("is_published", False),
            )

            state["status"] = "done" if result.get("success") else "error"
            state["currentStep"] = (
                "Đã tạo bài viết." if result.get("success") else "Không thể tạo bài viết."
            )
            state["progress"] = 100
            state["messages"] = [
                ToolMessage(
                    tool_call_id=tool_call_id,
                    name=tool_call["name"],
                    content=json.dumps(result, ensure_ascii=False),
                )
            ]
            await copilotkit_emit_state(config, state)
            return state

        node.__name__ = "create_blog_post_node"
        return node