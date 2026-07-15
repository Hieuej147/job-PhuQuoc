import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

logging.basicConfig(level=logging.INFO, format='%(name)s - %(levelname)s - %(message)s')

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from agents.custom_agent import CustomLangGraphAGUIAgent
from core.agent_factory import create_candidate_graph, create_recruiter_graph
from core.checkpointer import init_checkpointer, close_checkpointer
from core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    checkpointer = await init_checkpointer()
    app.state.checkpointer = checkpointer

    candidate_graph = create_candidate_graph(checkpointer)
    recruiter_graph = create_recruiter_graph(checkpointer)

    add_langgraph_fastapi_endpoint(
        app=app,
        agent=CustomLangGraphAGUIAgent(
            name="candidate_agent",
            description="AI trợ lý candidate duy nhất: tư vấn, tìm việc và thiết kế CV",
            graph=candidate_graph,
        ),
        path="/candidate",
    )
    add_langgraph_fastapi_endpoint(
        app=app,
        agent=CustomLangGraphAGUIAgent(
            name="recruiter_agent",
            description="AI trợ lý tuyển dụng cho nhà tuyển dụng",
            graph=recruiter_graph,
        ),
        path="/recruiter",
    )

    yield

    await close_checkpointer()


app = FastAPI(title="Phú Quốc Jobs AI Agents", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "agents": ["candidate_agent", "recruiter_agent"]}


@app.get("/threads/{thread_id}/history")
async def get_thread_history(thread_id: str):
    checkpointer = app.state.checkpointer
    config = {"configurable": {"thread_id": thread_id}}
    checkpoint_tuple = await checkpointer.aget_tuple(config)
    if not checkpoint_tuple:
        return {"messages": []}

    raw_messages = checkpoint_tuple.checkpoint.get("channel_values", {}).get("messages", [])
    result = []
    # Map tool_call_id -> {"name", "args"}, lấy từ AIMessage.tool_calls đứng trước
    # ToolMessage tương ứng — để card lịch sử hiển thị đủ thông tin giống lúc chat live,
    # thay vì chỉ có mỗi kết quả.
    pending_tool_calls: dict = {}

    for i, m in enumerate(raw_messages):
        msg_type = (getattr(m, "type", "") or "").lower()

        if msg_type == "ai":
            tool_calls = getattr(m, "tool_calls", None) or []
            for tc in tool_calls:
                tc_id = tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", None)
                tc_name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
                tc_args = tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", None)
                if tc_id:
                    pending_tool_calls[tc_id] = {"name": tc_name, "args": tc_args}

            content = m.content if isinstance(m.content, str) else str(m.content)
            if content.strip():
                result.append({
                    "id": getattr(m, "id", None) or f"{thread_id}-{i}",
                    "kind": "text",
                    "role": "assistant",
                    "content": content,
                })
            continue

        if msg_type == "human":
            content = m.content if isinstance(m.content, str) else str(m.content)
            if not content.strip():
                continue
            result.append({
                "id": getattr(m, "id", None) or f"{thread_id}-{i}",
                "kind": "text",
                "role": "user",
                "content": content,
            })
            continue

        if msg_type == "tool":
            tc_id = getattr(m, "tool_call_id", None)
            pending = pending_tool_calls.pop(tc_id, None) if tc_id else None
            tool_name = (pending or {}).get("name") or getattr(m, "name", None) or "tool"
            tool_args = (pending or {}).get("args")
            content = m.content if isinstance(m.content, str) else str(m.content)
            result.append({
                "id": getattr(m, "id", None) or f"{thread_id}-{i}",
                "kind": "tool",
                "toolName": tool_name,
                "toolArgs": tool_args,
                "toolCallId": tc_id,
                "content": content,
            })
            continue

        # Các loại message khác (system...) bỏ qua, không hiển thị trong lịch sử.

    return {"messages": result}


if __name__ == "__main__":
    settings = get_settings()
    config = uvicorn.Config(app, host="0.0.0.0", port=settings.agent_port)
    server = uvicorn.Server(config)
    asyncio.run(server.serve(), loop_factory=asyncio.SelectorEventLoop)