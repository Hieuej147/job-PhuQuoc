import json
from typing import cast, Optional, List, Dict, Any

from copilotkit.langchain import copilotkit_emit_state
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field

from tools.base_tool import BaseTool
from core.api_client import ApiClient


def unwrap_data(response: Any) -> Any:
    """
    Bóc tách các lớp {"data": {...}} lồng nhau mà backend đôi khi trả về
    (ví dụ: {"data": {"data": {"id": ..., ...}}, "timestamp": ...}).
    Dừng lại khi gặp dict có field "id", hoặc không còn "data" để bóc tiếp.
    """
    result = response
    while isinstance(result, dict) and "id" not in result and "data" in result:
        result = result["data"]
    return result


class EducationItem(BaseModel):
    school: str
    degree: Optional[str] = None
    field: Optional[str] = None
    startYear: Optional[int] = None
    endYear: Optional[int] = None
    description: Optional[str] = None
    GPA: Optional[str] = None


class ExperienceItem(BaseModel):
    company: str
    position: str
    startYear: Optional[int] = None
    endYear: Optional[int] = None
    description: Optional[str] = None


class ProjectItem(BaseModel):
    name: str
    position: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None


class SaveCvInput(BaseModel):
    resume_id: Optional[str] = Field(
        default=None,
        description="Nếu đã có resume_id (đang sửa CV cũ), truyền vào đây. Để trống nếu đang tạo CV mới.",
    )
    title: Optional[str] = Field(default=None, description="Tên/tiêu đề CV, ví dụ 'CV Frontend Developer'")
    name: Optional[str] = Field(default=None, description="Họ tên ứng viên")
    email: Optional[str] = Field(default=None, description="Email liên hệ")
    phone: Optional[str] = Field(default=None, description="Số điện thoại")
    summary: Optional[str] = Field(default=None, description="Đoạn tóm tắt/giới thiệu bản thân, đã viết chuyên nghiệp")
    education: Optional[List[EducationItem]] = Field(default=None, description="Danh sách học vấn cần thêm/thiết lập")
    experience: Optional[List[ExperienceItem]] = Field(default=None, description="Danh sách kinh nghiệm làm việc cần thêm/thiết lập")
    projects: Optional[List[ProjectItem]] = Field(default=None, description="Danh sách dự án cần thêm/thiết lập")
    skills: Optional[str] = Field(default=None, description="Danh sách kỹ năng, dạng chuỗi phân tách bởi dấu phẩy")
    languages: Optional[str] = Field(default=None, description="Ngôn ngữ biết, dạng chuỗi")
    style_preference: Optional[str] = Field(
        default=None,
        description="Phong cách template mong muốn khi tạo CV mới, ví dụ 'chuyên nghiệp', 'sáng tạo', 'tối giản'",
    )
    replace_lists: bool = Field(
        default=False,
        description="True nếu muốn THAY THẾ hoàn toàn danh sách education/experience/projects thay vì chỉ thêm vào",
    )


class SaveCvTool(BaseTool):
    name = "save_cv"
    description = (
        "Tạo mới CV (nếu không có resume_id) hoặc cập nhật CV đã tồn tại (nếu có resume_id). "
        "Khi tạo mới, tool sẽ tự chọn template phù hợp và lưu vào hệ thống. "
        "Khi cập nhật, chỉ cần truyền các trường muốn thay đổi; các trường không truyền sẽ được giữ nguyên. "
        "Với education/experience/projects, mặc định sẽ THÊM vào danh sách hiện có (không xóa dữ liệu cũ) "
        "trừ khi replace_lists=True."
    )
    args_schema = SaveCvInput

    def __init__(self, api_client: ApiClient):
        self.api_client = api_client

    async def _pick_template_id(self, style_preference: Optional[str]) -> Optional[str]:
        try:
            response = await self.api_client.get("/resumes/templates")
            items = response.get("data", response) if isinstance(response, dict) else response
            if isinstance(items, dict):
                items = items.get("items", [])
            if not isinstance(items, list) or not items:
                return None

            if style_preference:
                keyword = style_preference.strip().lower()
                for tpl in items:
                    text = f"{tpl.get('name', '')} {tpl.get('description', '')}".lower()
                    if keyword in text:
                        return tpl.get("id")

            return items[0].get("id")
        except Exception:
            return None

    def _merge_list(self, existing: Optional[list], new_items: Optional[list], replace: bool) -> Optional[list]:
        if new_items is None:
            return existing
        new_dicts = [item.model_dump(exclude_none=True) if hasattr(item, "model_dump") else item for item in new_items]
        if replace or not existing:
            return new_dicts
        return [*existing, *new_dicts]

    async def run(
        self,
        resume_id: Optional[str] = None,
        title: Optional[str] = None,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        summary: Optional[str] = None,
        education: Optional[List[EducationItem]] = None,
        experience: Optional[List[ExperienceItem]] = None,
        projects: Optional[List[ProjectItem]] = None,
        skills: Optional[str] = None,
        languages: Optional[str] = None,
        style_preference: Optional[str] = None,
        replace_lists: bool = False,
    ) -> dict:
        try:
            if resume_id:
                # --- CẬP NHẬT CV ĐÃ CÓ ---
                current = await self.api_client.get(f"/resumes/{resume_id}")
                current_data = unwrap_data(current)

                payload: Dict[str, Any] = {}
                if title is not None:
                    payload["title"] = title
                if name is not None:
                    payload["name"] = name
                if email is not None:
                    payload["email"] = email
                if phone is not None:
                    payload["phone"] = phone
                if summary is not None:
                    payload["summary"] = summary
                if skills is not None:
                    payload["skills"] = skills
                if languages is not None:
                    payload["languages"] = languages

                merged_education = self._merge_list(current_data.get("education"), education, replace_lists)
                merged_experience = self._merge_list(current_data.get("experience"), experience, replace_lists)
                merged_projects = self._merge_list(current_data.get("projects"), projects, replace_lists)
                if merged_education is not None:
                    payload["education"] = merged_education
                if merged_experience is not None:
                    payload["experience"] = merged_experience
                if merged_projects is not None:
                    payload["projects"] = merged_projects

                updated = await self.api_client.patch(f"/resumes/{resume_id}", json=payload)
                updated_data = unwrap_data(updated)
                return {
                    "action": "updated",
                    "id": updated_data.get("id", resume_id),
                    "title": updated_data.get("title", title),
                }

            # --- TẠO CV MỚI ---
            template_id = await self._pick_template_id(style_preference)
            if not template_id:
                return {"error": "Không tìm thấy template CV nào khả dụng để tạo mới."}

            payload = {"templateId": template_id}
            if title is not None:
                payload["title"] = title
            if name is not None:
                payload["name"] = name
            if email is not None:
                payload["email"] = email
            if phone is not None:
                payload["phone"] = phone
            if summary is not None:
                payload["summary"] = summary
            if skills is not None:
                payload["skills"] = skills
            if languages is not None:
                payload["languages"] = languages
            if education is not None:
                payload["education"] = [e.model_dump(exclude_none=True) for e in education]
            if experience is not None:
                payload["experience"] = [e.model_dump(exclude_none=True) for e in experience]
            if projects is not None:
                payload["projects"] = [p.model_dump(exclude_none=True) for p in projects]

            created = await self.api_client.post("/resumes", json=payload)
            created_data = unwrap_data(created)
            return {
                "action": "created",
                "id": created_data.get("id"),
                "title": created_data.get("title", title),
                "templateId": template_id,
            }

        except Exception as e:
            return {"error": str(e)}

    def as_node(self):
        tool_instance = self

        async def node(state: dict, config: RunnableConfig) -> dict:
            ai_message = cast(AIMessage, state["messages"][-1])
            tool_call = ai_message.tool_calls[0]
            tool_call_id = tool_call["id"]
            args = tool_call.get("args", {})

            is_update = bool(args.get("resume_id"))
            state["activeWorker"] = "cv_manager"
            state["status"] = "running"
            state["currentStep"] = "Đang cập nhật CV..." if is_update else "Đang tạo và lưu CV mới..."
            state["toolStatus"] = "save_cv"
            state["progress"] = 60
            await copilotkit_emit_state(config, state)

            def parse_items(raw_list, model_cls):
                if raw_list is None:
                    return None
                return [model_cls(**item) if isinstance(item, dict) else item for item in raw_list]

            result = await tool_instance.run(
                resume_id=args.get("resume_id"),
                title=args.get("title"),
                name=args.get("name"),
                email=args.get("email"),
                phone=args.get("phone"),
                summary=args.get("summary"),
                education=parse_items(args.get("education"), EducationItem),
                experience=parse_items(args.get("experience"), ExperienceItem),
                projects=parse_items(args.get("projects"), ProjectItem),
                skills=args.get("skills"),
                languages=args.get("languages"),
                style_preference=args.get("style_preference"),
                replace_lists=args.get("replace_lists", False),
            )

            has_error = bool(result.get("error"))
            state["status"] = "error" if has_error else "done"
            state["currentStep"] = (
                "Không thể lưu CV." if has_error
                else ("Đã cập nhật CV thành công." if is_update else "Đã tạo và lưu CV mới thành công.")
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

        node.__name__ = "save_cv_node"
        return node