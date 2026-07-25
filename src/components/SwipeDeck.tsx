'use client'

import { useState, useCallback, useRef } from 'react'
import { Product, Match } from '@/types'
import SwipeCard from './SwipeCard'
import MatchPopup from './MatchPopup'
import { recordSwipe } from '@/actions/swipes'
import { Heart, Layers, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface SwipeDeckProps {
    initialProducts: Product[]
    offeredProduct: Product
}

export default function SwipeDeck({ initialProducts, offeredProduct }: SwipeDeckProps) {
    const [cards, setCards] = useState<Product[]>(initialProducts)
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
    const [showMatch, setShowMatch] = useState(false)
    const [stats, setStats] = useState({ liked: 0, passed: 0 })
    const [isProcessing, setIsProcessing] = useState(false)

    // Motion layer refs — one container ref shared by whichever root renders
    const containerRef = useRef<HTMLDivElement>(null)
    const firstRenderRef = useRef(true)

    /* ------------------------------------------------------------------ */
    /* Mount choreography — deck header + keyboard hints stagger reveal    */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const root = containerRef.current
        if (!root) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(root)
        const headerChildren = q('.swipe-deck-header > *')
        const hints = q('.swipe-deck-hints')
        if (headerChildren.length === 0 && hints.length === 0) return

        gsap.from([...headerChildren, ...hints], {
            y: 20,
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power3.out'
        })
    }, { scope: containerRef })

    /* ------------------------------------------------------------------ */
    /* Under-card settle — the promoted card eases from its stack pose     */
    /* (CSS :nth-child(2) pose: scale .96 / y 12 / rotate 1deg) to rest.   */
    /* Empty-state stagger reveal when the deck runs out.                  */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const root = containerRef.current
        if (!root) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(root)

        if (cards.length === 0) {
            // Empty state — stagger the exhausted-deck children into place
            const emptyChildren = q('.swipe-empty-inner > *')
            if (emptyChildren.length > 0) {
                gsap.from(emptyChildren, {
                    y: 24,
                    opacity: 0,
                    duration: 0.75,
                    stagger: 0.09,
                    ease: 'power3.out'
                })
            }
            return
        }

        if (firstRenderRef.current) {
            firstRenderRef.current = false
            return
        }

        // A card just left the deck — settle the new top card into position
        const topCard = q('.swipe-deck-stack .swipe-card')[0]
        if (topCard) {
            gsap.from(topCard, {
                scale: 0.96,
                y: 12,
                rotation: 1,
                duration: 0.5,
                ease: 'power3.out',
                overwrite: 'auto'
            })
        }
    }, { scope: containerRef, dependencies: [cards.length] })

    const handleSwipe = useCallback(async (direction: 'LEFT' | 'RIGHT') => {
        if (isProcessing || cards.length === 0) return
        setIsProcessing(true)

        const swipedProduct = cards[0]

        // Update stats
        setStats(prev => ({
            liked: direction === 'RIGHT' ? prev.liked + 1 : prev.liked,
            passed: direction === 'LEFT' ? prev.passed + 1 : prev.passed,
        }))

        // Remove top card
        setCards(prev => prev.slice(1))

        // Record swipe on server
        try {
            const result = await recordSwipe(
                swipedProduct.id,
                offeredProduct.id,
                direction
            )

            if (result.match) {
                setCurrentMatch(result.match)
                setShowMatch(true)
            }
        } catch (err) {
            console.error('[SwipeDeck] Error recording swipe:', err)
        }

        setIsProcessing(false)
    }, [cards, offeredProduct.id, isProcessing])

    const handleCloseMatch = () => {
        setShowMatch(false)
        setCurrentMatch(null)
    }

    // Empty state — all cards swiped
    if (cards.length === 0) {
        return (
            <div ref={containerRef} className="swipe-empty-state">
                <div className="swipe-empty-inner">
                    <div className="swipe-empty-icon">
                        <Layers size={48} />
                    </div>
                    <h2 className="swipe-empty-title">DECK EXHAUSTED_</h2>
                    <p className="swipe-empty-subtitle">
                        You've swiped through all available items.
                        {stats.liked > 0 && ` You liked ${stats.liked} item${stats.liked > 1 ? 's' : ''}.`}
                    </p>

                    <div className="swipe-empty-stats">
                        <div className="swipe-stat">
                            <Heart size={18} className="stat-icon-like" />
                            <span className="stat-value">{stats.liked}</span>
                            <span className="stat-label">LIKED</span>
                        </div>
                        <div className="swipe-stat-divider" />
                        <div className="swipe-stat">
                            <span className="stat-value">{stats.passed}</span>
                            <span className="stat-label">PASSED</span>
                        </div>
                    </div>

                    <div className="swipe-empty-actions">
                        {stats.liked > 0 && (
                            <Link href="/liked" className="swipe-btn-primary">
                                <ShoppingBag size={16} />
                                VIEW LIKED ITEMS
                            </Link>
                        )}
                        <Link href="/matches" className="swipe-btn-secondary">
                            CHECK MATCHES
                        </Link>
                    </div>
                </div>

                {showMatch && currentMatch && (
                    <MatchPopup
                        match={currentMatch}
                        offeredProduct={offeredProduct}
                        matchedProduct={cards.find(c => c.id === currentMatch.product_b_id)}
                        onClose={handleCloseMatch}
                    />
                )}
            </div>
        )
    }

    return (
        <div ref={containerRef} className="swipe-deck-container">
            {/* Deck Header */}
            <div className="swipe-deck-header">
                <div className="swipe-deck-offering">
                    <span className="offering-label">OFFERING_</span>
                    <span className="offering-title">{offeredProduct.title}</span>
                </div>
                <div className="swipe-deck-counter">
                    <span className="counter-value">{cards.length}</span>
                    <span className="counter-label">LEFT</span>
                </div>
            </div>

            {/* Card Stack */}
            <div className="swipe-deck-stack">
                {cards.slice(0, 3).map((product, index) => (
                    <SwipeCard
                        key={product.id}
                        product={product}
                        onSwipe={handleSwipe}
                        isTop={index === 0}
                    />
                ))}
            </div>

            {/* Keyboard Hints */}
            <div className="swipe-deck-hints">
                <span className="hint-key">←</span>
                <span className="hint-text">PASS</span>
                <span className="hint-divider">|</span>
                <span className="hint-key">→</span>
                <span className="hint-text">LIKE</span>
                <span className="hint-divider">|</span>
                <span className="hint-key">↑↓</span>
                <span className="hint-text">PHOTOS</span>
            </div>

            {/* Match Popup */}
            {showMatch && currentMatch && (
                <MatchPopup
                    match={currentMatch}
                    offeredProduct={offeredProduct}
                    matchedProduct={cards.find(c => c.id === currentMatch.product_b_id) || undefined}
                    onClose={handleCloseMatch}
                />
            )}
        </div>
    )
}
