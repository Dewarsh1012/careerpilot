# input_type_name: EvaluateInterviewInput
# output_type_name: EvaluateInterviewResult
# function_name: evaluate_interview

from __future__ import annotations

import json
import re
from typing import Any, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class EvaluateInterviewInput(BaseModel):
    question: str
    answer: str
    topic: Optional[str] = None
    resume_id: Optional[str] = None
    job_id: Optional[str] = None
    persist: bool = True


class EvaluateInterviewResult(BaseModel):
    session_id: Optional[str] = None
    evaluation: dict[str, Any] = Field(default_factory=dict)
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


def _heuristic_eval(question: str, answer: str, topic: str) -> dict[str, Any]:
    words = len(answer.split())
    score = min(10.0, max(4.0, words / 15))
    return {
        "overallScore": round(score, 1),
        "grade": "Good Answer" if score >= 7 else "Needs Depth",
        "breakdown": {
            "correctness": round(score, 1),
            "completeness": round(min(10, words / 12), 1),
            "technicalDepth": round(score - 0.5, 1),
            "clarity": round(min(10, words / 10), 1),
        },
        "strengths": ["Clear effort on the response."],
        "missingConcepts": ["Add metrics and a concrete example."],
        "suggestedImprovement": "Use Problem → Approach → Tradeoff → Result.",
        "modelAnswer": f"A strong answer for {topic} ties concepts to the question explicitly.",
        "followUpQuestion": "How would you validate this in production?",
    }


async def evaluate_interview(ctx: FunctionContext, data: EvaluateInterviewInput) -> EvaluateInterviewResult:
    pod = Pod.from_env()
    topic = data.topic or "General"
    answer = data.answer.strip()
    if len(answer) < 8:
        raise ValueError("Answer is too short to evaluate.")

    context_bits: list[str] = []
    if data.resume_id:
        try:
            resume = pod.table("resumes").get(data.resume_id)
            analysis = resume.get("analysis") or {}
            context_bits.append(f"Resume skills: {analysis.get('skills', [])}")
            context_bits.append(f"Projects: {analysis.get('projects', [])}")
        except Exception:
            pass
    if data.job_id:
        try:
            job = pod.table("target_jobs").get(data.job_id)
            context_bits.append(f"Target role: {job.get('role_title')}")
            context_bits.append(f"Job analysis: {job.get('job_analysis')}")
        except Exception:
            pass

    evaluation = _heuristic_eval(data.question, answer, topic)
    source = "heuristic"
    prompt = (
        "Evaluate this interview answer. Return JSON only.\n\n"
        f"Topic: {topic}\n"
        f"Question: {data.question}\n"
        f"Answer: {answer[:8000]}\n\n"
        f"Context:\n" + "\n".join(context_bits)
    )
    try:
        conv = pod.agents.run("interview-evaluator", prompt, title="Interview eval")
        conv_id = str(getattr(conv, "id", conv))
        body = _assistant_text(pod, conv_id)
        if body:
            evaluation = _extract_json(body)
            source = "llm"
    except Exception:
        pass

    session_id: Optional[str] = None
    if data.persist:
        row = pod.table("interview_sessions").create(
            {
                "question": data.question,
                "answer": answer,
                "topic": topic,
                "mode": "text",
                "session_payload": {"evaluation": evaluation, "source": source},
            }
        )
        session_id = str(row["id"])
        try:
            pod.functions.run("refresh_readiness", {})
        except Exception:
            pass

    return EvaluateInterviewResult(session_id=session_id, evaluation=evaluation, source=source)
