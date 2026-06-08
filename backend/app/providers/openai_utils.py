"""OpenAI chat completion helpers."""


def normalize_prompt(prompt: str) -> str:
    import unicodedata

    return unicodedata.normalize("NFC", prompt.strip())


def build_chat_completion_kwargs(
    *,
    model_key: str,
    prompt: str,
    max_tokens: int,
    user_content: str | list[dict] | None = None,
) -> dict:
    """Build kwargs for AsyncOpenAI.chat.completions.create."""
    if model_key not in {"gpt-4o", "gpt-4o-mini"} and not model_key.startswith("gpt-"):
        raise ValueError(f"Unexpected OpenAI model_key: {model_key!r}")

    content = user_content if user_content is not None else normalize_prompt(prompt)
    return {
        "model": model_key,
        "messages": [{"role": "user", "content": content}],
        "max_tokens": max(1, min(max_tokens, 4096)),
    }