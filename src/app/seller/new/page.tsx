'use client'

import { createProduct } from '@/actions/products'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Tag, DollarSign, FileText, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import ScannerCapture from '@/components/scanner/ScannerCapture'
import PreScanVetting from '@/components/scanner/PreScanVetting'
import type { ScanPhoto, ScanResult } from '@/types/scanner'

export default function NewProductPage() {
    const router = useRouter()
    const [step, setStep] = useState<'vetting' | 'scan' | 'analyzing' | 'form'>('vetting')
    const [vettingData, setVettingData] = useState<any>(null)
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [scannedPhotos, setScannedPhotos] = useState<ScanPhoto[]>([])
    const [loading, setLoading] = useState(false)

    const handleVettingComplete = (data: any) => {
        setVettingData(data)
        setStep('scan')
    }

    const handlePhotosReady = async (photos: ScanPhoto[]) => {
        setScannedPhotos(photos)
        setStep('analyzing')

        try {
            const res = await fetch('/api/scanner/valuate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: photos.map(p => p.base64),
                    vettingData
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Analysis failed')

            setScanResult(data.result)
            setStep('form')
        } catch (err: any) {
            console.error('Valuation error:', err)
            alert(err.message || 'Failed to analyze item. Please try again.')
            setStep('scan')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const frontPhoto = scannedPhotos.find(p => p.slot === 'front')?.base64

        if (frontPhoto) {
            formData.append('images', JSON.stringify([frontPhoto]))
        } else {
            formData.append('images', JSON.stringify(['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3']))
        }

        try {
            await createProduct(formData)
            router.push('/seller')
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to list item.')
            setLoading(false)
        }
    }

    if (step === 'vetting') {
        return (
            <div style={{ padding: '6rem 1rem 4rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem' }}>Listing Intel</h1>
                        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Tell us a bit about the item for a better appraisal.</p>
                    </div>
                    <PreScanVetting onComplete={handleVettingComplete} />
                </div>
            </div>
        )
    }

    if (step === 'scan') {
        return (
            <div style={{ padding: '6rem 1rem 4rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem' }}>Scan Item</h1>
                        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Capture photos to verify brand and condition.</p>
                    </div>
                    <ScannerCapture onPhotosReady={handlePhotosReady} />
                </div>
            </div>
        )
    }

    if (step === 'analyzing') {
        return (
            <div style={{ padding: '8rem 2rem 4rem', minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Loader2 size={48} className="spinner" style={{ color: 'var(--bg-accent)', marginBottom: '2rem' }} />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Analyzing Item...</h2>
                <p style={{ opacity: 0.7, marginTop: '1rem', maxWidth: '400px', textAlign: 'center' }}>
                    Our AI is identifying the brand, condition, and checking live market data to suggest the best price.
                </p>
            </div>
        )
    }

    // Default values from AI
    const suggestedTitle = scanResult ? `${scanResult.vision.brand} ${scanResult.vision.garmentType}` : ''
    const suggestedPrice = scanResult ? scanResult.market.resaleAvg || Math.round((scanResult.valuation.resaleLow + scanResult.valuation.resaleHigh) / 2) : 0
    const suggestedCondition = scanResult?.vision.condition.replace(/_/g, ' ') || ''
    const suggestedDesc = scanResult ? `Brand: ${scanResult.vision.brand}\nType: ${scanResult.vision.garmentType}\nColor: ${scanResult.vision.color}\nFabric: ${scanResult.vision.fabric}\n\nCondition: ${suggestedCondition}\n${scanResult.vision.conditionDetails}\n\n${scanResult.valuation.recommendationReason}` : ''

    const coverImage = scannedPhotos.find(p => p.slot === 'front')?.base64

    return (
        <div style={{ padding: '8rem 2rem 4rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                    background: 'var(--bg-accent)',
                    padding: '3rem',
                    borderRadius: 'var(--radius-xl)',
                    color: 'white',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Sparkles size={120} style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }} />
                    <p className="label-caps" style={{ opacity: 0.8, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} /> AI Analyzed
                    </p>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', lineHeight: 1 }}>REVIEW LISTING_</h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <label className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Tag size={14} /> Product Title
                            </label>
                            <input name="title" required defaultValue={suggestedTitle} style={{ background: '#F5F5F7', border: 'none', borderRadius: '12px', padding: '1rem', fontStyle: 'italic', fontWeight: 600 }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <label className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={14} /> Description
                            </label>
                            <textarea name="description" rows={10} required defaultValue={suggestedDesc} style={{ background: '#F5F5F7', border: 'none', borderRadius: '12px', padding: '1rem', resize: 'none', lineHeight: '1.6' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Summary / Lock Card */}
                        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {coverImage && (
                                <img src={coverImage} alt="Cover" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '12px' }} />
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bg-accent)' }}>
                                    <Sparkles size={14} /> AI Suggested Price
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '1.2rem' }}>₹</span>
                                    <input name="price" type="number" step="0.01" required defaultValue={suggestedPrice} readOnly style={{ background: '#F5F5F7', border: '2px solid var(--bg-accent)', borderRadius: '12px', padding: '1rem 1rem 1rem 2.5rem', fontSize: '1.2rem', fontWeight: 800, width: '100%', color: 'var(--bg-dark)' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '-0.3rem' }}>Price is locked based on AI valuation of condition and market data.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: '#F5F5F7', borderRadius: '12px' }}>
                                <span className="label-caps" style={{ fontSize: '0.65rem', opacity: 0.6 }}>Verified Condition</span>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{suggestedCondition}</span>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-pill btn-pill-filled"
                            style={{ background: 'var(--bg-dark)', borderColor: 'var(--bg-dark)', color: 'white', padding: '1.5rem', width: '100%', justifyContent: 'center' }}
                        >
                            <span style={{ fontWeight: 900 }}>{loading ? 'PUBLISHING...' : 'LIST ITEM'}</span>
                            <ArrowRight size={18} style={{ marginLeft: '1rem' }} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


