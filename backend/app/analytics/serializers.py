from app.models.model import AIModel
from app.schemas.analytics import PreferenceItem


def build_preference_items(rows: list[tuple[AIModel, int]]) -> tuple[list[PreferenceItem], int]:
    total_votes = sum(count for _, count in rows)
    if total_votes == 0:
        return [], 0

    items: list[PreferenceItem] = []
    for model, vote_count in sorted(rows, key=lambda row: row[0].name_ar):
        share = round(100.0 * vote_count / total_votes, 2)
        items.append(
            PreferenceItem(
                model_id=str(model.id),
                model_key=model.key,
                name_ar=model.name_ar,
                provider_key=model.provider.key,
                vote_count=vote_count,
                preference_share_pct=share,
            )
        )
    return items, total_votes
