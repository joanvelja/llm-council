import './ConfigHeader.css';

/**
 * Displays active council configuration at top of conversation.
 */
export default function ConfigHeader({ config }) {
    if (!config) return null;

    const { council_models, chairman_model, reasoning } = config;

    // Extract model basename for cleaner display
    const getModelName = (modelId) => {
        if (!modelId) return 'Unknown';
        const parts = modelId.split('/');
        return parts.length > 1 ? parts[1] : modelId;
    };

    return (
        <div className="config-header">
            <div className="config-section">
                <span className="config-label">Council:</span>
                <div className="model-chips">
                    {council_models?.map((modelId, index) => (
                        <span key={index} className="model-chip" title={modelId}>
                            {getModelName(modelId)}
                        </span>
                    ))}
                </div>
            </div>

            <div className="config-section">
                <span className="config-label">Chairman:</span>
                <span className="model-chip chairman" title={chairman_model}>
                    {getModelName(chairman_model)}
                </span>
            </div>

            <div className="config-section reasoning-indicators">
                {reasoning?.stage1 && (
                    <span className="reasoning-badge" title="Reasoning enabled in Stage 1">
                        🧠 S1
                    </span>
                )}
                {reasoning?.stage2 && (
                    <span className="reasoning-badge" title="Reasoning enabled in Stage 2">
                        🧠 S2
                    </span>
                )}
            </div>
        </div>
    );
}
