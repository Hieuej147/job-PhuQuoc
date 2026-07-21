import base64
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional, Dict
from copilotkit import CopilotKitState
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from core.context import AgentContext

logger = logging.getLogger(__name__)

# recursion_limit được set ở web/agent/main.py (tham số config=RunnableConfig
# (recursion_limit=...) khi khởi tạo LangGraphAGUIAgent) — không đặt ở file
# này. Xem ghi chú đầy đủ trong main.py về 2 cách đã thử KHÔNG hiệu quả trước
# khi tìm ra cách đúng, và lý do .with_config() trên graph đã bị bỏ.


def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Decode JWT without verification (payload only)"""
    try:
        parts = token.replace("Bearer ", "").split(".")
        if len(parts) != 3:
            return None
        payload = parts[1] + "=" * (-len(parts) % 4)
        decoded = base64.b64decode(payload).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        return None


def should_route_to_tool_node(tool_calls: list, fe_tools: list) -> bool:
    """Returns True if none of the tool calls are frontend tools."""
    if not tool_calls:
        return False
    fe_tool_names = {tool.get("name") for tool in fe_tools}
    for tool_call in tool_calls:
        tool_name = (
            tool_call.get("name")
            if isinstance(tool_call, dict)
            else getattr(tool_call, "name", None)
        )
        if tool_name in fe_tool_names:
            return False
    return True


def sanitize_tool_message_order(messages: list) -> list:
    """
    Đảm bảo mọi AIMessage có tool_calls luôn được theo NGAY SAU bởi đúng
    ToolMessage tương ứng (yêu cầu bắt buộc của OpenAI API).

    LangGraph checkpoint đôi khi merge message list không giữ đúng thứ tự
    append gốc (ToolMessage bị đẩy lùi ra sau các message khác), khiến
    OpenAI trả lỗi 400 "tool_call_ids did not have response messages" và
    làm crash cả stream. Hàm này sắp xếp lại để luôn hợp lệ, đồng thời
    tự tạo ToolMessage rỗng cho các tool_call bị "mồ côi" (không tìm thấy
    kết quả) để tránh crash trong mọi trường hợp.
    """
    tool_messages_by_id = {}
    for m in messages:
        if isinstance(m, ToolMessage) and m.tool_call_id:
            tool_messages_by_id[m.tool_call_id] = m

    result = []
    consumed_tool_ids = set()

    for m in messages:
        if isinstance(m, ToolMessage):
            # ToolMessage sẽ được chèn ngay sau AIMessage tương ứng của nó,
            # không thêm lại ở vị trí gốc (tránh trùng lặp).
            continue

        result.append(m)

        if isinstance(m, AIMessage) and m.tool_calls:
            for tc in m.tool_calls:
                tc_id = tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", None)
                if not tc_id or tc_id in consumed_tool_ids:
                    continue
                consumed_tool_ids.add(tc_id)
                if tc_id in tool_messages_by_id:
                    result.append(tool_messages_by_id[tc_id])
                else:
                    tc_name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", "unknown")
                    result.append(
                        ToolMessage(
                            tool_call_id=tc_id,
                            name=tc_name,
                            content="Không có kết quả (tool chưa hoàn tất).",
                        )
                    )

    return result


class BaseAgent(ABC):
    def __init__(self, llm: BaseChatModel, context: AgentContext, api_client=None, checkpointer=None):
        self.llm = llm
        self.context = context
        self.api_client = api_client
        self.checkpointer = checkpointer or MemorySaver()
        self.tools = self._register_tools()
        self.graph = self._build_graph()

    @abstractmethod
    def _register_tools(self) -> list:
        """Return list of tool instances"""
        ...

    @abstractmethod
    async def _get_system_prompt(self, state: Any) -> str:
        """Return system prompt. ASYNC vì cần fetch dữ liệu tươi (ví dụ tên
        công ty thật của recruiter) mỗi lượt chat qua self.api_client, thay vì
        dùng self.context tĩnh chỉ set 1 lần lúc server khởi động (agent_factory
        tạo đúng 1 graph instance dùng chung cho MỌI user — self.context không
        bao giờ đại diện đúng cho user thật đang chat)."""
        ...

    @abstractmethod
    def _get_state_class(self) -> type:
        """Return state class (extends CopilotKitState)"""
        ...

    def _get_lc_tools_for_binding(self) -> list:
        """Return LangChain tools for LLM binding. Override if custom tools need special handling."""
        return [t.to_langchain_tool() for t in self.tools]

    def _get_lc_tools_for_toolnode(self) -> list:
        """Return LangChain tools for ToolNode. Override if some tools use custom nodes."""
        return self._get_lc_tools_for_binding()

    def _get_routing_map(self) -> dict:
        """Return custom routing map. Override to add custom nodes."""
        return {}

    def _add_custom_nodes(self, workflow: StateGraph):
        """Add custom nodes to the graph. Override to add CV nodes, etc."""
        pass

    def _build_graph(self):
        state_class = self._get_state_class()
        lc_tools_for_binding = self._get_lc_tools_for_binding()
        lc_tools_for_toolnode = self._get_lc_tools_for_toolnode()

        def should_continue(state: Any) -> str:
            messages = state.get("messages", [])
            if not messages:
                return "__end__"
            last_message = messages[-1]
            if isinstance(last_message, AIMessage) and last_message.tool_calls:
                fe_tools = state.get("copilotkit", {}).get("actions", [])
                if not should_route_to_tool_node(last_message.tool_calls, fe_tools):
                    return "__end__"

                tool_name = last_message.tool_calls[0].get("name") or getattr(last_message.tool_calls[0], "name", "")
                custom_routing = self._get_routing_map()
                if tool_name in custom_routing:
                    return custom_routing[tool_name]

                if not lc_tools_for_toolnode:
                    return "__end__"

                return "tool_node"
            return "__end__"

        async def auth_node(state: Any, config: RunnableConfig) -> Command:
            cookie = config.get("configurable", {}).get("cookie")
            auth_token = config.get("configurable", {}).get("authorization")

            if cookie:
                state["authorization"] = {"cookie": cookie, "user_id": "authenticated"}
                if self.api_client:
                    self.api_client.set_cookie(cookie)
            elif auth_token:
                user_info = decode_jwt(auth_token)
                if user_info:
                    state["authorization"] = {**user_info, "token": auth_token}
                    if self.api_client:
                        self.api_client.set_auth_token(auth_token)
                else:
                    state["authorization"] = {"user_id": "anonymous"}
            else:
                state["authorization"] = {"user_id": "anonymous"}

            # Parse CopilotKit context
            context_items = state.get("copilotkit", {}).get("context", [])
            for item in context_items:
                value = item.value if hasattr(item, 'value') else (item.get("value", "") if isinstance(item, dict) else "")
                if isinstance(value, str) and "User ID:" in value:
                    parts = {}
                    for part in value.split(","):
                        if ":" in part:
                            k, v = part.split(":", 1)
                            parts[k.strip().lower()] = v.strip()
                    if "user id" in parts:
                        state["authorization"]["user_id"] = parts["user id"]
                    if "name" in parts:
                        state["authorization"]["name"] = parts["name"]
                    if "role" in parts:
                        state["authorization"]["role"] = parts["role"]

            return Command(goto="chat_node", update={"authorization": state["authorization"]})

        async def chat_node(state: Any, config: RunnableConfig) -> Command:
            # Nếu chưa có tin nhắn nào của user, kết thúc luôn để hiển thị welcomeMessageText từ FE
            if not any(
                m.__class__.__name__ in ("HumanMessage", "HumanMessageChunk")
                or getattr(m, "type", None) == "human"
                or (isinstance(m, dict) and m.get("role") == "user")
                for m in state.get("messages", [])
            ):
                return Command(goto="__end__")

            fe_tools = state.get("copilotkit", {}).get("actions", [])
            context_items = state.get("copilotkit", {}).get("context", [])
            auth_info = state.get("authorization", {})

            # Re-đồng bộ cookie NGAY TRƯỚC KHI gọi _get_system_prompt(state) —
            # subclass (ví dụ RecruiterAgent) có thể tự gọi self.api_client bên
            # trong đó để lấy dữ liệu tươi (tên công ty...). Đây là cùng pattern
            # an toàn đã áp dụng cho mọi tool: set_cookie() ngay trước lời gọi
            # API, không để logic nào khác xen giữa 2 bước đó trong cùng 1
            # đoạn code đồng bộ (xem chi tiết trong api_client.py).
            if self.api_client and auth_info.get("cookie"):
                self.api_client.set_cookie(auth_info["cookie"])
            system_prompt = await self._get_system_prompt(state)

            user_info = ""
            if auth_info and auth_info.get("user_id") != "anonymous":
                user_info = f"User: {auth_info.get('name', 'Unknown')} ({auth_info.get('role', 'guest')})"

            context_info = ""
            if context_items:
                try:
                    serializable_items = []
                    for item in context_items:
                        if hasattr(item, 'model_dump'):
                            serializable_items.append(item.model_dump())
                        elif isinstance(item, dict):
                            serializable_items.append(item)
                        else:
                            serializable_items.append(str(item))
                    context_info = f"Dashboard context: {json.dumps(serializable_items, ensure_ascii=False, default=str)}"
                except Exception:
                    context_info = f"Dashboard context: {str(context_items)}"

            fe_tool_names = [t.get("name", "unknown") for t in fe_tools]
            tools_info = f"Frontend tools: {fe_tool_names}" if fe_tools else ""

            full_prompt = f"""{system_prompt}

{user_info}
{context_info}
{tools_info}"""

            sanitized_messages = sanitize_tool_message_order(state["messages"])

            all_tools = [*fe_tools, *lc_tools_for_binding]
            ainvoke_kwargs = {}
            if self.llm.__class__.__name__ in ["ChatOpenAI"]:
                ainvoke_kwargs["parallel_tool_calls"] = False

            model_with_tools = self.llm.bind_tools(all_tools, **ainvoke_kwargs) if all_tools else self.llm

            try:
                response = await model_with_tools.ainvoke(
                    [SystemMessage(content=full_prompt), *sanitized_messages], config,
                )
            except Exception:
                logger.exception("Agent chat node failed")
                response = AIMessage(
                    content=(
                        "Trợ lý đang gặp lỗi khi xử lý yêu cầu này. "
                        "Bạn vui lòng thử lại sau ít phút hoặc kiểm tra kết nối agent/backend."
                    )
                )

            return Command(update={"messages": response})

        # Build graph
        workflow = StateGraph(state_class)
        workflow.add_node("auth_node", auth_node)
        workflow.add_node("chat_node", chat_node)
        if lc_tools_for_toolnode:
            workflow.add_node("tool_node", ToolNode(tools=lc_tools_for_toolnode))

        # Add custom nodes (CV nodes, etc.)
        self._add_custom_nodes(workflow)

        workflow.set_entry_point("auth_node")
        workflow.add_edge("auth_node", "chat_node")

        # Routing
        custom_routing = self._get_routing_map()
        routing_map = {v: v for v in custom_routing.values()}
        if lc_tools_for_toolnode:
            routing_map["tool_node"] = "tool_node"
        routing_map["__end__"] = "__end__"
        workflow.add_conditional_edges("chat_node", should_continue, routing_map)

        if lc_tools_for_toolnode:
            workflow.add_edge("tool_node", "chat_node")
        for node_name in custom_routing.values():
            workflow.add_edge(node_name, "chat_node")

        # LƯU Ý: từng thử compiled.with_config({"recursion_limit": N}) ở đây
        # để chặn vòng lặp tool, nhưng đã BỎ vì 2 lý do xác nhận bằng thực
        # nghiệm: (1) không hề có tác dụng thật với recursion_limit — log vẫn
        # báo "Recursion limit of 25 reached" dù đã set 12; (2) nghi ngờ là
        # nguyên nhân khiến agent hoàn toàn không phản hồi (treo im, kể cả với
        # tin nhắn đơn giản không cần gọi tool) — có thể do việc bọc graph
        # trong RunnableBinding qua with_config() làm hỏng cách ag_ui_langgraph
        # nhận diện/stream sự kiện AG-UI từ graph gốc.
        # recursion_limit giờ được set ĐÚNG CÁCH và AN TOÀN qua tham số
        # config=RunnableConfig(recursion_limit=...) khi khởi tạo
        # LangGraphAGUIAgent trong main.py — không đụng vào graph object ở đây.
        return workflow.compile(checkpointer=self.checkpointer)
