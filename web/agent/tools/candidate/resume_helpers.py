from typing import Any, Optional


def unwrap_data(response: Any) -> Any:
    """Unwrap nested backend response envelopes such as {"data": {"data": value}}."""
    result = response
    while isinstance(result, dict) and "data" in result and "id" not in result:
        result = result["data"]
    return result


def unwrap_list(response: Any) -> list:
    result = unwrap_data(response)
    if isinstance(result, dict):
        result = result.get("items", [])
    return result if isinstance(result, list) else []


def summarize_resume(resume: Optional[dict], kind: str = "resume") -> Optional[dict]:
    if not isinstance(resume, dict):
        return None
    return {
        "id": resume.get("id"),
        "kind": kind,
        "title": resume.get("title"),
        "templateId": resume.get("templateId"),
        "templateName": (resume.get("template") or {}).get("name"),
        "isDefault": resume.get("isDefault"),
        "isProfile": resume.get("isProfile"),
        "updatedAt": resume.get("updatedAt"),
        "hasContent": has_resume_content(resume),
    }


def has_resume_content(resume: dict) -> bool:
    content_fields = [
        resume.get("summary"),
        resume.get("skills"),
        resume.get("education"),
        resume.get("experience"),
        resume.get("projects"),
        resume.get("phone"),
        resume.get("degree"),
        resume.get("languages"),
    ]
    return any(bool(value) for value in content_fields)
