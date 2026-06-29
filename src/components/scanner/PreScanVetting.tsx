'use client'

import { useState, useRef } from 'react'
import { ArrowRight, ChevronLeft, Check, Search, Sparkles, Shirt, ShoppingBag, History, Tag, Box, Info } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface PreScanVettingProps {
    onComplete: (data: any) => void
}

const CATEGORIES = [
    { id: 'streetwear', label: 'Streetwear', icon: <Shirt size={20} />, description: 'Hoodies, Tees, Sneakers' },
    { id: 'luxury', label: 'Luxury', icon: <ShoppingBag size={20} />, description: 'High-end brands, Designer' },
    { id: 'vintage', label: 'Vintage', icon: <History size={20} />, description: '20+ years old, Rare finds' },
    { id: 'ethnic', label: 'Ethnic', icon: <Sparkles size={20} />, description: 'Sarees, Kurtas, Traditional' },
    { id: 'boutique', label: 'Boutique', icon: <Tag size={20} />, description: 'Custom, Unbranded, Local' },
]

const CONDITIONS = [
    { id: 'new_with_tags', label: 'New with Tags', bonus: '+25% value' },
    { id: 'like_new', label: 'Like New', bonus: 'High demand' },
    { id: 'gently_used', label: 'Gently Used', bonus: 'Standard' },
    { id: 'well_worn', label: 'Well Worn', bonus: 'Used' },
]

export default function PreScanVetting({ onComplete }: PreScanVettingProps) {
    const [step, setStep] = useState(0)
    const [data, setData] = useState({
        category: '',
        brand: '',
        condition: '',
        isVintage: false,
        hasLabels: true,
        originalPrice: '',
    })

    const containerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        gsap.fromTo('.vetting-card', 
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        )
    }, [step])

    const next = () => setStep(s => s + 1)
    const back = () => setStep(s => Math.max(0, s - 1))

    const handleComplete = () => {
        onComplete(data)
    }

    return (
        <div className="vetting-container" ref={containerRef}>
            <div className="vetting-progress">
                <div className="progress-bar" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {step === 0 && (
                <div className="vetting-step">
                    <div className="vetting-header">
                        <h2 className="vetting-title">What are you listing?</h2>
                        <p className="vetting-subtitle">Select the category that fits best</p>
                    </div>

                    <div className="category-grid">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-card ${data.category === cat.id ? 'active' : ''}`}
                                onClick={() => {
                                    setData({ ...data, category: cat.id, isVintage: cat.id === 'vintage' })
                                    next()
                                }}
                            >
                                <div className="category-icon">{cat.icon}</div>
                                <div className="category-info">
                                    <span className="category-label">{cat.label}</span>
                                    <span className="category-desc">{cat.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="vetting-step">
                    <button className="back-btn" onClick={back}><ChevronLeft size={18} /> Back</button>
                    <div className="vetting-header">
                        <h2 className="vetting-title">Brand Details</h2>
                        <p className="vetting-subtitle">Type the brand name or select 'Unbranded'</p>
                    </div>

                    <div className="brand-input-wrap">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Type Brand (e.g. Zara, Nike, Unbranded)"
                                value={data.brand}
                                onChange={(e) => setData({ ...data, brand: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && data.brand && next()}
                                autoFocus
                            />
                            {data.brand && !['Zara', 'H&M', 'Nike', 'Adidas', 'Unbranded / Boutique'].includes(data.brand) && (
                                <button className="add-custom-btn" onClick={next}>
                                    Confirm <Check size={14} />
                                </button>
                            )}
                        </div>
                        
                        <div className="common-brands">
                            {['Zara', 'H&M', 'Nike', 'Adidas', 'Unbranded / Boutique'].map(b => (
                                <button 
                                    key={b} 
                                    className={`brand-pill ${data.brand === (b === 'Unbranded / Boutique' ? 'Unbranded' : b) ? 'active' : ''}`}
                                    onClick={() => {
                                        setData({ ...data, brand: b === 'Unbranded / Boutique' ? 'Unbranded' : b })
                                        next()
                                    }}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>

                    {data.brand && (
                        <button className="btn-pill btn-pill-filled next-btn" onClick={next}>
                            Continue <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="vetting-step">
                    <button className="back-btn" onClick={back}><ChevronLeft size={18} /> Back</button>
                    <div className="vetting-header">
                        <h2 className="vetting-title">Condition Vetting</h2>
                        <p className="vetting-subtitle">Be honest for the most accurate appraisal</p>
                    </div>

                    <div className="condition-stacked">
                        {CONDITIONS.map(cond => (
                            <button
                                key={cond.id}
                                className={`cond-row ${data.condition === cond.id ? 'active' : ''}`}
                                onClick={() => {
                                    setData({ ...data, condition: cond.id })
                                    next()
                                }}
                            >
                                <div className="cond-content">
                                    <span className="cond-label">{cond.label}</span>
                                    <span className="cond-bonus label-caps">{cond.bonus}</span>
                                </div>
                                <div className="cond-check"><Check size={16} /></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="vetting-step">
                    <button className="back-btn" onClick={back}><ChevronLeft size={18} /> Back</button>
                    <div className="vetting-header">
                        <h2 className="vetting-title">Deep Vetting</h2>
                        <p className="vetting-subtitle">One last thing to help find your item online</p>
                    </div>

                    <div className="deep-questions">
                        <div className="q-card">
                            <Box size={20} />
                            <div className="q-info">
                                <span>Do you have the original store labels/tags?</span>
                                <div className="q-actions">
                                    <button 
                                        className={`q-btn ${data.hasLabels ? 'active' : ''}`} 
                                        onClick={() => setData({ ...data, hasLabels: true })}
                                    >Yes</button>
                                    <button 
                                        className={`q-btn ${!data.hasLabels ? 'active' : ''}`} 
                                        onClick={() => setData({ ...data, hasLabels: false })}
                                    >No</button>
                                </div>
                            </div>
                        </div>

                        <div className="q-card">
                            <Info size={20} />
                            <div className="q-info">
                                <span>Estimated original price (in ₹, optional)</span>
                                <input 
                                    type="number" 
                                    className="q-input"
                                    placeholder="e.g. 2499"
                                    value={data.originalPrice}
                                    onChange={(e) => setData({ ...data, originalPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn-pill btn-pill-filled start-btn" onClick={handleComplete}>
                        <Sparkles size={16} /> Start Scanning
                    </button>
                </div>
            )}

            <style jsx>{`
                .vetting-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    max-width: 500px;
                    margin: 0 auto;
                    min-height: 480px;
                    display: flex;
                    flex-direction: column;
                }

                .vetting-progress {
                    height: 4px;
                    background: #f0f0f0;
                    border-radius: 2px;
                    margin-bottom: 2rem;
                    overflow: hidden;
                }

                .progress-bar {
                    height: 100%;
                    background: var(--bg-accent);
                    transition: width 0.4s ease;
                }

                .vetting-step {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    flex: 1;
                }

                .vetting-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 0.3rem;
                }

                .vetting-subtitle {
                    color: #666;
                    font-size: 0.9rem;
                }

                .category-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.8rem;
                }

                .category-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border: 1.5px solid #eee;
                    border-radius: 1rem;
                    background: none;
                    text-align: left;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }

                .category-card:hover { border-color: var(--bg-accent); background: #fafafa; }
                .category-card.active { border-color: var(--bg-accent); background: #fef2f2; }

                .category-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f8f8;
                    border-radius: 0.75rem;
                    color: #333;
                }

                .category-label { font-weight: 700; display: block; font-size: 0.95rem; }
                .category-desc { font-size: 0.75rem; color: #888; }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: none;
                    border: none;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #666;
                    cursor: pointer;
                    width: fit-content;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    background: #f8f8f8;
                    padding: 1rem;
                    border-radius: 0.8rem;
                    border: 1px solid #eee;
                }

                .search-box input {
                    background: none;
                    border: none;
                    width: 100%;
                    outline: none;
                    font-weight: 600;
                }

                .common-brands {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.6rem;
                    margin-top: 1rem;
                }

                .brand-pill {
                    padding: 0.5rem 1rem;
                    background: #f0f0f0;
                    border-radius: 999px;
                    border: none;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                }

                .brand-pill:hover { background: #e5e5e5; }

                .condition-stacked { display: flex; flex-direction: column; gap: 0.6rem; }
                .cond-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.2rem;
                    border: 1px solid #eee;
                    border-radius: 0.8rem;
                    background: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cond-row.active { border-color: var(--bg-accent); background: #fef2f2; }
                .cond-label { font-weight: 700; font-size: 0.9rem; }
                .cond-bonus { font-size: 0.65rem; color: #10b981; font-weight: 800; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; }
                .cond-check { opacity: 0; color: var(--bg-accent); }
                .cond-row.active .cond-check { opacity: 1; }

                .deep-questions { display: flex; flex-direction: column; gap: 1rem; }
                .q-card {
                    display: flex;
                    gap: 1rem;
                    background: #fcfcfc;
                    padding: 1rem;
                    border-radius: 1rem;
                    border: 1px solid #eee;
                }

                .q-info { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; font-weight: 700; }
                .q-actions { display: flex; gap: 0.5rem; }
                .q-btn {
                    flex: 1;
                    padding: 0.5rem;
                    background: #eee;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 800;
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .q-btn.active { background: #333; color: white; }
                .q-input {
                    background: white;
                    border: 1px solid #ddd;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    font-weight: 700;
                    outline: none;
                }

                .start-btn { margin-top: auto; padding: 1.2rem; }
                .next-btn { margin-top: auto; }
            `}</style>
        </div>
    )
}
