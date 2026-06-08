"""Estimated per-model token pricing for admin cost tracking (USD).

Not exposed publicly. Actual provider billing may differ — all dashboard
values are labeled as estimated.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelPricingEntry:
    model_key: str
    display_name: str
    provider_key: str
    input_cost_per_1m_tokens_usd: float | None
    output_cost_per_1m_tokens_usd: float | None
    currency: str
    pricing_source_note: str
    last_updated: str


PRICING_LAST_UPDATED = "2026-06-08"
PRICING_SOURCE_NOTE = (
    "Published provider list prices; estimated for admin visibility only"
)

# Rates approximate public API pricing at last_updated. Nullable when unknown.
MODEL_PRICING: dict[str, ModelPricingEntry] = {
    "gpt-4o": ModelPricingEntry(
        model_key="gpt-4o",
        display_name="GPT-4o",
        provider_key="openai",
        input_cost_per_1m_tokens_usd=2.50,
        output_cost_per_1m_tokens_usd=10.00,
        currency="USD",
        pricing_source_note=PRICING_SOURCE_NOTE,
        last_updated=PRICING_LAST_UPDATED,
    ),
    "claude-sonnet-4-6": ModelPricingEntry(
        model_key="claude-sonnet-4-6",
        display_name="Claude Sonnet 4.6",
        provider_key="anthropic",
        input_cost_per_1m_tokens_usd=3.00,
        output_cost_per_1m_tokens_usd=15.00,
        currency="USD",
        pricing_source_note=PRICING_SOURCE_NOTE,
        last_updated=PRICING_LAST_UPDATED,
    ),
    "gemini-2.5-flash": ModelPricingEntry(
        model_key="gemini-2.5-flash",
        display_name="Gemini 2.5 Flash",
        provider_key="google",
        input_cost_per_1m_tokens_usd=0.15,
        output_cost_per_1m_tokens_usd=0.60,
        currency="USD",
        pricing_source_note=PRICING_SOURCE_NOTE,
        last_updated=PRICING_LAST_UPDATED,
    ),
    "deepseek-chat": ModelPricingEntry(
        model_key="deepseek-chat",
        display_name="DeepSeek Chat",
        provider_key="deepseek",
        input_cost_per_1m_tokens_usd=0.27,
        output_cost_per_1m_tokens_usd=1.10,
        currency="USD",
        pricing_source_note=PRICING_SOURCE_NOTE,
        last_updated=PRICING_LAST_UPDATED,
    ),
    "grok-4.3": ModelPricingEntry(
        model_key="grok-4.3",
        display_name="Grok",
        provider_key="xai",
        input_cost_per_1m_tokens_usd=3.00,
        output_cost_per_1m_tokens_usd=15.00,
        currency="USD",
        pricing_source_note=PRICING_SOURCE_NOTE,
        last_updated=PRICING_LAST_UPDATED,
    ),
}


def get_model_pricing(model_key: str) -> ModelPricingEntry | None:
    return MODEL_PRICING.get(model_key)


def estimate_response_cost_usd(
    *,
    model_key: str,
    input_tokens: int | None,
    output_tokens: int | None,
) -> float | None:
    pricing = get_model_pricing(model_key)
    if pricing is None:
        return None
    if pricing.input_cost_per_1m_tokens_usd is None or pricing.output_cost_per_1m_tokens_usd is None:
        return None
    if input_tokens is None and output_tokens is None:
        return None
    inp = float(input_tokens or 0)
    out = float(output_tokens or 0)
    cost = (inp * pricing.input_cost_per_1m_tokens_usd / 1_000_000) + (
        out * pricing.output_cost_per_1m_tokens_usd / 1_000_000
    )
    return round(cost, 8)
