'use client'

import { useState, useEffect } from 'react'
import { Match } from '@/types'
import { getMatches, confirmExchange, declineExchange } from '@/actions/matches'
import Image from 'next/image'
import Link from 'next/link'
import { Repeat2, Check, X, Loader2, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        document.body.classList.add('checkout-flow-active')
        loadMatches()
        return () => document.body.classList.remove('checkout-flow-active')
    }, [])

    const loadMatches = async () => {
        try {
            const data = await getMatches()
            setMatches(data)
        } catch (err) {
            console.error('[MatchesPage] Error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async (matchId: string) => {
        setActionLoading(matchId)
        try {
            const result = await confirmExchange(matchId)
            if (result.success) {
                await loadMatches() // Refresh
            }
        } catch (err) {
            console.error('[MatchesPage] Confirm error:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDecline = async (matchId: string) => {
        setActionLoading(matchId)
        try {
            const result = await declineExchange(matchId)
            if (result.success) {
                await loadMatches()
            }
        } catch (err) {
            console.error('[MatchesPage] Decline error:', err)
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusBadge = (match: Match) => {
        switch (match.status) {
            case 'COMPLETED':
                return <span className="match-status-badge match-status-completed"><CheckCircle2 size={12} /> EXCHANGED</span>
            case 'DECLINED':
                return <span className="match-status-badge match-status-declined"><XCircle size={12} /> DECLINED</span>
            case 'ACCEPTED':
                return <span className="match-status-badge match-status-accepted"><Clock size={12} /> WAITING FOR OTHER</span>
            default:
                return <span className="match-status-badge match-status-pending"><Clock size={12} /> PENDING</span>
        }
    }

    if (loading) {
        return (
            <div className="swipe-loading">
                <Loader2 size={32} className="animate-spin" style={{ color: '#d11a1a' }} />
                <p className="swipe-loading-text">LOADING MATCHES...</p>
            </div>
        )
    }

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div className="closet-page-header">
                    <div>
                        <p className="closet-page-label">EXCHANGE CENTER_</p>
                        <h1 className="closet-page-title">MY MATCHES</h1>
                    </div>
                    <div className="closet-page-stats">
                        <div className="closet-stat-box">
                            <Repeat2 size={14} style={{ color: '#d11a1a' }} />
                            <span className="closet-stat-value">{matches.length}</span>
                            <span className="closet-stat-label">TOTAL</span>
                        </div>
                    </div>
                </div>

                {matches.length === 0 ? (
                    <div className="closet-empty">
                        <div className="closet-empty-inner">
                            <Repeat2 size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '1.5rem' }} />
                            <h2 className="closet-empty-title">NO MATCHES YET_</h2>
                            <p className="closet-empty-text">
                                Keep swiping! When both you and another user like each other&apos;s exchange items, a match will appear here.
                            </p>
                            <Link href="/swipe" className="closet-empty-cta">
                                <Repeat2 size={16} />
                                START SWIPING
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="matches-list">
                        {matches.map(match => {
                            const productA = match.product_a
                            const productB = match.product_b
                            const imgA = productA?.images?.[0] || '/collage-1.webp'
                            const imgB = productB?.images?.[0] || '/collage-1.webp'
                            const isActionable = match.status === 'PENDING' || match.status === 'ACCEPTED'
                            const isLoading = actionLoading === match.id

                            return (
                                <div key={match.id} className={`match-card match-card-${match.status.toLowerCase()}`}>
                                    {getStatusBadge(match)}

                                    <div className="match-card-items">
                                        {/* Product A */}
                                        <div className="match-card-product">
                                            <div className="match-card-product-image">
                                                <Image src={imgA} alt={productA?.title || 'Item A'} fill style={{ objectFit: 'cover' }} />
                                            </div>
                                            <div className="match-card-product-info">
                                                <p className="match-card-product-owner">
                                                    {match.user_a?.name || 'User'}
                                                </p>
                                                <p className="match-card-product-title">{productA?.title || 'Unknown'}</p>
                                                <span className="match-card-product-size">{productA?.size || 'Free Size'}</span>
                                            </div>
                                        </div>

                                        {/* Swap Icon */}
                                        <div className="match-card-swap-icon">
                                            <Repeat2 size={24} />
                                        </div>

                                        {/* Product B */}
                                        <div className="match-card-product">
                                            <div className="match-card-product-image">
                                                <Image src={imgB} alt={productB?.title || 'Item B'} fill style={{ objectFit: 'cover' }} />
                                            </div>
                                            <div className="match-card-product-info">
                                                <p className="match-card-product-owner">
                                                    {match.user_b?.name || 'User'}
                                                </p>
                                                <p className="match-card-product-title">{productB?.title || 'Unknown'}</p>
                                                <span className="match-card-product-size">{productB?.size || 'Free Size'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isActionable && (
                                        <div className="match-card-actions">
                                            <button
                                                className="match-action-confirm"
                                                onClick={() => handleConfirm(match.id)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                CONFIRM EXCHANGE
                                            </button>
                                            <button
                                                className="match-action-decline"
                                                onClick={() => handleDecline(match.id)}
                                                disabled={isLoading}
                                            >
                                                <X size={14} />
                                                DECLINE
                                            </button>
                                        </div>
                                    )}

                                    {match.status === 'COMPLETED' && (
                                        <div className="match-completed-banner">
                                            <CheckCircle2 size={16} />
                                            Exchange completed! Coordinate with your match to swap items.
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
