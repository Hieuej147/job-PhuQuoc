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
