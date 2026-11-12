'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { ScanPhoto } from '@/types/scanner'
import { Camera, Check, X, ArrowRight, Zap, RotateCcw, Loader2, AlertCircle, ShieldCheck, Upload } from 'lucide-react'

interface ScannerCaptureProps {
    onPhotosReady: (photos: ScanPhoto[]) => void
}

const GUIDED_STEPS = [
    { id: 'front' as const, label: 'Front', instruction: 'Capture the Front', description: 'Wear the garment and show the front', icon: '👕', required: true },
    { id: 'back' as const, label: 'Back', instruction: 'Capture the Back', description: 'Turn around to show the back while wearing it', icon: '🔄', required: true },
    { id: 'left_side' as const, label: 'Left Side', instruction: 'Capture Left Side', description: 'Turn to show your left profile', icon: '👤', required: true },
    { id: 'right_side' as const, label: 'Right Side', instruction: 'Capture Right Side', description: 'Turn to show your right profile', icon: '👤', required: true },
    { id: 'logo' as const, label: 'Logo / Tag', instruction: 'Capture Logo or Tag', description: 'Show the brand logo, label or tags', icon: '🏷️', required: true },
]

type StepStatus = 'ready' | 'validating' | 'accepted' | 'rejected'

interface StepState {
    status: StepStatus
    photo: ScanPhoto | null
    feedback: string
    previewUrl: string
}

export default function ScannerCapture({ onPhotosReady }: ScannerCaptureProps) {
    const [activeStepIdx, setActiveStepIdx] = useState(0)
    const [stepStates, setStepStates] = useState<Record<string, StepState>>(() => {
        const init: Record<string, StepState> = {}
        GUIDED_STEPS.forEach(s => { init[s.id] = { status: 'ready', photo: null, feedback: '', previewUrl: '' } })
        return init
    })
    const [cameraReady, setCameraReady] = useState(false)
    const [cameraError, setCameraError] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const activeStep = GUIDED_STEPS[activeStepIdx]
    const currentState = stepStates[activeStep.id]

    const updateStep = (stepId: string, patch: Partial<StepState>) => {
        setStepStates(prev => ({ ...prev, [stepId]: { ...prev[stepId], ...patch } }))
    }

    // Start camera ONCE, keep it alive the entire time (with fallback from environment -> default webcam)
    useEffect(() => {
        let cancelled = false
        const init = async () => {
            const tries: MediaStreamConstraints[] = [
                { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } } },
                { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
                { video: true },
            ]
            let stream: MediaStream | null = null
            let lastErr = ''
            for (const c of tries) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(c)
                    if (stream) break
                } catch (e: any) {
                    lastErr = e?.message || 'Camera access denied'
                }
            }
            if (!stream) {
                if (!cancelled) {
                    setCameraError(lastErr || 'Camera access denied')
                    setCameraReady(false)
                }
                return
            }
            if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play().catch(() => {})
            }
            setCameraReady(true)
        }
        init()
        return () => {
            cancelled = true
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
                streamRef.current = null
            }
        }
    }, [])

    // Capture = snap frame + validate with Gemini
    const capturePhoto = async () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || currentState.status === 'validating') return

        const stepId = activeStep.id
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg', 0.85)

        // Mark validating — camera stays live behind the overlay
        updateStep(stepId, { status: 'validating', previewUrl: base64, feedback: 'Verifying...' })

        try {
            const res = await fetch('/api/scanner/step-validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, stepId }),
            })
            const data = await res.json()

            if (!res.ok) {
                updateStep(stepId, { status: 'rejected', feedback: data.error || 'Validation failed.' })
                return
            }

            if (data.valid) {
                const photo: ScanPhoto = { id: `${stepId}-${Date.now()}`, slot: stepId as ScanPhoto['slot'], base64, quality: 'good' }
                updateStep(stepId, { status: 'accepted', photo, feedback: data.feedback || 'Verified!' })
                // Auto-advance after 1.2s
                if (activeStepIdx < GUIDED_STEPS.length - 1) {
                    setTimeout(() => setActiveStepIdx(i => i + 1), 1200)
                }
            } else {
                updateStep(stepId, { status: 'rejected', feedback: data.feedback || `Not a valid ${stepId} photo.` })
                // Auto-reset to camera after 2s
                setTimeout(() => updateStep(stepId, { status: 'ready', feedback: '', previewUrl: '' }), 2500)
            }
        } catch (err: any) {
            updateStep(stepId, { status: 'rejected', feedback: err.message || 'Network error.' })
            setTimeout(() => updateStep(stepId, { status: 'ready', feedback: '', previewUrl: '' }), 2500)
        }
    }

    // Upload fallback for desktop
    const handleUpload = (file: File) => {
        const stepId = activeStep.id
        const reader = new FileReader()
        reader.onload = async (e) => {
            const base64 = e.target?.result as string
            updateStep(stepId, { status: 'validating', previewUrl: base64, feedback: 'Verifying...' })
            try {
                const res = await fetch('/api/scanner/step-validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64, stepId }),
                })
                const data = await res.json()
                if (data.valid) {
                    const photo: ScanPhoto = { id: `${stepId}-${Date.now()}`, slot: stepId as ScanPhoto['slot'], base64, quality: 'good' }
                    updateStep(stepId, { status: 'accepted', photo, feedback: data.feedback || 'Verified!' })
                    if (activeStepIdx < GUIDED_STEPS.length - 1) setTimeout(() => setActiveStepIdx(i => i + 1), 1200)
                } else {
                    updateStep(stepId, { status: 'rejected', feedback: data.feedback || 'Wrong photo type.' })
                    setTimeout(() => updateStep(stepId, { status: 'ready', feedback: '', previewUrl: '' }), 2500)
                }
            } catch (err: any) {
                updateStep(stepId, { status: 'rejected', feedback: 'Network error.' })
                setTimeout(() => updateStep(stepId, { status: 'ready', feedback: '', previewUrl: '' }), 2500)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleFinish = () => {
        const photos = GUIDED_STEPS.map(s => stepStates[s.id].photo).filter(Boolean) as ScanPhoto[]
        onPhotosReady(photos)
    }

    const acceptedCount = GUIDED_STEPS.filter(s => stepStates[s.id].status === 'accepted').length
    const allRequiredAccepted = GUIDED_STEPS.every(s => s.required ? stepStates[s.id].status === 'accepted' : true)

    return (
        <div className="persona-scan-flow">
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Step Chips */}
            <div className="persona-steps-bar">
                {GUIDED_STEPS.map((step, i) => {
                    const st = stepStates[step.id]
                    return (
                        <button
                            key={step.id}
                            className={`persona-step-chip ${i === activeStepIdx ? 'active' : ''} ${st.status === 'accepted' ? 'done' : ''} ${st.status === 'rejected' ? 'error' : ''}`}
                            onClick={() => setActiveStepIdx(i)}
                        >
                            <span className="step-num">{st.status === 'accepted' ? '✓' : i + 1}</span>
                            <span className="step-text">{step.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Instruction */}
            <div className="persona-step-card-header">
                <span className="step-emoji">{activeStep.icon}</span>
                <div>
                    <h3 className="step-card-title">{activeStep.instruction}</h3>
                    <p className="step-card-desc">{activeStep.description}</p>
                </div>
                {!activeStep.required && <span className="step-optional label-caps">Optional</span>}
            </div>

            {/* ALWAYS-ON Camera Viewfinder */}
            <div className="persona-viewfinder-wrap">
                <div className="persona-viewfinder">
                    {/* Video is ALWAYS mounted — never unmounted between steps */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="viewfinder-video"
                        style={{ display: cameraReady ? 'block' : 'none' }}
                    />

                    {/* Camera loading / error states */}
                    {!cameraReady && !cameraError && (
                        <div className="viewfinder-loading">
                            <Loader2 size={28} className="spinner" />
                            <p className="label-caps">Starting Camera...</p>
                        </div>
                    )}
                    {cameraError && (
                        <div className="viewfinder-error">
                            <AlertCircle size={32} />
                            <p>{cameraError}</p>
                            <label className="btn-pill btn-pill-filled" style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                                <Upload size={14} /> Upload Instead
                                <input type="file" accept="image/*" hidden onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) handleUpload(f)
                                    e.target.value = ''
                                }} />
                            </label>
                        </div>
                    )}

                    {/* Overlays on top of the live camera */}
                    {currentState.status === 'validating' && (
                        <div className="viewfinder-overlay">
                            <div className="scan-line-anim" />
                            <div className="viewfinder-status-pill">
                                <Loader2 size={14} className="spinner" /> Verifying with AI...
                            </div>
                        </div>
                    )}

                    {currentState.status === 'accepted' && (
                        <div className="viewfinder-overlay accepted-overlay">
                            <div className="viewfinder-badge accepted-badge"><ShieldCheck size={14} /> Verified</div>
                            <div className="viewfinder-status-pill accepted-pill">
                                <Check size={14} /> {currentState.feedback}
                            </div>
                        </div>
                    )}

                    {currentState.status === 'rejected' && (
                        <div className="viewfinder-overlay rejected-overlay">
                            <div className="viewfinder-badge rejected-badge-tag"><X size={14} /> Declined</div>
                            <div className="viewfinder-status-pill rejected-pill">
                                <AlertCircle size={14} /> {currentState.feedback}
                            </div>
                        </div>
                    )}

                    {/* Shutter — visible when camera is ready and step is ready */}
                    {cameraReady && currentState.status === 'ready' && (
                        <div className="shutter-area">
                            <button className="shutter-btn" onClick={capturePhoto}>
                                <div className="shutter-btn-inner" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="persona-step-actions">
                {currentState.status === 'accepted' && activeStepIdx === GUIDED_STEPS.length - 1 && (
                    <button className="btn-pill btn-pill-filled" onClick={handleFinish} disabled={!allRequiredAccepted}>
                        <Zap size={14} /> Analyze ({acceptedCount} photos)
                    </button>
                )}
                {currentState.status === 'ready' && !activeStep.required && (
                    <button className="btn-pill" onClick={() => setActiveStepIdx(i => Math.min(i + 1, GUIDED_STEPS.length - 1))} style={{ opacity: 0.5 }}>
                        Skip <ArrowRight size={14} />
                    </button>
                )}
            </div>

            {/* Final finish bar */}
            {allRequiredAccepted && activeStepIdx === GUIDED_STEPS.length - 1 && currentState.status === 'ready' && (
                <div className="persona-finish-bar">
                    <span className="finish-info">All necessary photos verified</span>
                    <button className="btn-pill btn-pill-filled" onClick={handleFinish}>
                        <Zap size={16} /> Run Market Intel
                    </button>
                </div>
            )}
        </div>
    )
}
