'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ArrowRight, Snowflake, Sparkles } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

export default function EditorialHero() {
    const container = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const root = container.current
        if (!root) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(root)

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
        tl.from(q('.hero-fx-orb'), {
            opacity: 0,
            scale: 0.75,
            duration: 1.1,
            stagger: 0.1
        })
            .from(q('.hero-block'), {
                y: 85,
                opacity: 0,
                scale: 0.98,
                duration: 0.95,
                stagger: 0.08
            }, '-=0.8')
            .from(q('.reveal-item'), {
                y: 28,
                opacity: 0,
                duration: 0.7,
                stagger: 0.05
            }, '-=0.55')

        gsap.to(q('.hero-fx-orb'), {
            y: 'random(-40, 40)',
            x: 'random(-30, 30)',
            scale: 'random(0.96, 1.08)',
            duration: 'random(7, 11)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.2,
            force3D: true
        })

        q('[data-scroll-depth]').forEach((el) => {
            const depth = Number((el as HTMLElement).dataset.scrollDepth || -70)
            gsap.to(el, {
                y: depth,
                ease: 'none',
                scrollTrigger: {
                    trigger: root,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.7
                }
            })
        })

        const quickParallax = q('[data-cursor-depth]').map((el) => {
            const depth = Number((el as HTMLElement).dataset.cursorDepth || 16)
            return {
                xTo: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }),
                yTo: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' }),
                depth
            }
        })

        const onMove = (event: MouseEvent) => {
            const bounds = root.getBoundingClientRect()
            const xNorm = (event.clientX - bounds.left) / bounds.width - 0.5
            const yNorm = (event.clientY - bounds.top) / bounds.height - 0.5

            quickParallax.forEach((item) => {
                item.xTo(xNorm * item.depth)
                item.yTo(yNorm * item.depth)
            })
        }

        root.addEventListener('mousemove', onMove)

        return () => {
            root.removeEventListener('mousemove', onMove)
            tl.kill()
            ScrollTrigger.getAll().forEach((st) => {
                if (st.trigger === root) st.kill()
            })
            gsap.killTweensOf(q('.hero-fx-orb'))
            q('[data-cursor-depth]').forEach((el) => gsap.killTweensOf(el))
        }
    }, { scope: container })

    return (
        <section ref={container} className="editorial-hero">
            <div className="hero-fx" aria-hidden>
                <span className="hero-fx-orb orb-1" />
                <span className="hero-fx-orb orb-2" />
                <span className="hero-fx-orb orb-3" />
            </div>

            <div className="hero-grid page-wrap">
                <div className="hero-block hero-title glass" data-cursor-depth="18">
                    <div className="hero-pattern" />
                    <div className="reveal-item hero-title-content">
                        <p className="label-caps hero-kicker">
                            <Sparkles size={14} /> Curating Tomorrow
                        </p>
                        <h1 className="hero-heading">
                            <span>The Next</span>
                            <span>Vibe</span>
                            <span className="is-word">Is</span>
                            <span>Blumi</span>
                        </h1>
                    </div>
                    <div className="reveal-item hero-note" data-scroll-depth="-32">
                        <div className="hero-badge">
                            <Snowflake size={26} />
                        </div>
                        <p>A collective shaping the future of circular style.</p>
                    </div>
                </div>

                <div className="hero-block hero-image-main" data-cursor-depth="12" data-scroll-depth="-85">
                    <Image
                        src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1000"
                        alt="Style Preview"
                        fill
                        priority
                        style={{ objectFit: 'cover' }}
                    />
                    <div className="glass hero-image-caption reveal-item">
                        <div>
                            <p className="label-caps" style={{ fontSize: '0.62rem', marginBottom: '0.2rem' }}>Featured Look</p>
                            <p style={{ fontWeight: 900, fontSize: '1.05rem' }}>EDITORIAL.026</p>
                        </div>
                        <ArrowRight size={20} />
                    </div>
                </div>

                <div className="hero-block hero-promo reveal-item" data-cursor-depth="10">
                    <p className="label-caps" style={{ opacity: 0.6, marginBottom: '0.45rem' }}>Limited Release</p>
                    <p className="hero-promo-text">UP TO 30% OFF</p>
                </div>

                <div className="hero-block hero-image-side" data-cursor-depth="10" data-scroll-depth="-55">
                    <Image
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600"
                        alt="Editorial"
                        fill
                        style={{ objectFit: 'cover', opacity: 0.84 }}
                    />
                    <div className="hero-side-overlay" />
                    <div className="hero-side-copy">
                        <p className="label-caps" style={{ fontSize: '0.6rem' }}>The Photographer</p>
                        <p style={{ fontWeight: 800 }}>Elena Vibe</p>
                    </div>
                </div>

                <div className="hero-block hero-marquee">
                    <div className="hero-marquee-track">
                        THE NEXT VIBE IS BLUMI * SHOP THE COLLECTION * STAY FRESH * SUSTAINABLE LUXURY * GLOBAL CURATION *
                    </div>
                </div>
            </div>

            <style jsx>{`
                .editorial-hero {
                    min-height: 100vh;
                    padding: 6.5rem 0 1.5rem;
                    overflow: hidden;
                    position: relative;
                    isolation: isolate;
                }

                .hero-fx {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: -1;
                }

                .hero-fx-orb {
                    position: absolute;
                    border-radius: 999px;
                    filter: blur(55px);
                    opacity: 0.22;
                }

                .orb-1 {
                    width: clamp(180px, 35vw, 360px);
                    height: clamp(180px, 35vw, 360px);
                    left: -6%;
                    top: 8%;
                    background: #c4b8ff;
                }

                .orb-2 {
                    width: clamp(180px, 28vw, 300px);
                    height: clamp(180px, 28vw, 300px);
                    right: 6%;
                    top: 16%;
                    background: #49e7d4;
                }

                .orb-3 {
                    width: clamp(200px, 30vw, 340px);
                    height: clamp(200px, 30vw, 340px);
                    right: 18%;
                    bottom: 6%;
                    background: #ffc700;
                }

                .hero-grid {
                    display: grid;
                    grid-template-columns: repeat(12, minmax(0, 1fr));
                    gap: 1rem;
                }

                .hero-block {
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    position: relative;
                    min-height: 120px;
                    transform: translateZ(0);
                }

                .hero-title {
                    grid-column: 1 / 6;
                    grid-row: span 2;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    box-shadow: var(--shadow-subtle);
                    padding: clamp(1.5rem, 3.5vw, 2.8rem);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 460px;
                }

                .hero-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(var(--bg-secondary) 1.5px, transparent 1.5px);
                    background-size: 28px 28px;
                    opacity: 0.14;
                }

                .hero-title-content {
                    position: relative;
                    z-index: 1;
                }

                .hero-kicker {
                    color: var(--accent-blue);
                    margin-bottom: 1.4rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                }

                .hero-heading {
                    font-family: var(--font-display);
                    font-size: clamp(2.2rem, 8vw, 6.4rem);
                    line-height: 0.82;
                    letter-spacing: -0.05em;
                    text-transform: uppercase;
                    color: var(--accent-blue);
                }

                .hero-heading span {
                    display: block;
                }

                .hero-heading .is-word {
                    color: var(--text-primary);
                    font-style: italic;
                    font-weight: 500;
                }

                .hero-note {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: var(--text-secondary);
                    font-size: 0.92rem;
                    max-width: 290px;
                }

                .hero-badge {
                    width: 3rem;
                    height: 3rem;
                    border-radius: 999px;
                    display: grid;
                    place-items: center;
                    background: white;
                    color: var(--bg-accent);
                    box-shadow: var(--shadow-md);
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    flex-shrink: 0;
                }

                .hero-image-main {
                    grid-column: 6 / 10;
                    grid-row: span 3;
                    background: var(--bg-secondary);
                    min-height: 580px;
                    box-shadow: var(--shadow-md);
                }

                .hero-image-caption {
                    position: absolute;
                    left: 1rem;
                    right: 1rem;
                    bottom: 1rem;
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .hero-promo {
                    grid-column: 10 / 13;
                    background: var(--bg-highlight);
                    padding: clamp(1.2rem, 2vw, 2rem);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-height: 180px;
                }

                .hero-promo-text {
                    font-size: clamp(1.6rem, 3vw, 2.4rem);
                    font-weight: 900;
                    line-height: 0.92;
                }

                .hero-image-side {
                    grid-column: 10 / 13;
                    min-height: 390px;
                    background: var(--bg-dark);
                    box-shadow: var(--shadow-md);
                }

                .hero-side-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent 60%);
                }

                .hero-side-copy {
                    position: absolute;
                    left: 1.1rem;
                    bottom: 1.1rem;
                    color: white;
                }

                .hero-marquee {
                    grid-column: 1 / -1;
                    background: var(--bg-secondary);
                    border: 1.5px solid var(--text-primary);
                    box-shadow: var(--shadow-subtle);
                    display: flex;
                    align-items: center;
                    min-height: 84px;
                }

                .hero-marquee-track {
                    font-weight: 900;
                    font-size: clamp(1rem, 3.5vw, 1.6rem);
                    white-space: nowrap;
                    display: inline-block;
                    padding-left: 100%;
                    animation: hero-marquee 20s linear infinite;
                }

                @keyframes hero-marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }

                @media (max-width: 1100px) {
                    .hero-title {
                        grid-column: 1 / 7;
                    }

                    .hero-image-main {
                        grid-column: 7 / -1;
                        min-height: 500px;
                    }

                    .hero-promo {
                        grid-column: 1 / 5;
                    }

                    .hero-image-side {
                        grid-column: 5 / -1;
                        min-height: 280px;
                    }
                }

                @media (max-width: 780px) {
                    .editorial-hero {
                        padding-top: 7.5rem;
                    }

                    .hero-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-title,
                    .hero-image-main,
                    .hero-promo,
                    .hero-image-side,
                    .hero-marquee {
                        grid-column: auto;
                        grid-row: auto;
                    }

                    .hero-title {
                        min-height: 360px;
                    }

                    .hero-image-main {
                        min-height: 420px;
                    }

                    .hero-image-side {
                        min-height: 260px;
                    }
                }
            `}</style>
        </section>
    )
}
