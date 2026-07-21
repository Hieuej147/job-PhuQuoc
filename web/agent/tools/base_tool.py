from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Type


class BaseTool(ABC):
    name: str
    description: str
    args_schema: Type[BaseModel]

    @abstractmethod
    async def run(self, **kwargs) -> dict:
        """Thực thi logic, luôn trả về dict"""
        ...

    def to_langchain_tool(self):
        """Convert sang LangChain StructuredTool"""
        from langchain_core.tools import StructuredTool
        return StructuredTool(
            name=self.name,
            description=self.description,
            args_schema=self.args_schema,
            coroutine=self.run,
        )

    def sync_auth_from_state(self, state: dict) -> None:
        """
        Đồng bộ cookie/token từ `state["authorization"]` (do auth_node set) lên
        `self.api_client` ngay TRƯỚC khi tool thật sự gọi API.

        Vì sao cần hàm này thay vì chỉ set 1 lần ở auth_node:
        api_client hiện là 1 instance dùng CHUNG cho mọi request (được tạo 1 lần
        lúc FastAPI khởi động — xem agent_factory.py). Nếu chỉ set cookie ở
        auth_node rồi trông chờ nó "còn sống" tới lúc custom node chạy, giá trị
        đó có thể bị ghi đè bởi 1 request khác chạy song song ở giữa (race
        condition) — kể cả khi dùng contextvars, vì LangGraph có thể thực thi
        từng node trong 1 asyncio Task riêng, khiến giá trị context không lan
        đúng giữa auth_node và node tool phía sau.

        Gọi hàm này ngay đầu mỗi as_node(), NGAY TRƯỚC dòng gọi tool_instance.run(),
        không có await nào xen giữa 2 bước — đảm bảo cookie luôn đúng của chính
        request đang chạy, bất kể có bao nhiêu request khác chạy đồng thời.
        """
        api_client = getattr(self, "api_client", None)
        if api_client is None:
            return

        auth = state.get("authorization") or {}
        cookie = auth.get("cookie")
        token = auth.get("token")

        if cookie:
            api_client.set_cookie(cookie)
        elif token:
            api_client.set_auth_token(token)