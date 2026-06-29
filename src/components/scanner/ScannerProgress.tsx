'use client'

import type { ScanStep } from '@/types/scanner'

interface ScannerProgressProps {
    steps: ScanStep[]
    currentStep: number
}

export default function ScannerProgress({ steps, currentStep }: ScannerProgressProps) {
    return (
        <div className="scanner-progress">
            <div className="scanner-progress-track">
                <div
                    className="scanner-progress-fill"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
            </div>
            <div className="scanner-progress-steps">
                {steps.map((step, idx) => (
                    <div
                        key={step.id}
                        className={`scanner-progress-step ${step.status === 'complete' ? 'step-complete' : ''} ${step.status === 'active' ? 'step-active' : ''} ${step.status === 'error' ? 'step-error' : ''}`}
                    >
                        <div className="scanner-step-dot">
                            {step.status === 'complete' ? '✓' : step.status === 'error' ? '!' : idx + 1}
                        </div>
                        <span className="label-caps scanner-step-label">{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
