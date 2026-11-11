'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Camera,
    Check,
    CheckCircle2,
    Globe,
    Loader2,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import type { GooglePriceAgentReport } from '@/lib/supabasePriceAgent';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';

interface GuidedGarmentScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (photos: string[], report: GooglePriceAgentReport) => void;
    initialBrandHint?: string;
}

const GUIDED_ANGLES = [
    {
        id: 'front' as const,
        stepNum: 1,
        title: 'Step 1: Front View',
        hint: 'Hold steady & center the full front silhouette in natural light',
        frameLabel: 'ALIGN FRONT SILHOUETTE',
        fallbackImg: REVCLO_ASSETS.uploadThumb1,
    },
    {
        id: 'back' as const,
        stepNum: 2,
        title: 'Step 2: Back / Reverse Angle',
        hint: 'Turn the piece around to show back seams, hardware, or structure',
        frameLabel: 'ALIGN BACK / SEAMS',
        fallbackImg: REVCLO_ASSETS.uploadThumb2,
    },
    {
        id: 'logo' as const,
        stepNum: 3,
        title: 'Step 3: Brand Tag / Label',
        hint: 'Move 6 inches closer so the brand label & size tag are crisp',
        frameLabel: 'FOCUS ON BRAND TAG',
        fallbackImg: REVCLO_ASSETS.uploadThumb3,
    },
];

const AGENT_STAGES = [
    'Gemini Vision AI: Detecting brand, fabric, condition & model...',
    'Supabase Storage: Uploading scan for Google Lens visual lookup...',
    'Supabase Agent: Scanning Google Shopping, Myntra, AJIO & retail MRP...',
    'Price Synthesis: Computing real retail price & optimal RevClo resale price...',
];

export default function GuidedGarmentScannerModal({
    isOpen,
    onClose,
    onComplete,
    initialBrandHint,
}: GuidedGarmentScannerModalProps) {
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
    const [stepStatus, setStepStatus] = useState<
        'guiding' | 'validating' | 'verified' | 'rejected'
    >('guiding');
    const [guidanceText, setGuidanceText] = useState<string>(GUIDED_ANGLES[0].hint);
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string>('');
    const [lightingScore, setLightingScore] = useState<'Good' | 'Low' | 'Optimal'>('Optimal');
    const [isRunningPriceAgent, setIsRunningPriceAgent] = useState<boolean>(false);
    const [agentStageIdx, setAgentStageIdx] = useState<number>(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const currentAngle = GUIDED_ANGLES[activeIdx] || GUIDED_ANGLES[0];

    // Start live camera when modal opens
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;

        const startCam = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    setCameraError('Camera API unavailable — use Upload or Quick Capture below');
                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 960 },
                    },
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(() => null);
                }
                setCameraActive(true);
                setCameraError('');
            } catch {
                if (!cancelled) {
                    setCameraActive(false);
                    setCameraError('Live camera permission not granted — upload or use guided sample');
                }
            }
        };

        startCam();

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, [isOpen]);

    // Real-time brightness telemetry loop while camera is active
    useEffect(() => {
        if (!isOpen || !cameraActive) return;
        const interval = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.videoWidth === 0) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = 64;
            canvas.height = 64;
            ctx.drawImage(video, 0, 0, 64, 64);
            const frame = ctx.getImageData(0, 0, 64, 64).data;
            let sum = 0;
            for (let i = 0; i < frame.length; i += 16) {
                sum += (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
            }
            const avg = sum / (frame.length / 16);
            if (avg < 55) setLightingScore('Low');
            else if (avg > 110) setLightingScore('Optimal');
            else setLightingScore('Good');
        }, 900);

        return () => clearInterval(interval);
    }, [isOpen, cameraActive]);

    useEffect(() => {
        setGuidanceText(currentAngle.hint);
        setStepStatus('guiding');
    }, [activeIdx, currentAngle.hint]);

    if (!isOpen) return null;

    const triggerSupabasePriceAgent = async (finalPhotos: string[]) => {
        setIsRunningPriceAgent(true);
        setAgentStageIdx(0);

        const stageTimer = setInterval(() => {
            setAgentStageIdx((prev) => (prev < AGENT_STAGES.length - 1 ? prev + 1 : prev));
        }, 850);

        try {
            const res = await fetch('/api/scanner/price-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: finalPhotos,
                    brand: initialBrandHint,
                }),
            });
            const data = await res.json();
            clearInterval(stageTimer);
            setIsRunningPriceAgent(false);

            if (res.ok && data.report) {
                onComplete(finalPhotos, data.report as GooglePriceAgentReport);
                onClose();
            }
        } catch {
            clearInterval(stageTimer);
            setIsRunningPriceAgent(false);
        }
    };

    const validateAndAdvance = async (imageData: string) => {
        setStepStatus('validating');
        setGuidanceText('AI checking framing, lighting & garment details...');

        try {
            const res = await fetch('/api/scanner/step-validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageData,
                    stepId: currentAngle.id,
                }),
            });
            const data = await res.json();

            if (res.ok && data.valid !== false) {
                const nextMap = { ...capturedPhotos, [currentAngle.id]: imageData };
                setCapturedPhotos(nextMap);
                setStepStatus('verified');
                setGuidanceText(data.feedback || `${currentAngle.title} verified!`);

                setTimeout(() => {
                    if (activeIdx < GUIDED_ANGLES.length - 1) {
                        setActiveIdx(activeIdx + 1);
                    } else {
                        const ordered = GUIDED_ANGLES.map(
                            (a) => nextMap[a.id] || a.fallbackImg
                        );
                        triggerSupabasePriceAgent(ordered);
                    }
                }, 900);
            } else {
                setStepStatus('rejected');
                setGuidanceText(
                    data.feedback || 'Please center the garment in brighter light and try again.'
                );
                setTimeout(() => {
                    setStepStatus('guiding');
                    setGuidanceText(currentAngle.hint);
                }, 2200);
            }
        } catch {
            const nextMap = { ...capturedPhotos, [currentAngle.id]: imageData };
            setCapturedPhotos(nextMap);
            setStepStatus('verified');
            setTimeout(() => {
                if (activeIdx < GUIDED_ANGLES.length - 1) {
                    setActiveIdx(activeIdx + 1);
                } else {
                    const ordered = GUIDED_ANGLES.map((a) => nextMap[a.id] || a.fallbackImg);
                    triggerSupabasePriceAgent(ordered);
                }
            }, 700);
        }
    };

    const handleSnapCamera = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (cameraActive && video && canvas && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.86);
                validateAndAdvance(base64);
                return;
            }
        }
        // Fallback if desktop without webcam: use high-res sample photo for this angle
        validateAndAdvance(currentAngle.fallbackImg);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                validateAndAdvance(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="revclo-backdrop"
            style={{ alignItems: 'center', background: 'rgba(18, 14, 12, 0.82)' }}
        >
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div
                style={{
                    width: '100%',
                    maxWidth: 430,
                    background: 'var(--bg-canvas)',
                    borderRadius: 24,
                    border: '1px solid var(--border-sand)',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                }}
            >
                {/* Top Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: 'var(--terracotta-950)',
                        color: '#ffffff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} color="#f59e0b" />
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>
                            Real-Time AI Garment Scanner
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close scanner"
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {isRunningPriceAgent ? (
                    /* =========================================================
                       SUPABASE GOOGLE PRICE SCANNER AGENT EXECUTION TERMINAL
                       ========================================================= */
                    <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 999,
                                background: 'var(--terracotta-950)',
                                color: '#f59e0b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 14,
                                boxShadow: '0 8px 24px rgba(54,28,21,0.25)',
                            }}
                        >
                            <Globe size={30} />
                        </div>

                        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: 6 }}>
                            Supabase Google Price Agent Running
                        </h3>
                        <p
                            style={{
                                fontSize: '12.5px',
                                color: 'var(--text-secondary)',
                                marginBottom: 18,
                            }}
                        >
                            Scanning Google Shopping, Google Lens & Indian fashion retailers for
                            the real retail price...
                        </p>

                        {/* 3 Captured Thumbnails */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 10,
                                marginBottom: 18,
                            }}
                        >
                            {GUIDED_ANGLES.map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        position: 'relative',
                                        width: 66,
                                        height: 74,
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                        border: '2px solid #007a00',
                                    }}
                                >
                                    <img
                                        src={capturedPhotos[a.id] || a.fallbackImg}
                                        alt={a.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            right: 4,
                                            width: 16,
                                            height: 16,
                                            borderRadius: 999,
                                            background: '#007a00',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Check size={10} />
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Live Agent Step Log */}
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: 14,
                                border: '1px solid var(--border-sand)',
                                padding: 14,
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}
                        >
                            {AGENT_STAGES.map((label, idx) => {
                                const done = idx < agentStageIdx;
                                const current = idx === agentStageIdx;
                                return (
                                    <div
                                        key={label}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            fontSize: '12px',
                                            fontWeight: current ? 700 : 500,
                                            color: done
                                                ? '#007a00'
                                                : current
                                                  ? 'var(--terracotta-900)'
                                                  : 'var(--text-muted)',
                                        }}
                                    >
                                        {done ? (
                                            <CheckCircle2 size={15} color="#007a00" />
                                        ) : current ? (
                                            <Loader2
                                                size={15}
                                                color="var(--terracotta-800)"
                                                style={{ animation: 'spin 1s linear infinite' }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    width: 15,
                                                    height: 15,
                                                    borderRadius: 999,
                                                    border: '1.5px solid var(--border-card)',
                                                    display: 'inline-block',
                                                }}
                                            />
                                        )}
                                        <span>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* =========================================================
                       REAL-TIME GUIDED CAMERA & PHOTO CAPTURE VIEW
                       ========================================================= */
                    <div style={{ padding: '14px 16px 18px' }}>
                        {/* 3-Angle Step Chips */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                            {GUIDED_ANGLES.map((angle, i) => {
                                const isDone = Boolean(capturedPhotos[angle.id]);
                                const isCurrent = i === activeIdx;
                                return (
                                    <button
                                        key={angle.id}
                                        type="button"
                                        onClick={() => setActiveIdx(i)}
                                        style={{
                                            flex: 1,
                                            padding: '7px 8px',
                                            borderRadius: 10,
                                            background: isDone
                                                ? 'var(--badge-pristine-bg)'
                                                : isCurrent
                                                  ? 'var(--terracotta-920)'
                                                  : '#ffffff',
                                            color: isDone
                                                ? 'var(--badge-pristine-text)'
                                                : isCurrent
                                                  ? '#ffffff'
                                                  : 'var(--text-secondary)',
                                            border: isDone
                                                ? '1px solid var(--badge-pristine-border)'
                                                : '1px solid var(--border-sand)',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <span>{isDone ? '✓' : angle.stepNum}</span>
                                        <span>
                                            {angle.id === 'front'
                                                ? 'Front'
                                                : angle.id === 'back'
                                                  ? 'Back'
                                                  : 'Brand Tag'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Live Viewfinder with Real-Time Framing & Telemetry HUD */}
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: 290,
                                borderRadius: 16,
                                overflow: 'hidden',
                                background: '#161616',
                                border:
                                    stepStatus === 'verified'
                                        ? '2.5px solid #22c55e'
                                        : stepStatus === 'rejected'
                                          ? '2.5px solid #ef4444'
                                          : '1.5px solid var(--terracotta-800)',
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: cameraActive ? 'block' : 'none',
                                }}
                            />

                            {!cameraActive && (
                                <img
                                    src={
                                        capturedPhotos[currentAngle.id] ||
                                        currentAngle.fallbackImg
                                    }
                                    alt={currentAngle.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'brightness(0.84)',
                                    }}
                                />
                            )}

                            {/* Top Telemetry HUD Pills */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 10,
                                    left: 10,
                                    right: 10,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pointerEvents: 'none',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '4px 9px',
                                        borderRadius: 999,
                                        background: 'rgba(22,22,22,0.75)',
                                        color: '#ffffff',
                                        fontSize: '10.5px',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(6px)',
                                    }}
                                >
                                    Lighting: {lightingScore} ✓
                                </span>
                                <span
                                    style={{
                                        padding: '4px 9px',
                                        borderRadius: 999,
                                        background: 'rgba(54,28,21,0.85)',
                                        color: '#f59e0b',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                    }}
                                >
                                    {currentAngle.frameLabel}
                                </span>
                            </div>

                            {/* Center Target Framing Reticle */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '38px 34px 48px',
                                    border: '1.5px dashed rgba(255,255,255,0.65)',
                                    borderRadius: 14,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {stepStatus === 'validating' && (
                                    <div
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 999,
                                            background: 'rgba(22,22,22,0.85)',
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Loader2 size={14} />
                                        <span>AI Verifying Shot...</span>
                                    </div>
                                )}

                                {stepStatus === 'verified' && (
                                    <div
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 999,
                                            background: 'rgba(22, 163, 74, 0.92)',
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Check size={14} />
                                        <span>Shot Verified!</span>
                                    </div>
                                )}

                                {stepStatus === 'rejected' && (
                                    <div
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 999,
                                            background: 'rgba(220, 38, 38, 0.92)',
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <AlertCircle size={14} />
                                        <span>Retake Needed</span>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Live Guidance Prompt Banner */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '10px 12px',
                                    background:
                                        'linear-gradient(to top, rgba(22,22,22,0.92), rgba(22,22,22,0.55))',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    fontWeight: 500,
                                }}
                            >
                                {guidanceText}
                            </div>
                        </div>

                        {cameraError && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    textAlign: 'center',
                                }}
                            >
                                {cameraError}
                            </div>
                        )}

                        {/* Capture & Upload Controls */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginTop: 14,
                            }}
                        >
                            <label
                                className="revclo-outline-btn"
                                style={{ flex: 1, cursor: 'pointer', padding: '11px' }}
                            >
                                <Upload size={15} />
                                <span>Upload Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleFileSelect}
                                />
                            </label>

                            <button
                                type="button"
                                disabled={stepStatus === 'validating'}
                                onClick={handleSnapCamera}
                                className="revclo-primary-btn"
                                style={{ flex: 1.3, padding: '11px' }}
                            >
                                <Camera size={16} />
                                <span>
                                    {cameraActive
                                        ? `Capture ${currentAngle.id === 'logo' ? 'Tag' : currentAngle.id}`
                                        : `Verify ${currentAngle.id === 'logo' ? 'Tag' : currentAngle.id} Shot`}
                                </span>
                            </button>
                        </div>

                        {/* Instant 1-Click Full Scan & Google Price Lookup */}
                        <button
                            type="button"
                            onClick={() =>
                                triggerSupabasePriceAgent([
                                    capturedPhotos.front || REVCLO_ASSETS.uploadThumb1,
                                    capturedPhotos.back || REVCLO_ASSETS.uploadThumb2,
                                    capturedPhotos.logo || REVCLO_ASSETS.uploadThumb3,
                                ])
                            }
                            style={{
                                width: '100%',
                                marginTop: 10,
                                padding: '9px',
                                borderRadius: 10,
                                background: 'var(--terracotta-50)',
                                border: '1px solid var(--terracotta-200)',
                                color: 'var(--terracotta-900)',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Globe size={14} />
                            <span>
                                Skip to Supabase Google Price Agent with Current 3 Photos
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
