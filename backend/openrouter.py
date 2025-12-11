"""OpenRouter API client for making LLM requests."""

import httpx
from typing import List, Dict, Any, Optional
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL, PROVIDER_REASONING_DEFAULTS


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0,
    include_reasoning: bool = False,
    reasoning_override: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds
        include_reasoning: Whether to include reasoning parameters
        reasoning_override: Optional dict to override default reasoning config

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    # Add reasoning parameters if requested and supported
    if include_reasoning:
        if reasoning_override is not None:
            # Use explicit override
            payload["reasoning"] = reasoning_override
        else:
            # Find partial matches for model prefix in defaults
            # We process keys sorted by length (descending) to match the most specific prefix first
            # e.g. 'google/gemini-2.0-flash-thinking' matches before 'google'
            sorted_prefixes = sorted(
                PROVIDER_REASONING_DEFAULTS.keys(), key=len, reverse=True
            )

            for prefix in sorted_prefixes:
                if model.startswith(prefix):
                    payload["reasoning"] = PROVIDER_REASONING_DEFAULTS[prefix]
                    break

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL, headers=headers, json=payload
            )
            response.raise_for_status()

            data = response.json()
            message = data["choices"][0]["message"]

            return {
                "content": message.get("content"),
                "reasoning_details": message.get("reasoning_details"),
            }

    except Exception as e:
        print(f"Error querying model {model}: {e}")
        return None


async def query_models_parallel(
    models: List[str], messages: List[Dict[str, str]], include_reasoning: bool = False
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    import asyncio

    # Create tasks for all models
    tasks = [
        query_model(model, messages, include_reasoning=include_reasoning)
        for model in models
    ]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    return {model: response for model, response in zip(models, responses)}
