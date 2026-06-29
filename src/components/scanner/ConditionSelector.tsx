'use client'

interface ConditionSelectorProps {
    value: string
    onChange: (condition: string) => void
}

const CONDITIONS = [
    {
        id: 'new_with_tags',
        label: 'New With Tags',
        short: 'NWT',
        description: 'Never worn, original tags still attached',
        emoji: '✨',
        color: '#10b981',
    },
    {
        id: 'like_new',
        label: 'Like New',
        short: 'LN',
        description: 'Worn once or twice, no visible wear',
        emoji: '🌟',
        color: '#34d399',
    },
    {
        id: 'gently_used',
        label: 'Gently Used',
        short: 'GU',
        description: 'Light wear, minor signs of use',
        emoji: '👍',
        color: '#fbbf24',
    },
    {
        id: 'well_worn',
        label: 'Well Worn',
        short: 'WW',
        description: 'Visible wear, fading, or minor damage',
        emoji: '🔧',
        color: '#f97316',
    },
    {
        id: 'heavily_worn',
        label: 'Heavily Worn',
        short: 'HW',
        description: 'Significant wear, stains, or damage',
        emoji: '⚠️',
        color: '#ef4444',
    },
]

export default function ConditionSelector({ value, onChange }: ConditionSelectorProps) {
    return (
        <div className="condition-selector">
            <h3 className="condition-title">Item Condition</h3>
            <p className="condition-subtitle label-caps">Select the closest match</p>

            <div className="condition-options">
                {CONDITIONS.map(cond => (
                    <button
                        key={cond.id}
                        className={`condition-card ${value === cond.id ? 'condition-card-selected' : ''}`}
                        onClick={() => onChange(cond.id)}
                        style={{
                            '--cond-color': cond.color,
                        } as React.CSSProperties}
                    >
                        <span className="condition-emoji">{cond.emoji}</span>
                        <div className="condition-info">
                            <span className="condition-label">{cond.label}</span>
                            <span className="condition-desc">{cond.description}</span>
                        </div>
                        {value === cond.id && <span className="condition-check">✓</span>}
                    </button>
                ))}
            </div>
        </div>
    )
}
