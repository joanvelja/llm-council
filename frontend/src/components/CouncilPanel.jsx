import ModelBadge from './ModelBadge';
import './CouncilPanel.css';

/**
 * Elegant panel displaying council members and chairman with provider logos.
 * Shows in a "gun-drum" carousel style.
 */
export default function CouncilPanel({ config }) {
    if (!config) return null;

    const { council_models, chairman_model, reasoning } = config;

    return (
        <div className="council-panel">
            <div className="panel-glass">
                {/* Council Members Section */}
                <div className="council-section">
                    <div className="section-label">
                        <span className="label-icon">⚖️</span>
                        <span className="label-text">Council</span>
                    </div>
                    <div className="council-carousel">
                        {council_models?.map((modelId, index) => (
                            <ModelBadge
                                key={index}
                                modelId={modelId}
                                size="md"
                            />
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="panel-divider" />

                {/* Chairman Section */}
                <div className="chairman-section">
                    <div className="section-label">
                        <span className="label-icon">🏛️</span>
                        <span className="label-text">Chairman</span>
                    </div>
                    <ModelBadge
                        modelId={chairman_model}
                        size="lg"
                        isChairman
                    />
                </div>

                {/* Reasoning Indicators */}
                {(reasoning?.stage1 || reasoning?.stage2) && (
                    <div className="reasoning-section">
                        <div className="reasoning-pills">
                            {reasoning?.stage1 && (
                                <span className="reasoning-pill" title="Reasoning enabled in Collection stage">
                                    🧠 Collection
                                </span>
                            )}
                            {reasoning?.stage2 && (
                                <span className="reasoning-pill" title="Reasoning enabled in Ranking stage">
                                    🧠 Ranking
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
