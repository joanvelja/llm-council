"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "openai/gpt-5.1",
    "google/gemini-3-pro-preview",
    "anthropic/claude-opus-4.5",
    "x-ai/grok-4",
    "deepseek/deepseek-v3.2-speciale",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "google/gemini-3-pro-preview"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


# Data directory for conversation storage
DATA_DIR = "data/conversations"

# Reasoning configuration
# Controls whether to request reasoning for Stage 1 (Collection)
REASONING_IN_STAGE1 = True

# Controls whether to request reasoning for Stage 2 (Ranking)
REASONING_IN_STAGE2 = True


# Defaults for reasoning models (Provider-based)
# Keys are model prefixes. Longest matching prefix check is used.
PROVIDER_REASONING_DEFAULTS = {
    # OpenAI: Standardized on 'effort'
    "openai": {"effort": "medium"},
    # xAI (Grok): Standardized on 'effort'
    "x-ai": {"effort": "medium"},
    # Google: Exceptions for older/specific models first, then general default
    "google/gemini-2.0-flash-thinking": {
        "max_tokens": 4096
    },  # Flash Thinking uses max_tokens
    "google": {
        "effort": "high"
    },  # Default for Gemini 3+ is effort (no mid supported yet, using high)
    # Anthropic: Standardized on 'max_tokens' for thinking
    "anthropic": {"max_tokens": 4096},
    # DeepSeek: Uses discrete exclude toggles or implicit CoT
    "deepseek": {"exclude": False},
    # Mistral: Anticipating effort support
    "mistral": {"effort": "medium"},
}
