# input_type_name: ComputeJobMatchInput
# output_type_name: ComputeJobMatchResult
# function_name: compute_job_match

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class ComputeJobMatchInput(BaseModel):
    resume_id: str
    job_id: str
    user_id: Optional[str] = None


class ComputeJobMatchResult(BaseModel):
    match_id: Optional[str] = None
    match_score: int = 0
    readiness_level: str = "Needs Target Prep"
    plan_id: Optional[str] = None


def _norm(name: str) -> str:
    return name.strip().lower()


def _skill_names(analysis: dict[str, Any] | None) -> set[str]:
    if not analysis:
        return set()
    skills = analysis.get("skills") or []
    out = {_norm(str(s)) for s in skills if str(s).strip()}
    for tech in analysis.get("technologies") or []:
        if isinstance(tech, dict) and tech.get("name"):
            out.add(_norm(str(tech["name"])))
    return out


def _required_skills(job_analysis: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not job_analysis:
        return []
    return list(job_analysis.get("requiredSkills") or [])


def _build_match(resume_skills: set[str], job_row: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    analysis = job_row.get("job_analysis") or {}
    required = _required_skills(analysis)
    matched, partial, missing = [], [], []
    for item in required:
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        key = _norm(name)
        category = str(item.get("category") or "General")
        priority = str(item.get("priority") or "Medium")
        if key in resume_skills:
            matched.append(
                {
                    "name": name,
                    "category": category,
                    "status": "matched",
                    "evidence": "Listed on primary resume",
                    "isRequired": True,
                }
            )
        elif any(key in s or s in key for s in resume_skills):
            partial.append(
                {
                    "name": name,
                    "category": category,
                    "status": "partial",
                    "currentLevel": "Familiar",
                    "requiredLevel": "Proficient",
                    "gapExplanation": f"Resume mentions related tooling but not {name} explicitly.",
                    "recommendation": f"Add a project bullet demonstrating {name}.",
                    "isRequired": True,
                }
            )
        else:
            missing.append(
                {
                    "name": name,
                    "category": category,
                    "status": "missing",
                    "importance": priority if priority in {"High", "Medium"} else "High",
                    "impactOnRole": f"Role expects hands-on {name}.",
                    "recommendation": f"Complete a focused milestone for {name}.",
                    "isRequired": True,
                }
            )
    total = max(1, len(required))
    score = int(round((len(matched) + 0.5 * len(partial)) / total * 100))
    score = max(0, min(100, score))
    if score >= 85:
        readiness = "Interview Ready"
    elif score >= 70:
        readiness = "Strong Fit"
    elif score >= 55:
        readiness = "Needs Target Prep"
    else:
        readiness = "Major Upskilling"
    next_move = (
        f"Close {missing[0]['name']} gap first."
        if missing
        else "Schedule a mock interview for this role."
    )
    payload = {
        "matchedSkills": matched,
        "partialSkills": partial,
        "missingSkills": missing,
        "readinessLevel": readiness,
        "nextMove": next_move,
    }
    return score, payload


def _default_plan(target_role: str, job_id: str, gaps: list[str]) -> dict[str, Any]:
    gap_tasks = gaps[:3] or ["System design fundamentals", "Cloud deployment", "CI/CD"]
    phases = [
        {
            "id": "phase_1",
            "title": "Foundation Refresh",
            "description": "Strengthen core stack skills referenced in the job description.",
            "estimatedWeeks": "1-2",
            "tasks": [
                {
                    "id": "t1",
                    "title": f"Deep-dive {gap_tasks[0]}",
                    "skill": gap_tasks[0],
                    "priority": "High",
                    "estimatedHours": 6,
                    "status": "in_progress",
                    "description": "Build a small demo and document learnings.",
                    "deliverable": "GitHub repo + README",
                }
            ],
        },
        {
            "id": "phase_2",
            "title": "Containerization & DevOps",
            "description": "Ship the demo with Docker and a CI pipeline.",
            "estimatedWeeks": "2-3",
            "tasks": [
                {
                    "id": "t2",
                    "title": "Multi-stage Dockerfile milestone",
                    "skill": "Docker",
                    "priority": "High",
                    "estimatedHours": 8,
                    "status": "todo",
                    "description": "Containerize the demo and publish image tags.",
                    "deliverable": "Production Dockerfile + compose file",
                }
            ],
        },
    ]
    total_tasks = sum(len(p["tasks"]) for p in phases)
    return {
        "target_role": target_role,
        "target_job_id": job_id,
        "skill_gaps": gap_tasks,
        "phases": phases,
        "total_tasks": total_tasks,
        "completed_tasks": 0,
        "progress_percent": 22,
        "current_phase": "Phase 2 of 5",
        "next_task": "Complete Multi-Stage Dockerfile Milestone (Phase 2)",
    }


async def compute_job_match(ctx: FunctionContext, data: ComputeJobMatchInput) -> ComputeJobMatchResult:
    pod = Pod.from_env()
    resume = pod.table("resumes").get(data.resume_id)
    job = pod.table("target_jobs").get(data.job_id)
    resume_skills = _skill_names(resume.get("analysis"))
    score, payload = _build_match(resume_skills, job)

    for row in pod.table("job_matches").list_all():
        if row.get("is_active"):
            pod.table("job_matches").update(str(row["id"]), {"is_active": False})

    match_row = pod.table("job_matches").create(
        {
            "job_id": data.job_id,
            "resume_id": data.resume_id,
            "job_title": job.get("role_title") or "",
            "company": job.get("company") or "",
            "match_score": score,
            "readiness_level": payload["readinessLevel"],
            "next_move": payload["nextMove"],
            "match_payload": payload,
            "is_active": True,
        }
    )
    match_id = str(match_row["id"])

    profiles = pod.table("career_profiles").list_all()
    if profiles:
        pod.table("career_profiles").update(
            str(profiles[0]["id"]),
            {
                "career_readiness": score,
                "active_job_id": data.job_id,
                "active_resume_id": data.resume_id,
                "active_match_id": match_id,
            },
        )

    gaps = [m["name"] for m in payload.get("missingSkills", [])]
    plan_body = _default_plan(job.get("role_title") or "Target role", data.job_id, gaps)
    for row in pod.table("career_plans").list_all():
        if row.get("is_active"):
            pod.table("career_plans").update(str(row["id"]), {"is_active": False})
    plan_row = pod.table("career_plans").create(
        {
            "target_role": plan_body["target_role"],
            "target_job_id": data.job_id,
            "progress_percent": plan_body["progress_percent"],
            "current_phase": plan_body["current_phase"],
            "next_task": plan_body["next_task"],
            "plan_payload": plan_body,
            "is_active": True,
        }
    )

    return ComputeJobMatchResult(
        match_id=match_id,
        match_score=score,
        readiness_level=payload["readinessLevel"],
        plan_id=str(plan_row["id"]),
    )
