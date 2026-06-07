"""OpenAI chat completion helpers."""


def normalize_prompt(prompt: str) -> str:
    import unicodedata

    return unicodedata.normalize("NFC", prompt.strip())


def build_chat_completion_kwargs(
    *,
    model_key: str,
    prompt: str,
    max_tokens: int,
) -> dict:
    """Build kwargs for AsyncOpenAI.chat.completions.create."""
    if model_key not in {"gpt-4o", "gpt-4o-mini"} and not model_key.startswith("gpt-"):
        raise ValueError(f"Unexpected OpenAI model_key: {model_key!r}")

    return {
        "model": model_key,
        "messages": [{"role": "user", "content": normalize_prompt(prompt)}],
        "max_tokens": max(1, min(max_tokens, 4096)),
    }