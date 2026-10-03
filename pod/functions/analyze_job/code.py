# input_type_name: AnalyzeJobInput
# output_type_name: AnalyzeJobResult
# function_name: analyze_job

from __future__ import annotations

import json
import re
from typing import Any, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class AnalyzeJobInput(BaseModel):
    job_text: str
    role_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    source_url: Optional[str] = None
    persist: bool = True


class AnalyzeJobResult(BaseModel):
    job_id: Optional[str] = None
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
    conv = pod.agents.run(agent, prompt, title="Job analysis")
    conv_id = str(getattr(conv, "id", conv))
    body = _assistant_text(pod, conv_id)
    if not body:
        raise ValueError("empty agent response")
    return _extract_json(body)


def _heuristic_job(text: str, company: str, role: str) -> dict[str, Any]:
    return {
        "roleTitle": role or "Software Engineer",
        "company": company or "Target Company",
        "seniority": "Mid-Level",
        "experienceRequired": "2-4 years",
        "summary": text[:200],
        "requiredSkills": [
            {"name": "React", "category": "Frontend", "priority": "High"},
            {"name": "TypeScript", "category": "Language", "priority": "High"},
            {"name": "Node.js", "category": "Backend", "priority": "High"},
        ],
        "preferredSkills": [{"name": "AWS", "category": "Cloud"}],
        "responsibilities": [text[:160]],
    }


async def analyze_job(ctx: FunctionContext, data: AnalyzeJobInput) -> AnalyzeJobResult:
    pod = Pod.from_env()
    text = data.job_text.strip()
    if len(text) < 30:
        raise ValueError("Job description is too short.")

    role = data.role_title or "Software Engineer"
    company = data.company or "Target Company"
    analysis = _heuristic_job(text, company, role)
    source = "heuristic"
    prompt = (
        "Parse this job description. Return JSON only.\n\n"
        f"Hints: company={company}, role={role}, location={data.location or 'unknown'}\n\n"
        f"JOB DESCRIPTION:\n{text[:14000]}"
    )
    try:
        analysis = _agent_json(pod, "job-analyst", prompt)
        source = "llm"
    except Exception:
        pass

    job_id: Optional[str] = None
    if data.persist:
        row = pod.table("target_jobs").create(
            {
                "role_title": analysis.get("roleTitle") or role,
                "company": analysis.get("company") or company,
                "location": data.location or "Remote",
                "seniority": analysis.get("seniority") or "Mid-Level",
                "experience_required": analysis.get("experienceRequired") or "2-4 years",
                "raw_description": text,
                "source_url": data.source_url,
                "job_analysis": analysis,
            }
        )
        job_id = str(row["id"])
        profiles = pod.table("career_profiles").list_all()
        if profiles:
            pod.table("career_profiles").update(
                str(profiles[0]["id"]),
                {
                    "active_job_id": job_id,
                    "target_role": analysis.get("roleTitle") or role,
                },
            )

    return AnalyzeJobResult(job_id=job_id, analysis=analysis, source=source)
