import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import './ModelConfigPanel.css';

/**
 * Reusable panel for configuring a single model.
 * Handles model validation and conditional reasoning UI.
 */
export default function ModelConfigPanel({
    modelId,
    onModelChange,
    reasoningConfig,
    onReasoningChange,
    role = 'council', // 'council' | 'chairman'
    onRemove,
    showRemove = false,
}) {
    const [validationState, setValidationState] = useState({
        isValidating: false,
        isValid: null,
        error: null,
        supportsReasoning: false,
        effortLevels: [],
        reasoningParamType: null,
    });

    // Debounced validation
    const validateModel = useCallback(async (id) => {
        if (!id || !id.trim()) {
            setValidationState({
                isValidating: false,
                isValid: null,
                error: null,
                supportsReasoning: false,
                effortLevels: [],
                reasoningParamType: null,
            });
            return;
        }

        setValidationState(prev => ({ ...prev, isValidating: true, error: null }));

        try {
            const result = await api.validateModel(id);
            setValidationState({
                isValidating: false,
                isValid: result.valid,
                error: result.error,
                supportsReasoning: result.supports_reasoning,
                effortLevels: result.effort_levels || [],
                reasoningParamType: result.reasoning_param_type,
            });

            // Notify parent of validation result
            onModelChange(id, result);
        } catch (e) {
            setValidationState({
                isValidating: false,
                isValid: false,
                error: 'Failed to validate model',
                supportsReasoning: false,
                effortLevels: [],
                reasoningParamType: null,
            });
        }
    }, [onModelChange]);

    // Debounce validation on blur
    const [inputValue, setInputValue] = useState(modelId);

    useEffect(() => {
        setInputValue(modelId);
    }, [modelId]);

    const handleBlur = () => {
        if (inputValue !== modelId) {
            validateModel(inputValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            validateModel(inputValue);
        }
    };

    const handleReasoningToggle = (enabled) => {
        onReasoningChange({
            ...reasoningConfig,
            enabled,
        });
    };

    const handleEffortChange = (effort) => {
        onReasoningChange({
            ...reasoningConfig,
            effort,
        });
    };

    const roleLabel = role === 'chairman' ? 'Chairman' : 'Council Member';
    const { isValidating, isValid, error, supportsReasoning, effortLevels } = validationState;

    return (
        <div className={`model-config-panel ${isValid === false ? 'invalid' : ''}`}>
            <div className="model-input-row">
                <label className="role-label">{roleLabel}</label>
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="model-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., openai/gpt-5.1"
                    />
                    {isValidating && <span className="validation-indicator validating">⏳</span>}
                    {isValid === true && <span className="validation-indicator valid">✓</span>}
                    {isValid === false && <span className="validation-indicator invalid">✗</span>}
                </div>
                {showRemove && (
                    <button className="remove-btn" onClick={onRemove} title="Remove model">
                        ×
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            {isValid && supportsReasoning && (
                <div className="reasoning-config">
                    <label className="reasoning-toggle">
                        <input
                            type="checkbox"
                            checked={reasoningConfig?.enabled ?? true}
                            onChange={(e) => handleReasoningToggle(e.target.checked)}
                        />
                        Enable Reasoning
                    </label>

                    {reasoningConfig?.enabled && effortLevels.length > 0 && (
                        <div className="effort-select">
                            <label>Effort:</label>
                            <select
                                value={reasoningConfig?.effort || 'medium'}
                                onChange={(e) => handleEffortChange(e.target.value)}
                            >
                                {effortLevels.map((level) => (
                                    <option key={level} value={level}>
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
