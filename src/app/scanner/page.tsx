'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ScanPhoto, ScanResult, ScannerStage, ScanStep, VisionAnalysis } from '@/types/scanner'
import ScannerCapture from '@/components/scanner/ScannerCapture'
import ScannerProgress from '@/components/scanner/ScannerProgress'
import ConditionSelector from '@/components/scanner/ConditionSelector'
import ValuationCard from '@/components/scanner/ValuationCard'
import { Scan, ArrowLeft, ArrowRight, Loader2, AlertTriangle, RotateCcw, Clock, Trash2 } from 'lucide-react'
import gsap from 'gsap'

const INITIAL_STEPS: ScanStep[] = [
    { id: 1, label: 'Capture', status: 'active' },
    { id: 2, label: 'Verify', status: 'pending' },
    { id: 3, label: 'Confirm', status: 'pending' },
    { id: 4, label: 'Analyzing', status: 'pending' },
    { id: 5, label: 'Result', status: 'pending' },
]

const STORAGE_KEY = 'revclo_scan_history'

export default function ScannerPage() {
    const [stage, setStage] = useState<ScannerStage>('capture')
    const [steps, setSteps] = useState<ScanStep[]>(INITIAL_STEPS)
    const [currentStep, setCurrentStep] = useState(0)
    const [photos, setPhotos] = useState<ScanPhoto[]>([])
    const [visionData, setVisionData] = useState<VisionAnalysis | null>(null)
    const [condition, setCondition] = useState('')
    const [brandOverride, setBrandOverride] = useState('')
    const [result, setResult] = useState<ScanResult | null>(null)
    const [error, setError] = useState('')
    const [loadingMessage, setLoadingMessage] = useState('')
    const [history, setHistory] = useState<ScanResult[]>([])

    const contentRef = useRef<HTMLDivElement>(null)

    // Load History
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                setHistory(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load history', e)
            }
        }
    }, [])

    // Animation Effect
    useEffect(() => {
        if (contentRef.current) {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            )
        }
    }, [stage])

    const saveToHistory = (newResult: ScanResult) => {
        setHistory(prev => {
            const updated = [newResult, ...prev].slice(0, 10) // Keep last 10
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
        })
    }

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY)
        setHistory([])
    }

    const updateStep = (stepIdx: number, status: ScanStep['status']) => {
        setSteps(prev => prev.map((s, i) => {
            if (i === stepIdx) return { ...s, status }
            if (i < stepIdx) return { ...s, status: 'complete' }
            return s
        }))
        setCurrentStep(stepIdx)
    }

    const handlePhotosReady = useCallback(async (capturedPhotos: ScanPhoto[]) => {
        setPhotos(capturedPhotos)
        setStage('verifying')
        updateStep(1, 'active')
        setLoadingMessage('Verifying photo quality with AI...')

        try {
            const images = capturedPhotos.map(p => p.base64)
            const res = await fetch('/api/scanner/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 422) {
                    setError(data.analysis?.qualityFeedback || data.feedback || 'Photo rejected')
                    updateStep(1, 'error')
                    setStage('error')
                    return
                }
                throw new Error(data.error || 'Analysis failed')
            }

            setVisionData(data.analysis)
            setCondition(data.analysis.condition)
            setBrandOverride(data.analysis.brand)
            updateStep(2, 'active')
            setStage('confirm')
        } catch (err: any) {
            setError(err.message)
            updateStep(1, 'error')
            setStage('error')
        }
    }, [])

    const handleConfirmAndValuate = useCallback(async () => {
        setStage('analyzing')
        updateStep(3, 'active')
        setLoadingMessage('Searching Indian marketplaces...')

        try {
            const images = photos.map(p => p.base64)
            const res = await fetch('/api/scanner/valuate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images,
                    userCondition: condition,
                    userBrandOverride: brandOverride !== visionData?.brand ? brandOverride : undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Valuation failed')
            }

            setResult(data.result)
            saveToHistory(data.result)
            updateStep(4, 'active')
            setTimeout(() => {
                updateStep(4, 'complete')
                setStage('result')
            }, 600)
        } catch (err: any) {
            setError(err.message)
            updateStep(3, 'error')
            setStage('error')
        }
    }, [photos, condition, brandOverride, visionData])

    const handleReset = () => {
        setStage('capture')
        setSteps(INITIAL_STEPS)
        setCurrentStep(0)
        setPhotos([])
        setVisionData(null)
        setCondition('')
        setBrandOverride('')
        setResult(null)
        setError('')
        setLoadingMessage('')
    }

    const loadHistoryItem = (item: ScanResult) => {
        setResult(item)
        setStage('result')
        setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })))
        setCurrentStep(4)
    }

    return (
        <div className="scanner-page">
            <div className="scanner-hero">
                <div className="scanner-hero-inner page-wrap">
                    <div className="scanner-hero-icon">
                        <Scan size={28} />
                    </div>
                    <h1 className="scanner-hero-title">RevClo Scanner</h1>
                    <p className="scanner-hero-sub">AI-Powered Resale Valuation for Indian Fashion</p>
                </div>
            </div>

            <div className="page-wrap scanner-content">
                <ScannerProgress steps={steps} currentStep={currentStep} />

                <div ref={contentRef}>
                    {stage === 'capture' && (
                        <ScannerCapture onPhotosReady={handlePhotosReady} />
                    )}

                    {stage === 'verifying' && (
                        <div className="scanner-loading">
                            <div className="scanner-loading-spinner">
                                <Loader2 size={40} className="scanner-spin" />
                            </div>
                            <p className="scanner-loading-text">{loadingMessage}</p>
                            <p className="scanner-loading-sub label-caps">Analyzing {photos.length} photo{photos.length > 1 ? 's' : ''} with Gemini Vision</p>
                        </div>
                    )}

                    {stage === 'confirm' && visionData && (
                        <div className="scanner-confirm">
                            <div className="scanner-confirm-header">
                                <h2>Confirm Details</h2>
                                <p className="label-caps">Review and correct AI-detected information</p>
                            </div>

                            <div className="scanner-confirm-grid">
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Brand</label>
                                    <input
                                        type="text"
                                        value={brandOverride}
                                        onChange={e => setBrandOverride(e.target.value)}
                                        className="scanner-input"
                                    />
                                </div>
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Category</label>
                                    <input
                                        type="text"
                                        value={visionData.category}
                                        readOnly
                                        className="scanner-input scanner-input-readonly"
                                    />
                                </div>
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Type</label>
                                    <input
                                        type="text"
                                        value={visionData.garmentType}
                                        readOnly
                                        className="scanner-input scanner-input-readonly"
                                    />
                                </div>
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Fabric</label>
                                    <input
                                        type="text"
                                        value={visionData.fabric}
                                        readOnly
                                        className="scanner-input scanner-input-readonly"
                                    />
                                </div>
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Color</label>
                                    <input
                                        type="text"
                                        value={visionData.color}
                                        readOnly
                                        className="scanner-input scanner-input-readonly"
                                    />
                                </div>
                                <div className="scanner-confirm-field">
                                    <label className="label-caps">Size</label>
                                    <input
                                        type="text"
                                        value={visionData.size}
                                        readOnly
                                        className="scanner-input scanner-input-readonly"
                                    />
                                </div>
                            </div>

                            <ConditionSelector value={condition} onChange={setCondition} />

                            <div className="scanner-confirm-actions">
                                <button className="btn-pill" onClick={handleReset}>
                                    <ArrowLeft size={16} />
                                    <span>Start Over</span>
                                </button>
                                <button
                                    className="btn-pill btn-pill-filled"
                                    onClick={handleConfirmAndValuate}
                                    disabled={!condition}
                                >
                                    <span>Get Valuation</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'analyzing' && (
                        <div className="scanner-loading">
                            <div className="scanner-loading-spinner">
                                <Loader2 size={40} className="scanner-spin" />
                            </div>
                            <p className="scanner-loading-text">{loadingMessage}</p>
                            <div className="scanner-marketplace-pills">
                                {['Amazon India', 'Myntra', 'Flipkart', 'Instagram Thrift', 'OLX', 'Poshmark'].map((name, i) => (
                                    <span
                                        key={name}
                                        className="scanner-mp-pill label-caps"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {stage === 'result' && result && (
                        <div className="scanner-result">
                            <ValuationCard result={result} />
                            <div className="scanner-result-actions">
                                <button className="btn-pill" onClick={handleReset}>
                                    <RotateCcw size={16} />
                                    <span>Scan Another Item</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === 'error' && (
                        <div className="scanner-error">
                            <div className="scanner-error-icon">
                                <AlertTriangle size={40} />
                            </div>
                            <h3>Scan Failed</h3>
                            <p>{error}</p>
                            <button className="btn-pill btn-pill-filled" onClick={handleReset}>
                                <RotateCcw size={16} />
                                <span>Try Again</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* History Section */}
                {history.length > 0 && stage === 'capture' && (
                    <div className="scanner-history" style={{ marginTop: '4rem' }}>
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Clock size={20} className="color-accent" />
                                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Recent Scans</h2>
                            </div>
                            <button className="btn-pill" onClick={clearHistory} style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                <Trash2 size={12} /> Clear All
                            </button>
                        </div>

                        <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {history.map(item => (
                                <div
                                    key={item.id}
                                    className="history-card glass"
                                    style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.3s' }}
                                    onClick={() => loadHistoryItem(item)}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                            {item.vision.isClothing && (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-accent)', background: 'rgba(73, 231, 212, 0.1)' }}>
                                                    <Scan size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>{item.vision.brand} {item.vision.garmentType}</h4>
                                            <p className="label-caps" style={{ fontSize: '0.65rem', margin: '2px 0 6px', opacity: 0.5 }}>₹{item.valuation.resaleLow} - ₹{item.valuation.resaleHigh}</p>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <span
                                                    className="label-caps"
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: item.valuation.recommendation === 'BUY' ? 'rgba(16, 185, 129, 0.1)' : item.valuation.recommendation === 'SELL' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: item.valuation.recommendation === 'BUY' ? '#10b981' : item.valuation.recommendation === 'SELL' ? '#f59e0b' : '#ef4444'
                                                    }}
                                                >
                                                    {item.valuation.recommendation}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
