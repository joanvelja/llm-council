"""Model validation and reasoning capability detection."""

import httpx
from typing import Dict, Any, Optional, List
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL, PROVIDER_REASONING_DEFAULTS


def get_reasoning_config(model_id: str) -> Optional[Dict[str, Any]]:
    """
    Get default reasoning config based on provider prefix.

    Uses longest-prefix matching to find the most specific config.

    Args:
        model_id: OpenRouter model identifier (e.g., "openai/gpt-5.1")

    Returns:
        Reasoning config dict or None if provider doesn't support reasoning
    """
    # Sort by length (descending) to match most specific prefix first
    sorted_prefixes = sorted(PROVIDER_REASONING_DEFAULTS.keys(), key=len, reverse=True)

    for prefix in sorted_prefixes:
        if model_id.startswith(prefix):
            return PROVIDER_REASONING_DEFAULTS[prefix].copy()

    return None


def supports_reasoning(model_id: str) -> bool:
    """Check if a model supports reasoning based on its provider."""
    return get_reasoning_config(model_id) is not None


def get_available_effort_levels(model_id: str) -> List[str]:
    """
    Get available reasoning effort levels for a model.

    Returns:
        List of effort level strings, or empty list if not supported
    """
    config = get_reasoning_config(model_id)
    if config is None:
        return []

    # Check if this provider uses effort-based reasoning
    if "effort" in config:
        # Standard effort levels for providers that support it
        return ["low", "medium", "high"]
    elif "max_tokens" in config:
        # Token-based providers don't have effort levels
        return []
    elif "exclude" in config:
        # DeepSeek uses boolean toggle, no effort levels
        return []

    return []


def get_reasoning_param_type(model_id: str) -> Optional[str]:
    """
    Determine what type of reasoning parameter this model uses.

    Returns:
        "effort" | "max_tokens" | "exclude" | None
    """
    config = get_reasoning_config(model_id)
    if config is None:
        return None

    if "effort" in config:
        return "effort"
    elif "max_tokens" in config:
        return "max_tokens"
    elif "exclude" in config:
        return "exclude"

    return None


async def validate_model(model_id: str) -> Dict[str, Any]:
    """
    Validate that a model exists via OpenRouter and return its capabilities.

    Makes a minimal request to OpenRouter to check if the model is valid.

    Args:
        model_id: OpenRouter model identifier

    Returns:
        Dict with validation result and capabilities:
        {
            "valid": bool,
            "model_id": str,
            "supports_reasoning": bool,
            "reasoning_param_type": str | None,
            "effort_levels": list[str],
            "default_config": dict | None,
            "error": str | None
        }
    """
    result = {
        "valid": False,
        "model_id": model_id,
        "supports_reasoning": supports_reasoning(model_id),
        "reasoning_param_type": get_reasoning_param_type(model_id),
        "effort_levels": get_available_effort_levels(model_id),
        "default_config": get_reasoning_config(model_id),
        "error": None,
    }

    if not model_id or not model_id.strip():
        result["error"] = "Model ID cannot be empty"
        return result

    # Validate format (should be provider/model)
    if "/" not in model_id:
        result["error"] = "Model ID should be in format 'provider/model'"
        return result

    # Make a minimal request to validate the model exists
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    # Use a minimal prompt to check if model is accessible
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 1,  # Minimize cost/time
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                OPENROUTER_API_URL, headers=headers, json=payload
            )

            if response.status_code == 200:
                result["valid"] = True
            elif response.status_code == 400:
                # Parse error message from OpenRouter
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", {}).get(
                        "message", "Invalid model"
                    )
                    result["error"] = error_msg
                except Exception:
                    result["error"] = "Invalid model identifier"
            elif response.status_code == 401:
                result["error"] = "API key invalid or missing"
            elif response.status_code == 404:
                result["error"] = f"Model '{model_id}' not found"
            else:
                result["error"] = f"Validation failed (HTTP {response.status_code})"

    except httpx.TimeoutException:
        result["error"] = "Validation timed out"
    except Exception as e:
        result["error"] = f"Validation error: {str(e)}"

    return result
