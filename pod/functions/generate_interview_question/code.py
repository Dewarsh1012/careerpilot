# input_type_name: GenerateInterviewQuestionInput
# output_type_name: GenerateInterviewQuestionResult
# function_name: generate_interview_question

from __future__ import annotations

import json
import re
from typing import Any, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class GenerateInterviewQuestionInput(BaseModel):
    focus_topic: Optional[str] = None
    resume_id: Optional[str] = None
    job_id: Optional[str] = None


class GenerateInterviewQuestionResult(BaseModel):
    question: str
    topic: str
    difficulty: str = "Medium"
    hint: str = ""
    expected_key_points: list[str] = Field(default_factory=list)
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


def _default_question(topic: str) -> GenerateInterviewQuestionResult:
    return GenerateInterviewQuestionResult(
        question=f"Explain how you would apply {topic} in a production system for your target role.",
        topic=topic,
        difficulty="Medium",
        hint="Structure: context → approach → tradeoffs → outcome.",
        expected_key_points=[
            f"{topic} fundamentals",
            "Concrete project example",
            "Tradeoffs or scaling note",
        ],
        source="heuristic",
    )


async def generate_interview_question(
    ctx: FunctionContext, data: GenerateInterviewQuestionInput
) -> GenerateInterviewQuestionResult:
    pod = Pod.from_env()
    topic = data.focus_topic or "System Design"
    context_bits: list[str] = []

    active_match = None
    for row in pod.table("job_matches").list_all():
        if row.get("is_active"):
            active_match = row
            break
    if active_match:
        payload = active_match.get("match_payload") or {}
        missing = payload.get("missingSkills") or []
        if missing and not data.focus_topic:
            topic = missing[0].get("name") or topic
        context_bits.append(f"Match score: {active_match.get('match_score')}")
        context_bits.append(f"Missing skills: {missing}")

    if data.resume_id:
        try:
            resume = pod.table("resumes").get(data.resume_id)
            context_bits.append(f"Resume analysis: {resume.get('analysis')}")
        except Exception:
            pass
    if data.job_id:
        try:
            job = pod.table("target_jobs").get(data.job_id)
            context_bits.append(f"Job: {job.get('role_title')} at {job.get('company')}")
            context_bits.append(f"Requirements: {job.get('job_analysis')}")
        except Exception:
            pass

    fallback = _default_question(topic)
    prompt = (
        "Generate one interview question. Return JSON only.\n\n"
        f"Preferred topic: {topic}\n\n"
        + "\n".join(context_bits)
    )
    try:
        conv = pod.agents.run("interview-coach", prompt, title="Interview question")
        conv_id = str(getattr(conv, "id", conv))
        body = _assistant_text(pod, conv_id)
        if body:
            parsed = _extract_json(body)
            return GenerateInterviewQuestionResult(
                question=str(parsed.get("question") or fallback.question),
                topic=str(parsed.get("topic") or topic),
                difficulty=str(parsed.get("difficulty") or "Medium"),
                hint=str(parsed.get("hint") or fallback.hint),
                expected_key_points=list(parsed.get("expectedKeyPoints") or parsed.get("expected_key_points") or fallback.expected_key_points),
                source="llm",
            )
    except Exception:
        pass

    return fallback
