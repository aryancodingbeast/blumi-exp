'use client'

import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface LoginClientProps {
    loginAction: () => Promise<void>
    error?: string
}

export default function LoginClient({ loginAction, error }: LoginClientProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const glowsRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        // 1. Entrance animation timeline
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

        tl.from(cardRef.current, {
            y: 40,
            scale: 0.95,
            opacity: 0,
            duration: 1.4,
            ease: 'power3.out'
        })

        // Stagger children inside the card
        const cardChildren = cardRef.current?.querySelectorAll('.animate-in')
        if (cardChildren && cardChildren.length > 0) {
            tl.from(cardChildren, {
                y: 20,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8
            }, '-=0.9')
        }

        // Animate background glows
        if (glowsRef.current) {
            const glows = glowsRef.current.children
            gsap.from(glows, {
                scale: 0.5,
                opacity: 0,
                duration: 2.5,
                stagger: 0.2,
                ease: 'power2.out'
            })
            
            // Loop float/pulsate on glows
            gsap.to(glows[0], {
                x: 30,
                y: -30,
                duration: 8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })
            gsap.to(glows[1], {
                x: -30,
                y: 30,
                duration: 10,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })
        }

        // 2. Magnetic Button effect using GSAP quickTo
        const btn = buttonRef.current
        if (btn) {
            const xTo = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3.out' })
            const yTo = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3.out' })

            const handleMouseMove = (e: MouseEvent) => {
                const rect = btn.getBoundingClientRect()
                const relX = e.clientX - (rect.left + rect.width / 2)
                const relY = e.clientY - (rect.top + rect.height / 2)
                
                // Max pull distance: 12px
                xTo(relX * 0.25)
                yTo(relY * 0.25)
            }

            const handleMouseLeave = () => {
                xTo(0)
                yTo(0)
            }

            btn.addEventListener('mousemove', handleMouseMove)
            btn.addEventListener('mouseleave', handleMouseLeave)

            return () => {
                btn.removeEventListener('mousemove', handleMouseMove)
                btn.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }, { scope: containerRef })

    return (
        <div ref={containerRef} style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            background: 'var(--bg-cream)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'var(--font-sans), sans-serif'
        }}>
            {/* Background cyber glows */}
            <div ref={glowsRef} style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-15%',
                    width: '70vw',
                    height: '70vw',
                    maxWidth: '600px',
                    maxHeight: '600px',
                    background: 'radial-gradient(circle, rgba(204,255,0,0.06) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    opacity: 0.7,
                    borderRadius: '50%',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-15%',
                    right: '-15%',
                    width: '70vw',
                    height: '70vw',
                    maxWidth: '600px',
                    maxHeight: '600px',
                    background: 'radial-gradient(circle, rgba(255,90,0,0.06) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    opacity: 0.5,
                    borderRadius: '50%',
                }} />
            </div>

            <div ref={cardRef} style={{
                position: 'relative',
                zIndex: 1,
                padding: 'clamp(2.5rem, 5vw, 4.5rem)',
                textAlign: 'center',
                maxWidth: '460px',
                width: '100%',
                background: 'var(--bg-white)',
                border: '1.5px solid var(--border-sand)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '4px'
            }}>
                <style dangerouslySetInnerHTML={{__html: `
                    .streetwear-nav { display: none !important; }
                    .site-footer { display: none !important; }
                    
                    .g-btn:hover {
                        background-color: var(--accent-yellow) !important;
                        color: var(--bg-cream) !important;
                        box-shadow: 0 0 15px rgba(204, 255, 0, 0.4);
                        border-color: var(--accent-yellow) !important;
                    }
                    
                    .terms-link {
                        color: var(--text-secondary);
                        transition: color 0.2s ease;
                        text-decoration: none;
                    }
                    .terms-link:hover {
                        color: var(--accent-orange);
                    }
                `}} />

                {/* Animated Logo Icon */}
                <div className="animate-in" style={{
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem',
                    color: 'var(--accent-yellow)',
                }}>
                    <span style={{ fontSize: '3rem', display: 'inline-block' }}>✦</span>
                </div>

                <p className="animate-in" style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: 'var(--accent-orange)',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    marginBottom: '1rem'
                }}>SECURE ACCESS_</p>

                <h1 className="animate-in" style={{
                    fontFamily: 'var(--font-heading), var(--font-serif), Georgia, serif',
                    fontWeight: 400,
                    fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                    lineHeight: 1.15,
                    marginBottom: '1.25rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.03em'
                }}>
                    Welcome to Blumi
                </h1>

                <p className="animate-in" style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    marginBottom: error ? '1.5rem' : '2.75rem',
                    padding: '0 0.5rem',
                    fontWeight: 500
                }}>
                    Sign in to chat with your personal stylist, curate moments that matter, and sync outfits to your closet.
                </p>

                {error && (
                    <div className="animate-in" style={{
                        width: '100%',
                        background: 'rgba(255, 90, 0, 0.08)',
                        border: '1px solid var(--accent-red)',
                        borderRadius: '4px',
                        padding: '1rem 1.2rem',
                        marginBottom: '2rem',
                        textAlign: 'left',
                    }}>
                        <p style={{
                            color: 'var(--accent-red)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: '0.25rem',
                            fontFamily: 'var(--font-sans)'
                        }}>
                            AUTHENTICATION ERROR_
                        </p>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            fontWeight: 500,
                            margin: 0,
                            fontFamily: 'var(--font-sans)'
                        }}>
                            An error occurred during authentication. Please try again with a valid Google account.
                        </p>
                    </div>
                )}

                <form action={loginAction} style={{ width: '100%' }} className="animate-in">
                    <button ref={buttonRef} type="submit" className="g-btn" style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '1.1rem 1.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-sans)',
                        background: 'var(--text-primary)',
                        color: 'var(--bg-cream)',
                        border: '1.5px solid var(--border-black)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        transition: 'background-color 0.25s, color 0.25s, border-color 0.25s, transform 0.1s ease',
                    }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                        <ArrowRight size={15} />
                    </button>
                </form>

                <p className="animate-in" style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    By continuing, you verify your agreement to Blumi's <br/>
                    <a href="#" className="terms-link">Terms of Service</a> & <a href="#" className="terms-link">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
