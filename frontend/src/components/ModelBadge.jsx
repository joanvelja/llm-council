import './ModelBadge.css';

/**
 * Provider logo mapping - maps provider prefix to logo file
 */
const PROVIDER_LOGOS = {
    'openai': '/oai.png',
    'anthropic': '/anth.png',
    'google': '/gemini.jpg',
    'deepseek': '/deepseek.png',
    'x-ai': '/grok.png',
    'kimi': '/kimi.png',
    'meta': '/meta.png',
    'mistral': null, // No logo yet
    'qwen': null,
};

/**
 * Get provider logo path from model ID
 */
function getProviderLogo(modelId) {
    if (!modelId) return null;
    const provider = modelId.split('/')[0];
    return PROVIDER_LOGOS[provider] || null;
}

/**
 * Get display name from model ID
 */
function getModelDisplayName(modelId) {
    if (!modelId) return 'Unknown';
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[1] : modelId;
}

/**
 * Reusable badge displaying provider logo and model name.
 */
export default function ModelBadge({
    modelId,
    size = 'md', // 'sm' | 'md' | 'lg'
    isChairman = false,
    showName = true,
}) {
    const logo = getProviderLogo(modelId);
    const displayName = getModelDisplayName(modelId);
    const provider = modelId?.split('/')[0] || 'unknown';

    return (
        <div
            className={`model-badge ${size} ${isChairman ? 'chairman' : ''}`}
            title={modelId}
        >
            <div className="badge-avatar">
                {logo ? (
                    <img src={logo} alt={provider} className="badge-logo" />
                ) : (
                    <span className="badge-initial">
                        {provider.charAt(0).toUpperCase()}
                    </span>
                )}
                {isChairman && <span className="chairman-crown">👑</span>}
            </div>
            {showName && (
                <span className="badge-name">{displayName}</span>
            )}
        </div>
    );
}

export { getProviderLogo, getModelDisplayName };
