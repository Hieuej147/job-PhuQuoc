import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def build_user_context(state: dict) -> str:
    """Build user context string from agent state for LLM prompts."""
    parts = []
    if state.get("user_name"):
        parts.append(f"Họ tên: {state['user_name']}")
    if state.get("user_email"):
        parts.append(f"Email: {state['user_email']}")
    if state.get("user_phone"):
        parts.append(f"Điện thoại: {state['user_phone']}")
    if state.get("user_address"):
        parts.append(f"Địa chỉ: {state['user_address']}")
    if state.get("user_summary"):
        parts.append(f"Tóm tắt: {state['user_summary']}")
    if state.get("user_skills"):
        parts.append(f"Kỹ năng: {', '.join(state['user_skills'])}")
    if state.get("user_languages"):
        parts.append(f"Ngôn ngữ: {', '.join(state['user_languages'])}")
    if state.get("user_education"):
        for edu in state["user_education"]:
            parts.append(f"Học vấn: {edu.get('school', '')} - {edu.get('degree', '')} ({edu.get('startYear', '')}-{edu.get('endYear', '')})")
    if state.get("user_experience"):
        for exp in state["user_experience"]:
            parts.append(f"Kinh nghiệm: {exp.get('company', '')} - {exp.get('position', '')} ({exp.get('startYear', '')}-{exp.get('endYear', '')})")
    if state.get("user_projects"):
        for proj in state["user_projects"]:
            parts.append(f"Dự án: {proj.get('name', '')} - {proj.get('description', '')}")
    return "\n".join(parts) if parts else "Chưa có thông tin"


def build_resume_data(state: dict) -> dict:
    """Build resume data dict from agent state for saving to backend."""
    return {
        "title": f"CV {state.get('user_name', 'của tôi')}",
        "summary": state.get("user_summary", ""),
        "skills": ", ".join(state.get("user_skills", [])),
        "degree": state.get("user_degree", ""),
        "languages": ", ".join(state.get("user_languages", [])),
        "address": state.get("user_address", ""),
        "education": state.get("user_education", []),
        "experience": state.get("user_experience", []),
        "projects": state.get("user_projects", []),
        "templateId": state.get("current_template_id", ""),
    }


def parse_json_from_llm(content: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        json_lines = []
        in_block = False
        for line in lines:
            if line.startswith("```"):
                in_block = not in_block
                continue
            if in_block:
                json_lines.append(line)
        content = "\n".join(json_lines)
    return json.loads(content)
