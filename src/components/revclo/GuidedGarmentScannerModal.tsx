'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    Camera,
    Check,
    CheckCircle2,
    Globe,
    Loader2,
    RefreshCw,
    RotateCcw,
    Sparkles,
    Upload,
    X,
    Zap,
} from 'lucide-react';
import type { GooglePriceAgentReport } from '@/lib/supabasePriceAgent';

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
        shortLabel: 'Front',
        title: 'Step 1: Front Silhouette',
        hint: 'Hold the front of the garment inside the frame — AI will auto-capture when steady',
        frameLabel: 'ALIGN FULL FRONT VIEW',
    },
    {
        id: 'back' as const,
        stepNum: 2,
        shortLabel: 'Back',
        title: 'Step 2: Back / Reverse Angle',
        hint: 'Turn the garment around to show the back seams and fabric condition',
        frameLabel: 'ALIGN BACK / REVERSE',
    },
    {
        id: 'logo' as const,
        stepNum: 3,
        shortLabel: 'Brand Tag',
        title: 'Step 3: Brand Tag / Close-Up',
        hint: 'Move 5 inches closer to the neck label, brand tag, or collar stitching',
        frameLabel: 'FOCUS ON BRAND TAG / DETAIL',
    },
];

const AGENT_STAGES = [
    'Gemini 2.5 Vision AI: Extracting brand, model, fabric & condition...',
    'Supabase Storage: Uploading live scan for Google Lens visual lookup...',
    'Supabase Agent: Querying Google Shopping, Myntra, AJIO & retail MRP...',
    'Price Synthesis: Computing real retail MRP & optimal RevClo resale price...',
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
    const [detectedItemLabel, setDetectedItemLabel] = useState<string>(
        'Scanning live camera feed...'
    );
    const [framingScore, setFramingScore] = useState<number>(0);
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [cameraStarting, setCameraStarting] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string>('');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [autoCapture, setAutoCapture] = useState<boolean>(true);
    const [shutterFlash, setShutterFlash] = useState<boolean>(false);

    // Real-time local CV telemetry
    const [lightingScore, setLightingScore] = useState<'Optimal' | 'Low' | 'Bright'>('Optimal');
    const [stabilityScore, setStabilityScore] = useState<'Steady' | 'Moving'>('Steady');

    // Price agent state
    const [isRunningPriceAgent, setIsRunningPriceAgent] = useState<boolean>(false);
    const [agentStageIdx, setAgentStageIdx] = useState<number>(0);
    const [agentError, setAgentError] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const telemetryCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const prevFrameLumaRef = useRef<Float32Array | null>(null);
    const steadyTicksRef = useRef<number>(0);
    const liveCheckInFlightRef = useRef<boolean>(false);
    const lastLiveCheckTsRef = useRef<number>(0);

    const currentAngle = GUIDED_ANGLES[activeIdx] || GUIDED_ANGLES[0];

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const startCamera = useCallback(
        async (preferredFacing: 'environment' | 'user') => {
            stopStream();
            setCameraStarting(true);
            setCameraError('');

            if (
                typeof navigator === 'undefined' ||
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setCameraStarting(false);
                setCameraError(
                    'Browser camera API unavailable. Please allow camera access on HTTPS or upload a real photo below.'
                );
                return;
            }

            const constraintsList: MediaStreamConstraints[] = [
                {
                    video: {
                        facingMode: { ideal: preferredFacing },
                        width: { ideal: 1280 },
                        height: { ideal: 960 },
                    },
                    audio: false,
                },
                {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                },
                { video: true, audio: false },
            ];

            let acquired: MediaStream | null = null;
            let lastErr = '';

            for (const c of constraintsList) {
                try {
                    acquired = await navigator.mediaDevices.getUserMedia(c);
                    if (acquired) break;
                } catch (err: unknown) {
                    lastErr =
                        err instanceof Error ? err.message : 'Camera permission denied';
                }
            }

            if (!acquired) {
                setCameraStarting(false);
                setCameraActive(false);
                setCameraError(
                    `Camera permission required (${lastErr}). Click "Retry Camera" or upload a real garment photo.`
                );
                return;
            }

            streamRef.current = acquired;
            if (videoRef.current) {
                videoRef.current.srcObject = acquired;
                try {
                    await videoRef.current.play();
                } catch {
                    // play handled by autoPlay
                }
            }
            setCameraActive(true);
            setCameraStarting(false);
            setCameraError('');
        },
        [stopStream]
    );

    // Start camera when modal opens or facingMode changes
    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }
        startCamera(facingMode);
        return () => {
            stopStream();
        };
    }, [isOpen, facingMode, startCamera, stopStream]);

    // Reset step status when switching angle
    useEffect(() => {
        setGuidanceText(currentAngle.hint);
        setStepStatus('guiding');
        steadyTicksRef.current = 0;
    }, [activeIdx, currentAngle.hint]);

    // Capture a frame from the live <video> element at the specified max dimension
    const captureVideoFrameDataUrl = useCallback(
        (maxDim = 1080, quality = 0.78): string | null => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
                return null;
            }
            let width = video.videoWidth;
            let height = video.videoHeight;
            if (width > maxDim || height > maxDim) {
                if (width >= height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(video, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', quality);
        },
        []
    );

    const triggerSupabasePriceAgent = useCallback(
        async (finalPhotos: string[]) => {
            setIsRunningPriceAgent(true);
            setAgentStageIdx(0);
            setAgentError('');

            const stageTimer = setInterval(() => {
                setAgentStageIdx((prev) =>
                    prev < AGENT_STAGES.length - 1 ? prev + 1 : prev
                );
            }, 900);

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
                } else {
                    setAgentError(
                        data.error || 'Price agent encountered an issue. Please retry.'
                    );
                }
            } catch (err: unknown) {
                clearInterval(stageTimer);
                setIsRunningPriceAgent(false);
                setAgentError(
                    err instanceof Error ? err.message : 'Network error during price scan'
                );
            }
        },
        [initialBrandHint, onClose, onComplete]
    );

    // Core AI frame validation & step advancement
    const validateFrameWithGemini = useCallback(
        async (imageData: string, isBackgroundProbe: boolean) => {
            if (liveCheckInFlightRef.current) return;
            liveCheckInFlightRef.current = true;
            lastLiveCheckTsRef.current = Date.now();

            if (!isBackgroundProbe) {
                setStepStatus('validating');
                setGuidanceText('Gemini Vision AI inspecting live garment frame...');
            }

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

                if (data.detectedItem) {
                    setDetectedItemLabel(data.detectedItem);
                }
                if (typeof data.framingScore === 'number') {
                    setFramingScore(data.framingScore);
                }

                if (res.ok && data.valid === true) {
                    // Capture high-res 1080px shot if this was a background probe and video is live
                    const hiResShot =
                        (isBackgroundProbe && captureVideoFrameDataUrl(1080, 0.8)) ||
                        imageData;

                    setShutterFlash(true);
                    setTimeout(() => setShutterFlash(false), 220);

                    const nextMap = {
                        ...capturedPhotos,
                        [currentAngle.id]: hiResShot,
                    };
                    setCapturedPhotos(nextMap);
                    setStepStatus('verified');
                    setGuidanceText(
                        data.feedback || `${currentAngle.title} verified by AI!`
                    );

                    setTimeout(() => {
                        liveCheckInFlightRef.current = false;
                        if (activeIdx < GUIDED_ANGLES.length - 1) {
                            setActiveIdx((prev) => prev + 1);
                        } else {
                            const ordered = GUIDED_ANGLES.map(
                                (a) => nextMap[a.id]
                            ).filter(Boolean);
                            if (ordered.length === GUIDED_ANGLES.length) {
                                triggerSupabasePriceAgent(ordered);
                            }
                        }
                    }, 950);
                    return;
                }

                // Frame was not yet valid — show real-time AI coaching
                if (isBackgroundProbe) {
                    setStepStatus('guiding');
                    if (data.feedback) {
                        setGuidanceText(data.feedback);
                    }
                } else {
                    setStepStatus('rejected');
                    setGuidanceText(
                        data.feedback ||
                            'No garment clearly visible in frame — center the item and try again.'
                    );
                    setTimeout(() => {
                        setStepStatus('guiding');
                    }, 2200);
                }
            } catch {
                if (!isBackgroundProbe) {
                    setStepStatus('rejected');
                    setGuidanceText('Could not reach AI validator — check connection and retry.');
                    setTimeout(() => setStepStatus('guiding'), 2000);
                }
            } finally {
                liveCheckInFlightRef.current = false;
            }
        },
        [
            activeIdx,
            captureVideoFrameDataUrl,
            capturedPhotos,
            currentAngle.id,
            currentAngle.title,
            triggerSupabasePriceAgent,
        ]
    );

    // Real-time 4Hz local CV telemetry + automatic AI live-guidance probe when steady
    useEffect(() => {
        if (
            !isOpen ||
            !cameraActive ||
            isRunningPriceAgent ||
            stepStatus === 'verified' ||
            stepStatus === 'validating'
        ) {
            return;
        }

        const interval = setInterval(() => {
            const video = videoRef.current;
            const tCanvas = telemetryCanvasRef.current;
            if (!video || !tCanvas || video.videoWidth === 0) return;
            const ctx = tCanvas.getContext('2d');
            if (!ctx) return;

            const size = 64;
            tCanvas.width = size;
            tCanvas.height = size;
            ctx.drawImage(video, 0, 0, size, size);
            const pixels = ctx.getImageData(0, 0, size, size).data;

            const luma = new Float32Array(size * size);
            let sumLuma = 0;
            for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
                const y =
                    0.299 * pixels[i] +
                    0.587 * pixels[i + 1] +
                    0.114 * pixels[i + 2];
                luma[p] = y;
                sumLuma += y;
            }
            const avgLuma = sumLuma / (size * size);

            // 1. Lighting check
            let currentLight: 'Optimal' | 'Low' | 'Bright' = 'Optimal';
            if (avgLuma < 45) currentLight = 'Low';
            else if (avgLuma > 235) currentLight = 'Bright';
            setLightingScore(currentLight);

            // 2. Motion stability check (mean absolute frame difference)
            let motionDiff = 0;
            if (prevFrameLumaRef.current && prevFrameLumaRef.current.length === luma.length) {
                for (let i = 0; i < luma.length; i++) {
                    motionDiff += Math.abs(luma[i] - prevFrameLumaRef.current[i]);
                }
                motionDiff /= luma.length;
            }
            prevFrameLumaRef.current = luma;

            const isSteady = motionDiff < 7.5;
            setStabilityScore(isSteady ? 'Steady' : 'Moving');

            // 3. Center reticle edge/detail contrast check
            let edgeEnergy = 0;
            let count = 0;
            for (let r = 14; r < size - 14; r++) {
                for (let c = 14; c < size - 14; c++) {
                    const idx = r * size + c;
                    const gx = Math.abs(luma[idx + 1] - luma[idx - 1]);
                    const gy = Math.abs(luma[idx + size] - luma[idx - size]);
                    edgeEnergy += gx + gy;
                    count++;
                }
            }
            const meanEdge = count > 0 ? edgeEnergy / count : 0;
            const computedFraming = Math.min(98, Math.max(15, Math.round(meanEdge * 3.2)));
            setFramingScore((prev) => Math.round(prev * 0.6 + computedFraming * 0.4));

            if (!isSteady) {
                steadyTicksRef.current = 0;
                return;
            }

            steadyTicksRef.current += 1;

            // Real-time AI probe when held steady for >= 3 ticks (~850ms) and cooldown >= 2.2s
            const now = Date.now();
            if (
                autoCapture &&
                currentLight !== 'Low' &&
                meanEdge > 6 &&
                steadyTicksRef.current >= 3 &&
                !liveCheckInFlightRef.current &&
                now - lastLiveCheckTsRef.current >= 2200
            ) {
                const probeFrame = captureVideoFrameDataUrl(640, 0.72);
                if (probeFrame) {
                    validateFrameWithGemini(probeFrame, true);
                }
            }
        }, 280);

        return () => clearInterval(interval);
    }, [
        autoCapture,
        cameraActive,
        captureVideoFrameDataUrl,
        isOpen,
        isRunningPriceAgent,
        stepStatus,
        validateFrameWithGemini,
    ]);

    if (!isOpen) return null;

    const handleManualCapture = () => {
        const frame = captureVideoFrameDataUrl(1080, 0.78);
        if (!frame) {
            setCameraError(
                'Live camera stream not active yet — click Retry Camera or Upload Photo.'
            );
            return;
        }
        validateFrameWithGemini(frame, false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const rawUrl = reader.result;
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1080;
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width >= height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const offscreen = document.createElement('canvas');
                    offscreen.width = width;
                    offscreen.height = height;
                    const ctx = offscreen.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        validateFrameWithGemini(
                            offscreen.toDataURL('image/jpeg', 0.78),
                            false
                        );
                    } else {
                        validateFrameWithGemini(rawUrl, false);
                    }
                };
                img.onerror = () => validateFrameWithGemini(rawUrl, false);
                img.src = rawUrl;
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const capturedCount = GUIDED_ANGLES.filter((a) =>
        Boolean(capturedPhotos[a.id])
    ).length;

    return (
        <div
            className="revclo-backdrop"
            style={{
                alignItems: 'center',
                background: 'rgba(14, 11, 9, 0.86)',
                padding: '12px',
            }}
        >
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <canvas ref={telemetryCanvasRef} style={{ display: 'none' }} />

            <div
                style={{
                    width: '100%',
                    maxWidth: 460,
                    background: 'var(--bg-canvas)',
                    borderRadius: 24,
                    border: '1px solid var(--border-sand)',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                }}
            >
                {/* Top Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '13px 16px',
                        background: 'var(--terracotta-950)',
                        color: '#ffffff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={16} color="#f59e0b" />
                        <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
                            Real-Time AI Guided Garment Scanner
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            type="button"
                            onClick={() => setAutoCapture((v) => !v)}
                            title="Toggle automatic AI photo capture when garment is aligned"
                            style={{
                                padding: '4px 9px',
                                borderRadius: 999,
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: autoCapture
                                    ? 'rgba(34, 197, 94, 0.22)'
                                    : 'rgba(255,255,255,0.12)',
                                color: autoCapture ? '#86efac' : 'rgba(255,255,255,0.75)',
                                border: autoCapture
                                    ? '1px solid rgba(34, 197, 94, 0.5)'
                                    : '1px solid rgba(255,255,255,0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Zap size={11} />
                            <span>Auto-Snap: {autoCapture ? 'ON' : 'OFF'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close scanner"
                            style={{ color: 'rgba(255,255,255,0.85)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {isRunningPriceAgent ? (
                    /* =========================================================
                       SUPABASE GOOGLE PRICE SCANNER AGENT EXECUTION TERMINAL
                       ========================================================= */
                    <div style={{ padding: '26px 20px', textAlign: 'center' }}>
                        <div
                            style={{
                                width: 62,
                                height: 62,
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
                            <Globe size={28} />
                        </div>

                        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: 6 }}>
                            Supabase Google Price Agent Running
                        </h3>
                        <p
                            style={{
                                fontSize: '12.5px',
                                color: 'var(--text-secondary)',
                                marginBottom: 16,
                            }}
                        >
                            Analyzing your 3 verified photos with Gemini 2.5 Vision & scanning
                            Google Shopping India...
                        </p>

                        {/* 3 Verified Live Thumbnails */}
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
                                        width: 72,
                                        height: 82,
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        border: '2px solid #007a00',
                                        background: '#161616',
                                    }}
                                >
                                    {capturedPhotos[a.id] && (
                                        <img
                                            src={capturedPhotos[a.id]}
                                            alt={a.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}
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
                                                className="animate-spin"
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
                        {/* 3-Angle Step Chips with Live Thumbnail Status */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
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
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <span>{isDone ? '✓' : angle.stepNum}</span>
                                        <span>{angle.shortLabel}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Live Viewfinder with Real-Time Framing & Telemetry HUD */}
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: 320,
                                borderRadius: 16,
                                overflow: 'hidden',
                                background: '#111111',
                                border:
                                    stepStatus === 'verified'
                                        ? '2.5px solid #22c55e'
                                        : stepStatus === 'rejected'
                                          ? '2.5px solid #ef4444'
                                          : '1.5px solid var(--terracotta-800)',
                            }}
                        >
                            {/* Live WebRTC Video Feed */}
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
                                    transform:
                                        facingMode === 'user' ? 'scaleX(-1)' : undefined,
                                }}
                            />

                            {/* Shutter Flash Effect */}
                            {shutterFlash && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: '#ffffff',
                                        opacity: 0.85,
                                        pointerEvents: 'none',
                                        zIndex: 20,
                                    }}
                                />
                            )}

                            {/* If Camera Not Active Yet: Show Starting Spinner or Captured Real Shot (NEVER a fake stock photo) */}
                            {!cameraActive && (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 24,
                                        color: '#ffffff',
                                        textAlign: 'center',
                                    }}
                                >
                                    {capturedPhotos[currentAngle.id] ? (
                                        <img
                                            src={capturedPhotos[currentAngle.id]}
                                            alt={currentAngle.title}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : cameraStarting ? (
                                        <>
                                            <Loader2
                                                size={28}
                                                className="animate-spin"
                                                style={{ marginBottom: 10, color: '#f59e0b' }}
                                            />
                                            <p style={{ fontSize: '13px', fontWeight: 600 }}>
                                                Starting Live Camera...
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: '11px',
                                                    color: 'rgba(255,255,255,0.65)',
                                                    marginTop: 4,
                                                }}
                                            >
                                                Allow camera permission in your browser prompt
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Camera
                                                size={32}
                                                style={{
                                                    marginBottom: 10,
                                                    color: 'rgba(255,255,255,0.6)',
                                                }}
                                            />
                                            <p style={{ fontSize: '13px', fontWeight: 600 }}>
                                                Live Camera Paused or Blocked
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: '11.5px',
                                                    color: 'rgba(255,255,255,0.7)',
                                                    marginTop: 4,
                                                    maxWidth: 280,
                                                }}
                                            >
                                                {cameraError ||
                                                    'Enable camera access to scan in real time, or upload a real photo from your device below.'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => startCamera(facingMode)}
                                                style={{
                                                    marginTop: 12,
                                                    padding: '7px 14px',
                                                    borderRadius: 999,
                                                    background: '#ffffff',
                                                    color: '#161616',
                                                    fontSize: '11.5px',
                                                    fontWeight: 700,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <RefreshCw size={13} />
                                                <span>Retry Live Camera</span>
                                            </button>
                                        </>
                                    )}
                                </div>
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
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 999,
                                            background: 'rgba(18,18,18,0.78)',
                                            color:
                                                lightingScore === 'Low'
                                                    ? '#fca5a5'
                                                    : '#86efac',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            backdropFilter: 'blur(6px)',
                                        }}
                                    >
                                        Light: {lightingScore}
                                    </span>
                                    <span
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: 999,
                                            background: 'rgba(18,18,18,0.78)',
                                            color:
                                                stabilityScore === 'Steady'
                                                    ? '#86efac'
                                                    : '#fde047',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            backdropFilter: 'blur(6px)',
                                        }}
                                    >
                                        {stabilityScore === 'Steady'
                                            ? 'Steady ✓'
                                            : 'Hold Steady...'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                        style={{
                                            padding: '4px 9px',
                                            borderRadius: 999,
                                            background: 'rgba(54,28,21,0.88)',
                                            color: '#f59e0b',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {currentAngle.frameLabel}
                                    </span>

                                    {cameraActive && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFacingMode((m) =>
                                                    m === 'environment' ? 'user' : 'environment'
                                                )
                                            }
                                            title="Switch Front / Rear Camera"
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 999,
                                                background: 'rgba(18,18,18,0.8)',
                                                color: '#ffffff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                            }}
                                        >
                                            <RefreshCw size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Center Target Framing Reticle */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: '42px 32px 58px',
                                    border:
                                        stepStatus === 'verified'
                                            ? '2px solid #22c55e'
                                            : stepStatus === 'rejected'
                                              ? '2px solid #ef4444'
                                              : stabilityScore === 'Steady'
                                                ? '1.5px dashed rgba(134, 239, 172, 0.85)'
                                                : '1.5px dashed rgba(255,255,255,0.6)',
                                    borderRadius: 16,
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                {stepStatus === 'validating' && (
                                    <div
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 999,
                                            background: 'rgba(18,18,18,0.88)',
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Gemini Vision Verifying Shot...</span>
                                    </div>
                                )}

                                {stepStatus === 'verified' && (
                                    <div
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: 999,
                                            background: 'rgba(22, 163, 74, 0.94)',
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
                                            background: 'rgba(220, 38, 38, 0.94)',
                                            color: '#ffffff',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <AlertCircle size={14} />
                                        <span>Adjust Framing & Retry</span>
                                    </div>
                                )}
                            </div>

                            {/* Live AI Vision Detection Pill + Guidance Banner */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '8px 12px 10px',
                                    background:
                                        'linear-gradient(to top, rgba(14,14,14,0.95), rgba(14,14,14,0.65))',
                                    color: '#ffffff',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '10.5px',
                                        color: '#fde047',
                                        fontWeight: 600,
                                        marginBottom: 3,
                                    }}
                                >
                                    <span>AI Vision: {detectedItemLabel}</span>
                                    <span>Sharpness: {framingScore}%</span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#ffffff',
                                        textAlign: 'center',
                                    }}
                                >
                                    {guidanceText}
                                </div>
                            </div>
                        </div>

                        {/* Captured Real Thumbnails Strip (Allows inspecting or retaking any step) */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 8,
                                marginTop: 10,
                            }}
                        >
                            {GUIDED_ANGLES.map((angle, idx) => {
                                const shot = capturedPhotos[angle.id];
                                return (
                                    <div
                                        key={angle.id}
                                        onClick={() => setActiveIdx(idx)}
                                        style={{
                                            height: 56,
                                            borderRadius: 10,
                                            border: shot
                                                ? '1.5px solid #007a00'
                                                : idx === activeIdx
                                                  ? '1.5px dashed var(--terracotta-800)'
                                                  : '1px dashed var(--border-sand)',
                                            background: '#ffffff',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {shot ? (
                                            <>
                                                <img
                                                    src={shot}
                                                    alt={angle.shortLabel}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        padding: '1px 5px',
                                                        borderRadius: 999,
                                                        background: 'rgba(0,122,0,0.9)',
                                                        color: '#fff',
                                                        fontSize: '9px',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    ✓ {angle.shortLabel}
                                                </span>
                                            </>
                                        ) : (
                                            <span
                                                style={{
                                                    fontSize: '10.5px',
                                                    color: 'var(--text-muted)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {angle.stepNum}. {angle.shortLabel} (Empty)
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {agentError && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: '8px 10px',
                                    borderRadius: 10,
                                    background: '#fef2f2',
                                    color: '#b91c1c',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                }}
                            >
                                {agentError}
                            </div>
                        )}

                        {/* Capture & Upload Controls */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginTop: 12,
                            }}
                        >
                            <label
                                className="revclo-outline-btn"
                                style={{ flex: 1, cursor: 'pointer', padding: '11px' }}
                            >
                                <Upload size={15} />
                                <span>Upload Real Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    hidden
                                    onChange={handleFileSelect}
                                />
                            </label>

                            <button
                                type="button"
                                disabled={stepStatus === 'validating' || !cameraActive}
                                onClick={handleManualCapture}
                                className="revclo-primary-btn"
                                style={{
                                    flex: 1.35,
                                    padding: '11px',
                                    opacity: !cameraActive ? 0.55 : 1,
                                }}
                            >
                                <Camera size={16} />
                                <span>
                                    {capturedPhotos[currentAngle.id]
                                        ? `Retake ${currentAngle.shortLabel}`
                                        : `Capture ${currentAngle.shortLabel}`}
                                </span>
                            </button>
                        </div>

                        {/* Launch Price Agent Button (ONLY enabled once real photos are captured) */}
                        {capturedCount > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const realList = GUIDED_ANGLES.map(
                                        (a) => capturedPhotos[a.id]
                                    ).filter(Boolean);
                                    if (realList.length > 0) {
                                        triggerSupabasePriceAgent(realList);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    marginTop: 10,
                                    padding: '10px',
                                    borderRadius: 12,
                                    background:
                                        capturedCount === GUIDED_ANGLES.length
                                            ? '#007a00'
                                            : 'var(--terracotta-50)',
                                    border:
                                        capturedCount === GUIDED_ANGLES.length
                                            ? '1px solid #007a00'
                                            : '1px solid var(--terracotta-200)',
                                    color:
                                        capturedCount === GUIDED_ANGLES.length
                                            ? '#ffffff'
                                            : 'var(--terracotta-900)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                <Globe size={14} />
                                <span>
                                    Run Supabase Google Price Agent ({capturedCount}/3 Verified
                                    Photos)
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
