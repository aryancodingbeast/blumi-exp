'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { logout } from '@/actions/auth'
import { signIn } from 'next-auth/react'
import { Sparkle, ArrowRight, Lock, Unlock, Mail, Clock, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface ThreeClosetGateProps {
    initialEmail?: string | null
    initialOnWaitlist?: boolean
    waitlistName?: string
    waitlistNumber?: number
    onReleaseLive?: () => void
    onVerified?: (email: string) => void
    onOpenComplete?: () => void
}

// Date Targets (set to past to bypass time boundaries entirely)
const RELEASE_DATE_WAITLIST = new Date('2000-01-01T00:00:00+05:30')
const RELEASE_DATE_NORMAL = new Date('2000-01-01T00:00:00+05:30')

export default function ThreeClosetGate({
    initialEmail = null,
    initialOnWaitlist = false,
    waitlistName = '',
    waitlistNumber = 0,
    onReleaseLive,
    onVerified,
    onOpenComplete
}: ThreeClosetGateProps) {
    const [waitlistUser, setWaitlistUser] = useState<{ isRegistered: boolean; name?: string; waitlistNumber?: number } | null>(
        initialEmail ? { isRegistered: initialOnWaitlist, name: waitlistName, waitlistNumber: waitlistNumber } : null
    )

    // Track dates
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [isLive, setIsLive] = useState(false)
    const [targetDateLabel, setTargetDateLabel] = useState('')

    // Ref-based 3D tilt to eliminate 60fps React re-renders
    const closetRef = useRef<HTMLDivElement>(null)
    const [doorOpen, setDoorOpen] = useState(false)

    const hasWaitlistAccess = waitlistUser?.isRegistered || initialOnWaitlist
    const activeTargetDate = hasWaitlistAccess ? RELEASE_DATE_WAITLIST : RELEASE_DATE_NORMAL

    // GSAP quickTo spring tilt — same ±20° range, zero React re-renders,
    // smoothed by GSAP's ticker instead of a CSS transition.
    useEffect(() => {
        const closet = closetRef.current
        if (!closet) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const rotYTo = gsap.quickTo(closet, 'rotationY', { duration: 0.8, ease: 'power3.out' })
        const rotXTo = gsap.quickTo(closet, 'rotationX', { duration: 0.8, ease: 'power3.out' })

        const handleMouseMove = (e: MouseEvent) => {
            if (doorOpen) return
            const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
            const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)

            rotYTo(x * 20)
            rotXTo(-y * 20)
        }

        const handleMouseLeave = () => {
            if (doorOpen) return
            rotYTo(0)
            rotXTo(0)
        }

        window.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            gsap.killTweensOf(closet)
        }
    }, [doorOpen])

    // Timer Interval
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null

        const checkTime = () => {
            const now = new Date()
            const diff = activeTargetDate.getTime() - now.getTime()

            // Format target date display string
            const options: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }
            setTargetDateLabel(activeTargetDate.toLocaleDateString('en-US', options))

            // The drop is finished. Vault stays closed permanently.
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            setIsLive(false)
            setDoorOpen(false)
        }
        checkTime()
        return () => { }
    }, [activeTargetDate, onReleaseLive, onOpenComplete])

    // Auto check if initialEmail exists
    useEffect(() => {
        if (initialEmail) {
            setWaitlistUser({
                isRegistered: initialOnWaitlist,
                name: waitlistName,
                waitlistNumber: waitlistNumber
            })
        } else {
            setWaitlistUser(null)
        }
    }, [initialEmail, initialOnWaitlist, waitlistName, waitlistNumber])

    // Trigger transition callback to reveal product catalog when doors are swung open in live mode
    useEffect(() => {
        if (isLive && doorOpen) {
            const timer = setTimeout(() => {
                if (onOpenComplete) {
                    onOpenComplete()
                }
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [isLive, doorOpen, onOpenComplete])


    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '85vh',
            width: '100%',
            position: 'relative',
            zIndex: 10,
            padding: '2rem 1rem'
        }}>
            {/* Background signal-red glows */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60vw',
                height: '60vw',
                maxWidth: '500px',
                background: 'radial-gradient(circle, rgba(209,26,26,0.12) 0%, transparent 65%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* 3D Container viewport */}
            <div style={{
                perspective: '1200px',
                width: '100%',
                maxWidth: '440px',
                height: '350px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4rem',
                position: 'relative',
                zIndex: 1,
                cursor: 'grab'
            }}>
                {/* 3D Closet box */}
                <div
                    ref={closetRef}
                    style={{
                        width: '240px',
                        height: '320px',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transform: 'rotateY(0deg) rotateX(0deg)',
                        transformOrigin: 'center center'
                    }}
                >
                    {/* BACK SIDE */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#040404',
                        border: '1px solid rgba(209, 26, 26, 0.15)',
                        transform: 'translateZ(-120px)',
                        boxShadow: 'inset 0 0 30px rgba(209, 26, 26, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem'
                    }}>
                        <div style={{
                            border: '1px solid #d11a1a',
                            color: '#d11a1a',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            lineHeight: 1.4
                        }}>
                            DROP<br />FINISHED
                        </div>
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.45rem',
                            color: '#ffffff',
                            opacity: 0.2,
                            letterSpacing: '0.1em',
                            marginTop: '1rem',
                            textTransform: 'uppercase'
                        }}>SYS_001_ARCHIVED</span>
                    </div>

                    {/* LEFT SIDE */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '-60px',
                        width: '120px',
                        background: '#080808',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transform: 'rotateY(90deg)',
                    }} />

                    {/* RIGHT SIDE */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: '-60px',
                        width: '120px',
                        background: '#080808',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transform: 'rotateY(-90deg)',
                    }} />

                    {/* TOP SIDE */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '-60px',
                        height: '120px',
                        background: '#0a0a0a',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transform: 'rotateX(-90deg)',
                    }} />

                    {/* BOTTOM SIDE */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: '-60px',
                        height: '120px',
                        background: '#050505',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transform: 'rotateX(90deg)',
                    }} />

                    {/* LEFT DOOR */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: '120px',
                            background: '#0c0c0c',
                            border: '2px solid rgba(255, 255, 255, 0.08)',
                            borderRight: '1px solid rgba(209, 26, 26, 0.3)',
                            transformOrigin: 'left center',
                            transform: 'rotateY(0deg)',
                            transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.6)',
                            cursor: 'not-allowed'
                        }}
                    >
                        {/* Door lock handle */}
                        <div style={{
                            width: '6px',
                            height: '40px',
                            background: '#d11a1a',
                            marginRight: '6px',
                            borderRadius: '2px',
                            boxShadow: '0 0 10px rgba(209, 26, 26, 0.8)'
                        }} />
                    </div>

                    {/* RIGHT DOOR */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            width: '120px',
                            background: '#0c0c0c',
                            border: '2px solid rgba(255, 255, 255, 0.08)',
                            borderLeft: '1px solid rgba(209, 26, 26, 0.3)',
                            transformOrigin: 'right center',
                            transform: 'rotateY(0deg)',
                            transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.6)',
                            cursor: 'not-allowed'
                        }}
                    >
                        {/* Door lock handle */}
                        <div style={{
                            width: '6px',
                            height: '40px',
                            background: '#d11a1a',
                            marginLeft: '6px',
                            borderRadius: '2px',
                            boxShadow: '0 0 10px rgba(209, 26, 26, 0.8)'
                        }} />
                    </div>

                    {/* LOCK PANEL SCREEN OVERLAY */}
                    <div style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) translateZ(10px)',
                        zIndex: 15,
                        background: '#050505',
                        border: '1px solid rgba(209, 26, 26, 0.4)',
                        padding: '0.5rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        pointerEvents: 'none',
                        boxShadow: '0 0 25px rgba(209, 26, 26, 0.25)',
                        borderRadius: '0px',
                        opacity: 1,
                        transition: 'opacity 0.4s ease'
                    }}>
                        <Lock size={14} style={{ color: '#d11a1a' }} />
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            color: '#d11a1a',
                            letterSpacing: '0.1em'
                        }}>DROP_FINISHED</span>
                    </div>
                </div>
            </div>

            {/* Title / Badges */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    color: '#d11a1a',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '0.8rem'
                }}>
                    🔒 drop terminated / collection locked
                </span>

                <h1 style={{
                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                    fontWeight: 900,
                    fontSize: 'clamp(2rem, 6vw, 3rem)',
                    color: '#ffffff',
                    lineHeight: 1.05,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    marginBottom: '1rem'
                }}>
                    THE VAULT IS FINISHED_
                </h1>

                <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.82rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    maxWidth: '380px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    This exclusive drop campaign has closed. Locker doors are secured, and clothing items are no longer available.
                </p>
            </div>

            {/* Countdown timer blocks */}
            {isLive ? (
                <div style={{
                    background: 'rgba(209, 26, 26, 0.08)',
                    border: '1px solid #d11a1a',
                    padding: '1.2rem 3rem',
                    marginBottom: '3.5rem',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 0 25px rgba(209, 26, 26, 0.15)'
                }}>
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        color: '#d11a1a',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase'
                    }}>
                        [SYSTEM COLLECTION_] UNLOCKED FOR ALL
                    </span>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    gap: '1.2rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '3.5rem',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {[
                        { label: 'DD', val: timeLeft.days },
                        { label: 'HR', val: timeLeft.hours },
                        { label: 'MIN', val: timeLeft.minutes },
                        { label: 'SEC', val: timeLeft.seconds }
                    ].map((t, idx) => (
                        <div key={t.label} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: '#080808',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '1.1rem 1.4rem',
                                minWidth: '76px',
                                borderRadius: '0px'
                            }}>
                                <span style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '1.8rem',
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    lineHeight: 1
                                }}>
                                    {String(t.val).padStart(2, '0')}
                                </span>
                                <span style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.52rem',
                                    fontWeight: 700,
                                    color: '#d11a1a',
                                    letterSpacing: '0.1em',
                                    marginTop: '0.4rem'
                                }}>{t.label}</span>
                            </div>
                            {idx < 3 && (
                                <span style={{
                                    fontSize: '1.5rem',
                                    color: 'rgba(209, 26, 26, 0.4)',
                                    fontWeight: 900,
                                    marginLeft: '1.2rem',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>:</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic Verification Box depending on NextAuth State */}
            {!isLive && (
                <div style={{
                    width: '100%',
                    maxWidth: '420px',
                    position: 'relative',
                    zIndex: 20, // Guarantee absolute clickability above 3D transitions
                    borderRadius: '0px'
                }}>
                    {!initialEmail ? (
                        /* Case A: Not logged in */
                        <div style={{
                            background: '#040404',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '2rem 1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Lock size={15} style={{ color: '#d11a1a' }} />
                                <h4 style={{
                                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                    fontWeight: 900,
                                    fontSize: '0.78rem',
                                    color: '#ffffff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    margin: 0
                                }}>WAITLIST VERIFICATION PANEL</h4>
                            </div>

                            <p style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.72rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                                lineHeight: 1.5,
                                marginBottom: '1.8rem'
                            }}>
                                Early access (8:45 PM) is reserved exclusively for campus waitlisted members. Connect your campus student Gmail to verify your drop access.
                            </p>

                            <button
                                onClick={() => signIn('google')}
                                className="hover-opacity-85"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    width: '100%',
                                    background: '#ffffff',
                                    color: '#000000',
                                    border: 'none',
                                    padding: '1rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                <span>LOG IN WITH GMAIL TO VERIFY</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : hasWaitlistAccess ? (
                        /* Case B: Logged in and on waitlist */
                        <div style={{
                            background: '#040d08',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            padding: '2rem 1.5rem',
                            textAlign: 'center'
                        }}>
                            <Sparkle size={18} style={{ color: '#10b981', marginBottom: '0.6rem' }} />
                            <h4 style={{
                                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                color: '#10b981',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: '0.5rem'
                            }}>EARLY ACCESS TICKET SECURED_</h4>

                            <p style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.72rem',
                                color: 'rgba(16, 185, 129, 0.7)',
                                lineHeight: 1.5,
                                marginBottom: '1.5rem'
                            }}>
                                Welcome back, <strong>{waitlistUser?.name || 'Waitlist Member'}</strong>! Your waitlist position <strong>#{waitlistUser?.waitlistNumber || 'Verified'}</strong> was successfully authenticated via <strong>{initialEmail}</strong>. Early access opens at <strong>8:45 PM IST</strong>. Stand by.
                            </p>

                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="hover-opacity-80"
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        color: '#10b981',
                                        padding: '0.5rem 1.2rem',
                                        fontSize: '0.58rem',
                                        fontWeight: 800,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    LOGOUT / CHANGE ACCOUNT
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Case C: Logged in but NOT on waitlist */
                        <div style={{
                            background: '#0a0505',
                            border: '1px solid rgba(209, 26, 26, 0.15)',
                            padding: '2rem 1.5rem',
                            textAlign: 'center'
                        }}>
                            <Lock size={18} style={{ color: '#d11a1a', marginBottom: '0.6rem' }} />
                            <h4 style={{
                                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                fontWeight: 900,
                                fontSize: '0.82rem',
                                color: '#ffffff',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: '0.5rem'
                            }}>STANDARD RELEASE TARGET APPLIED_</h4>

                            <p style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.72rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                                lineHeight: 1.5,
                                marginBottom: '1.5rem'
                            }}>
                                Connected as <strong>{initialEmail}</strong>. This account is not registered on the campus waitlist. Standard drop release opens at <strong>9:00 PM IST</strong>.
                            </p>

                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="hover-opacity-80"
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        padding: '0.5rem 1.2rem',
                                        fontSize: '0.58rem',
                                        fontWeight: 800,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    LOGOUT / USE WAITLIST EMAIL
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Inline dynamic styles for float animation */}
            <style jsx>{`
                @keyframes closetFloat {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `}</style>
        </div>
    )
}
