'use client'

import { useRef, useState } from 'react'
import { Match, Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { SplitText } from 'gsap/dist/SplitText'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined' && SplitText) {
    gsap.registerPlugin(SplitText)
}

interface MatchPopupProps {
    match: Match
    offeredProduct: Product
    matchedProduct?: Product
    onClose: () => void
}

export default function MatchPopup({ match, offeredProduct, matchedProduct, onClose }: MatchPopupProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const closingRef = useRef(false)
    const reduceMotionRef = useRef(false)

    /* ------------------------------------------------------------------ */
    /* Entrance — celebration timeline (elastic pop, slide-ins, char pop,  */
    /* Physics2D confetti bursts). Exit is a paired ~0.3s timeline that    */
    /* preserves the original 300ms close handoff.                         */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const overlay = overlayRef.current
        if (!overlay) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        reduceMotionRef.current = reduceMotion
        if (reduceMotion) return

        const q = gsap.utils.selector(overlay)
        const splits: SplitText[] = []

        // Kinetic char pop on the title (reverted on complete for parity)
        let titleChars: Element[] = []
        const titleEl = q('.match-title')[0]
        if (titleEl) {
            try {
                const split = new SplitText(titleEl as HTMLElement, { type: 'chars', mask: 'chars' })
                splits.push(split)
                titleChars = split.chars as Element[]
            } catch {
                /* SplitText unavailable — fallback below */
            }
        }

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
                splits.forEach((s) => s.revert())
                splits.length = 0
            }
        })

        tl.from(overlay, { opacity: 0, duration: 0.3, ease: 'power2.out' })
            .from(q('.match-popup-content'), {
                scale: 0.7,
                opacity: 0,
                duration: 0.9,
                ease: 'elastic.out(1, 0.5)'
            }, '-=0.1')
            .from(q('.match-sparkle'), {
                scale: 0,
                rotation: -120,
                duration: 0.6,
                ease: 'back.out(2.2)'
            }, '-=0.7')

        if (titleChars.length > 0) {
            tl.from(titleChars, {
                yPercent: 110,
                scale: 0.6,
                duration: 0.7,
                stagger: 0.03,
                ease: 'back.out(1.8)'
            }, '-=0.55')
        } else {
            tl.from(q('.match-title'), { y: 24, opacity: 0, duration: 0.6 }, '-=0.55')
        }

        tl.from(q('.match-subtitle'), { y: 16, opacity: 0, duration: 0.5 }, '-=0.4')
            .from(q('.match-items .match-item:first-child'), {
                x: -60,
                opacity: 0,
                duration: 0.7
            }, '-=0.35')
            .from(q('.match-items .match-item:last-child'), {
                x: 60,
                opacity: 0,
                duration: 0.7
            }, '<')
            .from(q('.match-swap-icon'), {
                scale: 0,
                opacity: 0,
                duration: 0.55,
                ease: 'back.out(2.4)'
            }, '-=0.45')
            .from(q('.match-actions > *'), {
                y: 18,
                opacity: 0,
                duration: 0.5,
                stagger: 0.08
            }, '-=0.3')

        // Confetti bursts — Physics2DPlugin is registered globally in GSAPProvider
        const particleEls = q('.match-particle')
        if (particleEls.length > 0) {
            tl.set(particleEls, { opacity: 1 }, 0.35)
            tl.to(particleEls, {
                duration: 1.6,
                physics2D: {
                    velocity: 'random(200, 500)',
                    angle: 'random(240, 300)',
                    gravity: 600
                },
                rotation: 'random(-180, 180)',
                opacity: 0,
                stagger: 0.02,
                ease: 'none'
            }, 0.35)
        }

        return () => {
            splits.forEach((s) => s.revert())
            tl.kill()
        }
    }, { scope: overlayRef })

    const handleClose = () => {
        if (closingRef.current) return
        closingRef.current = true

        const overlay = overlayRef.current
        if (!overlay || reduceMotionRef.current) {
            // Reduced motion / no ref: keep the original 300ms handoff
            setTimeout(onClose, 300)
            return
        }

        // Paired exit timeline — same ~300ms close timing as before
        const q = gsap.utils.selector(overlay)
        const exitTl = gsap.timeline({
            defaults: { ease: 'power2.in' },
            onComplete: onClose
        })
        exitTl.to(q('.match-popup-content'), {
            scale: 0.88,
            opacity: 0,
            duration: 0.3,
            overwrite: 'auto'
        }, 0)
            .to(overlay, { opacity: 0, duration: 0.3, overwrite: 'auto' }, 0)
    }

    const getImageSrc = (product?: Product) => {
        const img = product?.images?.[0]
        if (!img) return '/collage-1.webp'
        return img
    }

    // Generate random particle positions for the celebration effect
    const [particles] = useState(() => Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: 4 + Math.random() * 8,
        color: i % 3 === 0 ? '#C8956C' : i % 3 === 1 ? '#C4724A' : '#D4A574'
    })))

    return (
        <div
            ref={overlayRef}
            className="match-popup-overlay"
            onClick={handleClose}
        >
            {/* Celebration Particles — driven by the GSAP Physics2D burst */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="match-particle"
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: '50%',
                        opacity: 0,
                        pointerEvents: 'none',
                    }}
                />
            ))}

            <div
                className="match-popup-content"
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
