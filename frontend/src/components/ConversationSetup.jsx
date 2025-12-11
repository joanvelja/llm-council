import { useState, useCallback } from 'react';
import ModelConfigPanel from './ModelConfigPanel';
import './ConversationSetup.css';

/**
 * Modal for configuring council before starting a conversation.
 */
export default function ConversationSetup({ onStart, onCancel }) {
    // Global reasoning toggles
    const [reasoningStage1, setReasoningStage1] = useState(true);
    const [reasoningStage2, setReasoningStage2] = useState(true);

    // Council models state
    const [councilModels, setCouncilModels] = useState([
        { id: 'openai/gpt-5.1', reasoningConfig: { enabled: true, effort: 'medium' }, validationResult: null },
        { id: 'google/gemini-3-pro-preview', reasoningConfig: { enabled: true, effort: 'high' }, validationResult: null },
        { id: 'anthropic/claude-opus-4.5', reasoningConfig: { enabled: true }, validationResult: null },
    ]);

    // Chairman state
    const [chairmanModel, setChairmanModel] = useState({
        id: 'google/gemini-3-pro-preview',
        reasoningConfig: { enabled: true, effort: 'high' },
        validationResult: null,
    });

    const handleCouncilModelChange = useCallback((index, newId, validationResult) => {
        setCouncilModels(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], id: newId, validationResult };
            return updated;
        });
    }, []);

    const handleCouncilReasoningChange = useCallback((index, config) => {
        setCouncilModels(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], reasoningConfig: config };
            return updated;
        });
    }, []);

    const handleAddModel = () => {
        setCouncilModels(prev => [
            ...prev,
            { id: '', reasoningConfig: { enabled: true, effort: 'medium' }, validationResult: null },
        ]);
    };

    const handleRemoveModel = (index) => {
        setCouncilModels(prev => prev.filter((_, i) => i !== index));
    };

    const handleChairmanChange = useCallback((newId, validationResult) => {
        setChairmanModel(prev => ({ ...prev, id: newId, validationResult }));
    }, []);

    const handleChairmanReasoningChange = useCallback((config) => {
        setChairmanModel(prev => ({ ...prev, reasoningConfig: config }));
    }, []);

    const handleStart = () => {
        // Build config object
        const config = {
            council_models: councilModels.map(m => m.id).filter(id => id),
            chairman_model: chairmanModel.id,
            reasoning: {
                stage1: reasoningStage1,
                stage2: reasoningStage2,
                model_overrides: {},
            },
        };

        // Add per-model reasoning overrides
        councilModels.forEach(model => {
            if (model.validationResult?.supports_reasoning && model.reasoningConfig?.enabled) {
                const paramType = model.validationResult.reasoning_param_type;
                if (paramType === 'effort') {
                    config.reasoning.model_overrides[model.id] = {
                        effort: model.reasoningConfig.effort || 'medium',
                    };
                }
            }
        });

        // Add chairman reasoning override
        if (chairmanModel.validationResult?.supports_reasoning && chairmanModel.reasoningConfig?.enabled) {
            const paramType = chairmanModel.validationResult.reasoning_param_type;
            if (paramType === 'effort') {
                config.reasoning.model_overrides[chairmanModel.id] = {
                    effort: chairmanModel.reasoningConfig.effort || 'medium',
                };
            }
        }

        onStart(config);
    };

    // Check if we can start (at least one valid council model and valid chairman)
    const canStart =
        councilModels.some(m => m.validationResult?.valid) &&
        chairmanModel.validationResult?.valid;

    return (
        <div className="conversation-setup-overlay">
            <div className="conversation-setup-modal">
                <div className="setup-header">
                    <h2>Configure Council</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>

                <div className="setup-content">
                    {/* Global Reasoning Toggles */}
                    <section className="setup-section">
                        <h3>Reasoning Settings</h3>
                        <div className="global-toggles">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={reasoningStage1}
                                    onChange={(e) => setReasoningStage1(e.target.checked)}
                                />
                                Enable reasoning in Stage 1 (Collection)
                            </label>
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={reasoningStage2}
                                    onChange={(e) => setReasoningStage2(e.target.checked)}
                                />
                                Enable reasoning in Stage 2 (Ranking)
                            </label>
                        </div>
                    </section>

                    {/* Council Members */}
                    <section className="setup-section">
                        <h3>Council Members</h3>
                        <p className="section-description">
                            Add the models that will deliberate and rank responses.
                        </p>
                        {councilModels.map((model, index) => (
                            <ModelConfigPanel
                                key={index}
                                modelId={model.id}
                                onModelChange={(id, result) => handleCouncilModelChange(index, id, result)}
                                reasoningConfig={model.reasoningConfig}
                                onReasoningChange={(config) => handleCouncilReasoningChange(index, config)}
                                role="council"
                                showRemove={councilModels.length > 1}
                                onRemove={() => handleRemoveModel(index)}
                            />
                        ))}
                        <button className="add-model-btn" onClick={handleAddModel}>
                            + Add Model
                        </button>
                    </section>

                    {/* Chairman */}
                    <section className="setup-section">
                        <h3>Chairman</h3>
                        <p className="section-description">
                            The chairman synthesizes the final answer from all responses and rankings.
                        </p>
                        <ModelConfigPanel
                            modelId={chairmanModel.id}
                            onModelChange={handleChairmanChange}
                            reasoningConfig={chairmanModel.reasoningConfig}
                            onReasoningChange={handleChairmanReasoningChange}
                            role="chairman"
                        />
                    </section>
                </div>

                <div className="setup-footer">
                    <button className="cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="start-btn"
                        onClick={handleStart}
                        disabled={!canStart}
                        title={!canStart ? 'Please add at least one valid council model and a valid chairman' : ''}
                    >
                        Start Conversation
                    </button>
                </div>
            </div>
        </div>
    );
}
