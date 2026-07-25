'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SplitText } from 'gsap/dist/SplitText'
import { useGSAP } from '@gsap/react'

const ThreeCanister = dynamic(() => import('./ThreeCanister'), { ssr: false })

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger, SplitText)
}

/**
 * LandingAnimator — pure motion layer for the landing page.
 * Wraps the server-rendered landing sections and animates them by selector.
 * It never changes copy, class names, layout, or resting appearance:
 * every tween is a `from`-style animation that ends at the current design.
 */
export default function LandingAnimator({ children }: { children: React.ReactNode }) {
    const container = useRef<HTMLDivElement>(null)
    const [show3D, setShow3D] = useState(false)

    // Only mount the WebGL layer when motion is allowed
    useEffect(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!reduceMotion) setShow3D(true)
    }, [])

    useGSAP(() => {
        const root = container.current
        if (!root) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(root)
        const splits: SplitText[] = []

        /* ------------------------------------------------------------------ */
        /* 1. HERO — cinematic entrance timeline                               */
        /* ------------------------------------------------------------------ */
        // Kinetic char-mask reveal on the two title lines (KineticHeadline recipe)
        let heroChars: Element[] = []
        q('.swap-hero-line-1, .swap-hero-line-2').forEach((line) => {
            try {
                const split = new SplitText(line as HTMLElement, { type: 'chars', mask: 'chars' })
                splits.push(split)
                heroChars = heroChars.concat(split.chars as Element[])
            } catch {
                /* SplitText unavailable — fallback handled below */
            }
        })

        const tl = gsap.timeline({
            defaults: { ease: 'power4.out' },
            onComplete: () => {
                // Restore the exact original DOM at rest (visual parity)
                splits.forEach((s) => s.revert())
                splits.length = 0
                enableCursorParallax()
            }
        })

        tl.from(q('.swap-hero-badge'), { y: -26, opacity: 0, duration: 0.8 })

        if (heroChars.length > 0) {
            tl.from(heroChars, {
                yPercent: 120,
                skewY: 6,
                duration: 1.05,
                stagger: 0.028,
                ease: 'power4.out'
            }, '-=0.45')
        } else {
            tl.from(q('.swap-hero-line-1, .swap-hero-line-2'), {
                y: 60,
                opacity: 0,
                duration: 1,
                stagger: 0.12
            }, '-=0.45')
        }

        tl.from(q('.swap-hero-subtitle'), { y: 24, opacity: 0, duration: 0.8 }, '-=0.6')
            .from(q('.swap-hero-actions > *'), {
                y: 18,
                opacity: 0,
                duration: 0.7,
                stagger: 0.08
            }, '-=0.55')
            // NOTE: .swap-card-demo-left/right carry infinite CSS keyframe transforms,
            // so GSAP animates the inner polaroids instead (no property fights).
            .from(q('.swap-card-demo-left .swap-card-demo-inner'), {
                x: -120,
                rotation: -9,
                opacity: 0,
                duration: 1.05
            }, '-=0.45')
            .from(q('.swap-card-demo-right .swap-card-demo-inner'), {
                x: 120,
                rotation: 9,
                opacity: 0,
                duration: 1.05
            }, '<')
            .from(q('.swap-visual-arrows'), {
                scale: 0,
                opacity: 0,
                duration: 0.75,
                ease: 'back.out(2.2)'
            }, '-=0.7')

        /* ------------------------------------------------------------------ */
        /* 2. Cursor parallax (EditorialHero quickTo pattern)                  */
        /*    Enabled after the entrance finishes to avoid tween conflicts.    */
        /* ------------------------------------------------------------------ */
        let onMove: ((event: MouseEvent) => void) | null = null

        const enableCursorParallax = () => {
            const targets = q('[data-cursor-depth]')
            if (targets.length === 0) return

            const quickParallax = targets.map((el) => {
                const depth = Number((el as HTMLElement).dataset.cursorDepth || 16)
                return {
                    xTo: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }),
                    yTo: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' }),
                    depth
                }
            })

            onMove = (event: MouseEvent) => {
                const bounds = root.getBoundingClientRect()
                const xNorm = (event.clientX - bounds.left) / bounds.width - 0.5
                const yNorm = (event.clientY - bounds.top) / Math.max(window.innerHeight, 1) - 0.5

                quickParallax.forEach((item) => {
                    item.xTo(xNorm * item.depth)
                    item.yTo(yNorm * item.depth)
                })
            }
            root.addEventListener('mousemove', onMove)
        }

        /* ------------------------------------------------------------------ */
        /* 3. HOW IT WORKS — batched stagger reveals + connector draws         */
        /* ------------------------------------------------------------------ */
        gsap.from(q('.swap-how-header > *'), {
            y: 34,
            opacity: 0,
            duration: 0.85,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: q('.swap-how-section')[0],
                start: 'top 80%',
                once: true
            }
        })

        const steps = q('.swap-how-step')
        if (steps.length > 0) {
            gsap.set(steps, { y: 54, opacity: 0 })
            ScrollTrigger.batch(steps, {
                start: 'top 85%',
                once: true,
                onEnter: (elements) => {
                    gsap.to(elements, {
                        y: 0,
                        opacity: 1,
                        duration: 0.9,
                        stagger: 0.12,
                        ease: 'power3.out',
                        overwrite: true
                    })
                    // Icon pop rides on top of the step reveal
                    gsap.from(
                        elements.map((el) => (el as HTMLElement).querySelector('.swap-step-icon')).filter(Boolean),
                        {
                            scale: 0.4,
                            rotation: -18,
                            duration: 0.9,
                            stagger: 0.12,
                            delay: 0.15,
                            ease: 'back.out(1.9)'
                        }
                    )
                }
            })
        }

        q('.swap-how-connector').forEach((connector) => {
            gsap.from(connector, {
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 1.1,
                ease: 'power2.inOut',
                scrollTrigger: {
                    trigger: connector,
                    start: 'top 88%',
                    once: true
                }
            })
        })

        /* ------------------------------------------------------------------ */
        /* 4. MATCH LOGIC — sequenced equation reveal                          */
        /* ------------------------------------------------------------------ */
        const matchSection = q('.swap-match-section')[0]
        if (matchSection) {
            const matchTl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                scrollTrigger: {
                    trigger: matchSection,
                    start: 'top 72%',
                    once: true
                }
            })

            matchTl.from(q('.swap-match-inner .swap-section-label'), { y: 22, opacity: 0, duration: 0.6 })
                .from(q('.swap-match-headline'), { y: 40, opacity: 0, duration: 0.9 }, '-=0.4')
                .from(q('.swap-match-explainer'), { y: 26, opacity: 0, duration: 0.75 }, '-=0.6')
                .from(q('.swap-match-step-mini, .swap-match-plus, .swap-match-equals'), {
                    y: 18,
                    scale: 0.85,
                    opacity: 0,
                    duration: 0.55,
                    stagger: 0.12,
                    ease: 'back.out(1.7)'
                }, '-=0.35')
                .from(q('.swap-match-result'), {
                    scale: 0,
                    rotation: -8,
                    opacity: 0,
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.55)'
                }, '-=0.1')
        }

        /* ------------------------------------------------------------------ */
        /* 5. CTA — scrubbed watermark + reveal                                */
        /* ------------------------------------------------------------------ */
        const ctaSection = q('.swap-cta-section')[0]
        if (ctaSection) {
            // Giant BLUMI watermark breathes with the scroll (scrub)
            gsap.fromTo(q('.swap-cta-title'),
                { scale: 0.9 },
                {
                    scale: 1.06,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: ctaSection,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.5
                    }
                }
            )

            gsap.from(q('.swap-cta-subtitle, .swap-cta-actions > *'), {
                y: 30,
                opacity: 0,
                duration: 0.85,
                stagger: 0.09,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: ctaSection,
                    start: 'top 78%',
                    once: true
                }
            })
        }

        return () => {
            if (onMove) root.removeEventListener('mousemove', onMove)
            splits.forEach((s) => s.revert())
            tl.kill()
        }
    }, { scope: container })

    return (
        <div ref={container} className="landing-motion-root" style={{ position: 'relative' }}>
            {show3D && (
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        top: '55vh',
                        left: 0,
                        right: 0,
                        height: '150vh',
                        zIndex: 3,
                        pointerEvents: 'none',
                        opacity: 0.14,
                        overflow: 'hidden'
                    }}
                >
                    <ThreeCanister />
                </div>
            )}
            {children}
        </div>
    )
}
