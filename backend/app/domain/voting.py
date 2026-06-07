def can_cast_vote(comparison_status: str, response_status: str, has_existing_vote: bool) -> None:
    if has_existing_vote:
        raise ValueError("Vote already cast for this comparison")
    if comparison_status not in {"completed", "partial"}:
        raise ValueError("Comparison is not ready for voting")
    if response_status != "success":
        raise ValueError("Cannot vote for a failed response")
