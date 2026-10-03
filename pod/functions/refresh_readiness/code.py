# input_type_name: RefreshReadinessInput
# output_type_name: RefreshReadinessResult
# function_name: refresh_readiness

from typing import Optional

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod


class RefreshReadinessInput(BaseModel):
    profile_id: Optional[str] = None


class RefreshReadinessResult(BaseModel):
    career_readiness: int = 0
    profile_id: Optional[str] = None


async def refresh_readiness(ctx: FunctionContext, data: RefreshReadinessInput) -> RefreshReadinessResult:
    pod = Pod.from_env()
    match_score = 0
    for row in pod.table("job_matches").list_all():
        if row.get("is_active"):
            match_score = int(row.get("match_score") or 0)
            break

    plan_boost = 0
    for row in pod.table("career_plans").list_all():
        if row.get("is_active"):
            plan_boost = int(row.get("progress_percent") or 0) // 5
            break

    interview_boost = 0
    sessions = pod.table("interview_sessions").list_all()
    if sessions:
        latest = sessions[0].get("session_payload") or {}
        evaluation = latest.get("evaluation") or {}
        interview_boost = int(evaluation.get("overallScore") or 0) // 10

    readiness = max(0, min(100, match_score // 2 + plan_boost + interview_boost))

    profiles = pod.table("career_profiles").list_all()
    if not profiles:
        return RefreshReadinessResult(career_readiness=readiness)
    profile = profiles[0]
    if data.profile_id:
        for candidate in profiles:
            if str(candidate.get("id")) == data.profile_id:
                profile = candidate
                break
    pod.table("career_profiles").update(str(profile["id"]), {"career_readiness": readiness})
    return RefreshReadinessResult(career_readiness=readiness, profile_id=str(profile["id"]))
