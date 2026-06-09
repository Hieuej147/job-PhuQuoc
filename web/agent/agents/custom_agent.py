from copilotkit import LangGraphAGUIAgent
from langchain_core.runnables import RunnableConfig


class CustomLangGraphAGUIAgent(LangGraphAGUIAgent):
    """
    Custom agent that forwards authorization token from frontend to agent config.
    This is necessary for authentication to work in a self-hosted environment.
    """

    async def prepare_stream(self, input, agent_state, config: RunnableConfig):
        forwarded_props = input.forwarded_props or {}

        # Start with the existing configurable values
        new_configurable = config.get("configurable", {}).copy()

        # Merge configurable from forwarded_props.config
        runtime_configurable = forwarded_props.get("config", {}).get("configurable", {})
        new_configurable.update(runtime_configurable)

        # Merge top-level cookie from forwarded_props (session cookie auth)
        if "cookie" in forwarded_props:
            new_configurable["cookie"] = forwarded_props["cookie"]
        # Fallback: merge authorization for backward compatibility
        elif "authorization" in forwarded_props:
            new_configurable["authorization"] = forwarded_props["authorization"]

        config["configurable"] = new_configurable

        return await super().prepare_stream(input, agent_state, config)
