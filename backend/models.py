"""Model validation and reasoning capability detection."""

import httpx
import time
from typing import Dict, Any, Optional, List, Set
from .config import (
    PROVIDER_REASONING_DEFAULTS,
    PROVIDER_EFFORT_LEVELS,
)


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
        # Find matching provider prefix for effort levels
        sorted_prefixes = sorted(PROVIDER_EFFORT_LEVELS.keys(), key=len, reverse=True)
        for prefix in sorted_prefixes:
            if model_id.startswith(prefix):
                return PROVIDER_EFFORT_LEVELS[prefix].copy()
        # Default for unspecified effort-based providers
        return ["low", "high"]
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


def get_max_tokens_range(model_id: str) -> Optional[Dict[str, int]]:
    """
    Get min/max token range for token-based reasoning providers.

    Returns:
        {"min": int, "max": int, "default": int} or None if not applicable
    """
    config = get_reasoning_config(model_id)
    if config is None or "max_tokens" not in config:
        return None

    # Anthropic Claude: 1024-64000 range
    if model_id.startswith("anthropic"):
        return {"min": 1024, "max": 64000, "default": config.get("max_tokens", 4096)}

    # Google thinking models: similar range
    if model_id.startswith("google"):
        return {"min": 1024, "max": 32000, "default": config.get("max_tokens", 4096)}

    # Generic fallback
    return {"min": 1024, "max": 16000, "default": config.get("max_tokens", 4096)}


# Module-level cache for model list (avoid repeated API calls)
_model_cache: Optional[Set[str]] = None
_cache_timestamp: Optional[float] = None
CACHE_TTL_SECONDS = 300  # 5 minutes


async def _get_available_models() -> Set[str]:
    """Fetch and cache the list of available models from OpenRouter."""
    global _model_cache, _cache_timestamp

    now = time.time()

    # Return cached if still valid
    if _model_cache is not None and _cache_timestamp is not None:
        if now - _cache_timestamp < CACHE_TTL_SECONDS:
            return _model_cache

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://openrouter.ai/api/v1/models")
            response.raise_for_status()
            data = response.json()
            _model_cache = {m["id"] for m in data.get("data", [])}
            _cache_timestamp = now
            return _model_cache
    except Exception:
        # On error, return cached if available, else empty set
        if _model_cache is not None:
            return _model_cache
        return set()


async def validate_model(model_id: str) -> Dict[str, Any]:
    """
    Validate that a model exists via OpenRouter /models endpoint (no generation cost).

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
            "max_tokens_range": dict | None,
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
        "max_tokens_range": get_max_tokens_range(model_id),
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

    # Check against cached model list
    available_models = await _get_available_models()
    if not available_models:
        result["error"] = "Could not fetch model list from OpenRouter"
        return result

    if model_id in available_models:
        result["valid"] = True
    else:
        result["error"] = f"Model '{model_id}' not found on OpenRouter"

    return result
