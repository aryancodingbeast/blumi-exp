'use client'

import { useEffect, useState } from 'react'
import { Match, Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

interface MatchPopupProps {
    match: Match
    offeredProduct: Product
    matchedProduct?: Product
    onClose: () => void
}

export default function MatchPopup({ match, offeredProduct, matchedProduct, onClose }: MatchPopupProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        // Staggered entrance animation
        requestAnimationFrame(() => {
            setIsVisible(true)
            setTimeout(() => setShowContent(true), 300)
        })
    }, [])

    const handleClose = () => {
        setShowContent(false)
        setIsVisible(false)
        setTimeout(onClose, 300)
    }

    const getImageSrc = (product?: Product) => {
        const img = product?.images?.[0]
        if (!img) return '/collage-1.webp'
        return img
    }

    // Generate random particle positions for the celebration effect
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 4 + Math.random() * 8,
        color: i % 3 === 0 ? '#C8956C' : i % 3 === 1 ? '#C4724A' : '#D4A574'
    }))

    return (
        <div
            className={`match-popup-overlay ${isVisible ? 'match-popup-visible' : ''}`}
            onClick={handleClose}
        >
            {/* Celebration Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="match-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}

            <div
                className={`match-popup-content ${showContent ? 'match-popup-content-visible' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Match Header */}
                <div className="match-header">
                    <Sparkles size={24} className="match-sparkle" />
                    <h1 className="match-title">IT&apos;S A MATCH!</h1>
                    <p className="match-subtitle">Both of you liked each other&apos;s items for exchange</p>
                </div>

                {/* Items Side by Side */}
                <div className="match-items">
                    <div className="match-item">
                        <div className="match-item-image">
                            <Image
                                src={getImageSrc(offeredProduct)}
                                alt={offeredProduct.title}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <p className="match-item-label">YOUR ITEM</p>
                        <p className="match-item-title">{offeredProduct.title}</p>
                    </div>

                    <div className="match-swap-icon">
                        <ArrowRight size={20} />
                        <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                    </div>

                    <div className="match-item">
                        <div className="match-item-image">
                            <Image
                                src={getImageSrc(matchedProduct)}
                                alt={matchedProduct?.title || 'Matched Item'}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <p className="match-item-label">THEIR ITEM</p>
                        <p className="match-item-title">{matchedProduct?.title || 'Unknown'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="match-actions">
                    <Link href="/matches" className="match-btn-primary">
                        VIEW MATCH & CONFIRM
                    </Link>
                    <button onClick={handleClose} className="match-btn-secondary">
                        KEEP SWIPING
                    </button>
                </div>
            </div>
        </div>
    )
}
