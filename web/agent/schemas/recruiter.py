from copilotkit import CopilotKitState
from typing import Optional, Dict, Any


class RecruiterState(CopilotKitState):
    authorization: Optional[Dict[str, Any]] = None
