# input_type_name: AnalyzeResumeInput
# output_type_name: AnalyzeResumeResult
# function_name: analyze_resume

from __future__ import annotations

import json
import re
from typing import Any, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class AnalyzeResumeInput(BaseModel):
    resume_text: str
    file_name: str = "resume.txt"
    target_role: Optional[str] = None
    persist: bool = True


class AnalyzeResumeResult(BaseModel):
    resume_id: Optional[str] = None
    analysis: dict[str, Any] = Field(default_factory=dict)
    source: str = "heuristic"


def _extract_json(text: str) -> dict[str, Any]:
    raw = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if fence:
        raw = fence.group(1).strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start >= 0 and end > start:
        raw = raw[start : end + 1]
    return json.loads(raw)


def _assistant_text(pod: Pod, conversation_id: str) -> str:
    msgs = pod.conversations.messages(conversation_id).items or []
    for msg in reversed(msgs):
        role = getattr(msg, "role", None) or (msg.get("role") if isinstance(msg, dict) else None)
        text = getattr(msg, "text", None) or (msg.get("text") if isinstance(msg, dict) else None)
        if role == "assistant" and text:
            return str(text)
    return ""


def _agent_json(pod: Pod, agent: str, prompt: str) -> dict[str, Any]:
    conv = pod.agents.run(agent, prompt, title="Resume analysis")
    conv_id = str(getattr(conv, "id", conv))
    body = _assistant_text(pod, conv_id)
    if not body:
        raise ValueError("empty agent response")
    return _extract_json(body)


def _heuristic_analysis(text: str, file_name: str) -> dict[str, Any]:
    skills = []
    catalog = [
        "React",
        "TypeScript",
        "JavaScript",
        "Node.js",
        "Python",
        "Docker",
        "AWS",
        "PostgreSQL",
        "MongoDB",
        "Git",
    ]
    lower = text.lower()
    for s in catalog:
        if s.lower() in lower:
            skills.append(s)
    name = file_name.replace(".pdf", "").replace("_", " ").replace(".txt", "")
    return {
        "candidateName": name[:40] or "Candidate",
        "summary": text[:220] if len(text) > 40 else "Resume uploaded for analysis.",
        "skills": skills or ["JavaScript", "Git"],
        "technologies": [{"name": s, "category": "General"} for s in skills[:8]],
        "experience": [],
        "projects": [],
        "education": [],
        "strengths": [],
        "growthAreas": [],
        "domains": ["Software Engineering"],
    }


async def analyze_resume(ctx: FunctionContext, data: AnalyzeResumeInput) -> AnalyzeResumeResult:
    pod = Pod.from_env()
    text = data.resume_text.strip()
    if len(text) < 20:
        raise ValueError("Resume text is too short to analyze.")

    analysis = _heuristic_analysis(text, data.file_name)
    source = "heuristic"
    prompt = (
        "Analyze this resume text and return JSON only.\n\n"
        f"Target role hint: {data.target_role or 'not specified'}\n\n"
        f"RESUME:\n{text[:14000]}"
    )
    try:
        analysis = _agent_json(pod, "resume-analyst", prompt)
        source = "llm"
    except Exception:
        pass

    resume_id: Optional[str] = None
    if data.persist:
        for row in pod.table("resumes").list_all():
            if row.get("is_primary"):
                pod.table("resumes").update(str(row["id"]), {"is_primary": False})
        row = pod.table("resumes").create(
            {
                "file_name": data.file_name,
                "title": "Primary resume",
                "is_primary": True,
                "extracted_text": text,
                "analysis": analysis,
                "processing_status": "completed",
            }
        )
        resume_id = str(row["id"])
        profiles = pod.table("career_profiles").list_all()
        if profiles:
            patch = {
                "active_resume_id": resume_id,
                "display_name": analysis.get("candidateName") or profiles[0].get("display_name"),
            }
            if analysis.get("skills"):
                patch["verified_skills"] = analysis.get("skills")
            pod.table("career_profiles").update(
                str(profiles[0]["id"]),
                patch,
            )

    return AnalyzeResumeResult(resume_id=resume_id, analysis=analysis, source=source)
