'use client'

import { useRef, useEffect } from 'react'
import type { ScanResult } from '@/types/scanner'
import { TrendingUp, TrendingDown, Minus, Award, BarChart3, Tag, Shirt, Sparkles } from 'lucide-react'

interface ValuationCardProps {
    result: ScanResult
}

export default function ValuationCard({ result }: ValuationCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const { vision, market, valuation } = result

    useEffect(() => {
        const card = cardRef.current
        if (!card) return

        card.style.opacity = '0'
        card.style.transform = 'translateY(40px) scale(0.95)'

        requestAnimationFrame(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            card.style.opacity = '1'
            card.style.transform = 'translateY(0) scale(1)'
        })
    }, [])

    const recBadgeClass =
        valuation.recommendation === 'BUY' ? 'val-badge-buy' :
            valuation.recommendation === 'SELL' ? 'val-badge-sell' : 'val-badge-skip'

    const RecIcon =
        valuation.recommendation === 'BUY' ? TrendingUp :
            valuation.recommendation === 'SELL' ? Minus : TrendingDown

    return (
        <div ref={cardRef} className="valuation-card">
            <div className="val-header">
                <div className="val-header-left">
                    <span className="label-caps val-brand-label">{vision.brand}</span>
                    <h2 className="val-item-name">{vision.garmentType || vision.category}</h2>
                    <div className="val-meta-row">
                        <span className="val-meta-chip">
                            <Shirt size={12} /> {vision.fabric}
                        </span>
                        <span className="val-meta-chip">
                            <Tag size={12} /> {vision.color}
                        </span>
                    </div>
                </div>
                <div className={`val-rec-badge ${recBadgeClass}`}>
                    <RecIcon size={18} />
                    <span>{valuation.recommendation}</span>
                </div>
            </div>

            <div className="val-price-block">
                <div className="val-price-label label-caps">Estimated Resale Value</div>
                <div className="val-price-range">
                    <span className="val-currency">₹</span>
                    <span className="val-price-low">{valuation.resaleLow.toLocaleString('en-IN')}</span>
                    <span className="val-price-dash">—</span>
                    <span className="val-currency">₹</span>
                    <span className="val-price-high">{valuation.resaleHigh.toLocaleString('en-IN')}</span>
                </div>
                {market.msrp && (
                    <div className="val-msrp">
                        Original MSRP: ₹{market.msrp.toLocaleString('en-IN')}
                        <span className="val-msrp-source"> via {market.msrpSource}</span>
                    </div>
                )}
            </div>

            <div className="val-stats-grid">
                <div className="val-stat">
                    <div className="val-stat-icon">
                        <Sparkles size={16} />
                    </div>
                    <div className="val-stat-info">
                        <span className="val-stat-value">{valuation.confidence}%</span>
                        <span className="label-caps val-stat-label">Confidence</span>
                    </div>
                </div>

                <div className="val-stat">
                    <div className="val-stat-icon">
                        <Award size={16} />
                    </div>
                    <div className="val-stat-info">
                        <span className="val-stat-value">{valuation.resellScore}/10</span>
                        <span className="label-caps val-stat-label">Resell Score</span>
                    </div>
                </div>

                <div className="val-stat">
                    <div className="val-stat-icon">
                        <BarChart3 size={16} />
                    </div>
                    <div className="val-stat-info">
                        <span className="val-stat-value">{market.numListingsFound}</span>
                        <span className="label-caps val-stat-label">Listings Found</span>
                    </div>
                </div>

                <div className="val-stat">
                    <div className="val-stat-icon">
                        <TrendingUp size={16} />
                    </div>
                    <div className="val-stat-info">
                        <span className="val-stat-value" style={{ textTransform: 'capitalize' }}>{market.marketDemand}</span>
                        <span className="label-caps val-stat-label">Demand</span>
                    </div>
                </div>
            </div>

            <div className="val-resell-gauge">
                <div className="val-gauge-label label-caps">Resell-Ready Score</div>
                <div className="val-gauge-track">
                    <div
                        className="val-gauge-fill"
                        style={{
                            width: `${valuation.resellScore * 10}%`,
                            background: valuation.resellScore >= 7 ? '#10b981' : valuation.resellScore >= 4 ? '#fbbf24' : '#ef4444',
                        }}
                    />
                    <div className="val-gauge-markers">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="val-gauge-marker" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="val-recommendation">
                <p className="val-rec-text">{valuation.recommendationReason}</p>
            </div>

            {vision.wearTearNotes && vision.wearTearNotes.length > 0 && (
                <div className="val-notes">
                    <p className="label-caps val-notes-title">Condition Notes</p>
                    <ul className="val-notes-list">
                        {vision.wearTearNotes.map((note, i) => (
                            <li key={i}>{note}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="val-condition-badge">
                <span className="label-caps">Condition:</span>
                <span className="val-condition-value">
                    {vision.condition.replace(/_/g, ' ')}
                </span>
            </div>
        </div>
    )
}
