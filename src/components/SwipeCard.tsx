'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Product } from '@/types'
import Image from 'next/image'
import { Heart, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface SwipeCardProps {
    product: Product
    onSwipe: (direction: 'LEFT' | 'RIGHT') => void
    isTop: boolean
}

export default function SwipeCard({ product, onSwipe, isTop }: SwipeCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [imageIndex, setImageIndex] = useState(0)
    const [dragState, setDragState] = useState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
    const [swipeIndicator, setSwipeIndicator] = useState<'LEFT' | 'RIGHT' | null>(null)
    const [isExiting, setIsExiting] = useState(false)
    const [exitDirection, setExitDirection] = useState<'LEFT' | 'RIGHT' | null>(null)
    const [imageLoading, setImageLoading] = useState(true)

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
        setIsExiting(true)
        setExitDirection(direction)
        setSwipeIndicator(direction)
        
        setTimeout(() => {
            onSwipe(direction)
        }, 400)
    }

    // Touch / Mouse drag handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isTop) return
        const target = e.target as HTMLElement
        if (target.closest('.card-image-nav') || target.closest('.card-action-btn')) return

        setDragState({
            x: 0,
            y: 0,
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY
        })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState.isDragging) return
        const dx = e.clientX - dragState.startX
        const dy = e.clientY - dragState.startY
        setDragState(prev => ({ ...prev, x: dx, y: dy }))

        if (dx > 80) setSwipeIndicator('RIGHT')
        else if (dx < -80) setSwipeIndicator('LEFT')
        else setSwipeIndicator(null)
    }

    const handlePointerUp = () => {
        if (!dragState.isDragging) return

        const threshold = 120
        if (dragState.x > threshold) {
            handleSwipeComplete('RIGHT')
        } else if (dragState.x < -threshold) {
            handleSwipeComplete('LEFT')
        } else {
            setDragState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
            setSwipeIndicator(null)
        }
    }

    const rotation = dragState.isDragging ? dragState.x * 0.08 : 0
    const opacity = isExiting ? 0 : 1

    const getExitTransform = () => {
        if (isExiting && exitDirection) {
            const xExit = exitDirection === 'RIGHT' ? 1200 : -1200
            return `translate(${xExit}px, -100px) rotate(${exitDirection === 'RIGHT' ? 30 : -30}deg)`
        }
        if (dragState.isDragging) {
            return `translate(${dragState.x}px, ${dragState.y * 0.3}px) rotate(${rotation}deg)`
        }
        return 'translate(0, 0) rotate(0deg)'
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
                transform: getExitTransform(),
                opacity,
                transition: dragState.isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
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
