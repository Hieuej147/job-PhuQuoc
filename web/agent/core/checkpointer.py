import os
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

_pool_cm = None
_checkpointer: AsyncPostgresSaver | None = None


async def init_checkpointer() -> AsyncPostgresSaver:
    """Mở kết nối Postgres cho checkpointer, gọi 1 lần lúc FastAPI khởi động."""
    global _pool_cm, _checkpointer
    db_uri = os.environ["DATABASE_URL"]
    _pool_cm = AsyncPostgresSaver.from_conn_string(db_uri)
    _checkpointer = await _pool_cm.__aenter__()
    await _checkpointer.setup()
    return _checkpointer


async def close_checkpointer():
    global _pool_cm
    if _pool_cm is not None:
        await _pool_cm.__aexit__(None, None, None)