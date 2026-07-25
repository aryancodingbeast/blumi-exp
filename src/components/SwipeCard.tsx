'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Product } from '@/types'
import Image from 'next/image'
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface SwipeCardProps {
    product: Product
    onSwipe: (direction: 'LEFT' | 'RIGHT') => void
    isTop: boolean
}

export default function SwipeCard({ product, onSwipe, isTop }: SwipeCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [imageIndex, setImageIndex] = useState(0)
    const [swipeIndicator, setSwipeIndicator] = useState<'LEFT' | 'RIGHT' | null>(null)
    const [isExiting, setIsExiting] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)

    // Drag state lives in refs so pointermove never triggers React re-renders.
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, x: 0, y: 0 })
    const exitingRef = useRef(false)
    const motionRef = useRef<{
        xTo: ((value: number) => void) | null
        yTo: ((value: number) => void) | null
        rTo: ((value: number) => void) | null
        reduceMotion: boolean
    }>({ xTo: null, yTo: null, rTo: null, reduceMotion: false })

    useGSAP(() => {
        const card = cardRef.current
        if (!card) return
        motionRef.current.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        return () => {
            gsap.killTweensOf(card)
        }
    }, { scope: cardRef })

    useEffect(() => {
        setImageLoading(true)
    }, [imageIndex, product.id])

    const images = product.images || []
    const totalImages = images.length

    const nextImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (imageIndex < totalImages - 1) setImageIndex(prev => prev + 1)
    }, [imageIndex, totalImages])

    const prevImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (imageIndex > 0) setImageIndex(prev => prev - 1)
    }, [imageIndex])

    // Keyboard controls
    useEffect(() => {
        if (!isTop) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handleSwipeComplete('LEFT')
            } else if (e.key === 'ArrowRight') {
                handleSwipeComplete('RIGHT')
            } else if (e.key === 'ArrowUp') {
                prevImage()
            } else if (e.key === 'ArrowDown') {
                nextImage()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isTop, nextImage, prevImage])

    const handleSwipeComplete = (direction: 'LEFT' | 'RIGHT') => {
        if (exitingRef.current) return
        exitingRef.current = true
        setIsExiting(true)
        setSwipeIndicator(direction)

        const card = cardRef.current
        if (!card || motionRef.current.reduceMotion) {
            // Reduced motion / no ref: instant hide, same 400ms handoff as before
            if (card) gsap.set(card, { opacity: 0 })
            setTimeout(() => onSwipe(direction), 400)
            return
        }

        gsap.killTweensOf(card)
        gsap.to(card, {
            x: direction === 'RIGHT' ? 1200 : -1200,
            y: -100,
            rotation: direction === 'RIGHT' ? 30 : -30,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => onSwipe(direction)
        })
    }

    // Touch / Mouse drag handlers — GSAP quickTo drives the card directly
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isTop || exitingRef.current) return
        const target = e.target as HTMLElement
        if (target.closest('.card-image-nav') || target.closest('.card-action-btn')) return

        const card = cardRef.current
        if (card && !motionRef.current.reduceMotion) {
            // Fresh quickTo setters per drag session (survive prior overwrites)
            motionRef.current.xTo = gsap.quickTo(card, 'x', { duration: 0.25, ease: 'power3.out' })
            motionRef.current.yTo = gsap.quickTo(card, 'y', { duration: 0.25, ease: 'power3.out' })
            motionRef.current.rTo = gsap.quickTo(card, 'rotation', { duration: 0.25, ease: 'power3.out' })
        }

        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, x: 0, y: 0 }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        const drag = dragRef.current
        if (!drag.isDragging || exitingRef.current) return
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        drag.x = dx
        drag.y = dy

        const card = cardRef.current
        if (card) {
            if (motionRef.current.reduceMotion) {
                gsap.set(card, { x: dx, y: dy * 0.3, rotation: dx * 0.08 })
            } else {
                motionRef.current.xTo?.(dx)
                motionRef.current.yTo?.(dy * 0.3)
                motionRef.current.rTo?.(dx * 0.08)
            }
        }

        const indicator: 'LEFT' | 'RIGHT' | null = dx > 80 ? 'RIGHT' : dx < -80 ? 'LEFT' : null
        setSwipeIndicator(prev => (prev === indicator ? prev : indicator))
    }

    const handlePointerUp = () => {
        const drag = dragRef.current
        if (!drag.isDragging || exitingRef.current) return
        drag.isDragging = false

        const threshold = 120
        if (drag.x > threshold) {
            handleSwipeComplete('RIGHT')
        } else if (drag.x < -threshold) {
            handleSwipeComplete('LEFT')
        } else {
            setSwipeIndicator(null)
            const card = cardRef.current
            if (card) {
                if (motionRef.current.reduceMotion) {
                    gsap.set(card, { x: 0, y: 0, rotation: 0 })
                } else {
                    // Springy elastic snap-back
                    gsap.to(card, {
                        x: 0,
                        y: 0,
                        rotation: 0,
                        duration: 0.7,
                        ease: 'elastic.out(1, 0.5)',
                        overwrite: true
                    })
                }
            }
        }
        drag.x = 0
        drag.y = 0
    }

    const getImageSrc = (img: string) => {
        if (img.startsWith('http') || img.startsWith('/')) return img
        return img
    }

    return (
        <div
            ref={cardRef}
            className={`swipe-card ${isTop ? 'swipe-card-top' : ''} ${isExiting ? 'swipe-card-exiting' : ''}`}
            style={{
                zIndex: isTop ? 10 : 5,
                touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Washi Tape Accent */}
            <div className="washi-tape-accent" />

            {/* Swipe Indicators */}
            {swipeIndicator === 'RIGHT' && (
                <div className="swipe-indicator swipe-indicator-like">
                    <Heart size={32} />
                    <span>SWAP</span>
                </div>
            )}
            {swipeIndicator === 'LEFT' && (
                <div className="swipe-indicator swipe-indicator-pass">
                    <X size={32} />
                    <span>PASS</span>
                </div>
            )}

            {/* Image Area */}
            <div className="swipe-card-image-area">
                {imageLoading && (
                    <div className="swipe-card-image-shimmer" />
                )}
                {totalImages > 0 && (
                    <Image
                        src={getImageSrc(images[imageIndex])}
                        alt={product.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority={isTop}
                        sizes="(max-width: 768px) 100vw, 420px"
                        onLoadingComplete={() => setImageLoading(false)}
                    />
                )}

                {/* Image Navigation Dots */}
                <div className="swipe-card-dots">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`swipe-dot ${i === imageIndex ? 'swipe-dot-active' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setImageIndex(i) }}
                        />
                    ))}
                </div>

                {/* Image Nav Arrows */}
                {imageIndex > 0 && (
                    <button className="card-image-nav card-image-nav-left" onClick={prevImage}>
                        <ChevronLeft size={20} />
                    </button>
                )}
                {imageIndex < totalImages - 1 && (
                    <button className="card-image-nav card-image-nav-right" onClick={nextImage}>
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* Gradient overlay for text readability */}
                <div className="swipe-card-gradient" />
            </div>

            {/* Product Info */}
            <div className="swipe-card-info">
                <div className="swipe-card-title-row">
                    <h2 className="swipe-card-title">{product.title}</h2>
                    {product.brand && (
                        <span className="handwritten-annotation">{product.brand}</span>
                    )}
                </div>
                <div className="swipe-card-tags">
                    <span className="swipe-tag">{product.size || 'Free Size'}</span>
                    <span className="swipe-tag">{product.category || 'Tops'}</span>
                    <span className="swipe-tag swipe-condition-pill">{(product.condition || 'Good').toUpperCase()}</span>
                </div>
                {product.description && (
                    <p className="swipe-card-desc">{product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}</p>
                )}
            </div>

            {/* Action Buttons */}
            {isTop && (
                <div className="swipe-card-actions">
                    <button
                        className="card-action-btn card-action-pass"
                        onClick={(e) => { e.stopPropagation(); handleSwipeComplete('LEFT') }}
                    >
                        <X size={28} />
                    </button>
                    <button
                        className="card-action-btn card-action-like"
                        onClick={(e) => { e.stopPropagation(); handleSwipeComplete('RIGHT') }}
                    >
                        <Heart size={28} />
                    </button>
                </div>
            )}
        </div>
    )
}
