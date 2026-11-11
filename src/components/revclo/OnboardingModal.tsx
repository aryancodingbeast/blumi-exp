'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const orbitRingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        if (step === 1 && cardsContainerRef.current) {
            const cards = cardsContainerRef.current.querySelectorAll('.onboard-fan-card');
            gsap.fromTo(
                cards,
                { y: 60, opacity: 0, scale: 0.85 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.65,
                    stagger: 0.1,
                    ease: 'back.out(1.5)',
                }
            );
        }

        if (step === 2 && orbitRingRef.current) {
            gsap.to(orbitRingRef.current, {
                rotation: 360,
                duration: 28,
                repeat: -1,
                ease: 'none',
            });
        }
    }, [isOpen, step]);

    if (!isOpen) return null;

    return (
        <div
            className="revclo-backdrop"
            style={{ alignItems: 'center', background: 'rgba(22, 22, 22, 0.72)' }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '410px',
                    minHeight: '640px',
                    background: 'var(--bg-canvas)',
                    borderRadius: '26px',
                    border: '1px solid var(--border-sand)',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                }}
            >
                {/* Top Header */}
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 8,
                        }}
                    >
                        <img
                            src={REVCLO_ASSETS.onboardingLogoSvg}
                            alt="RevClo"
                            style={{ width: 24, height: 24 }}
                        />
                        <span
                            style={{
                                fontFamily: 'var(--font-serif)',
                                fontWeight: 700,
                                fontSize: '18px',
                                color: 'var(--terracotta-900)',
                            }}
                        >
                            RevClo
                        </span>
                    </div>

                    <div
                        style={{
                            fontFamily: 'var(--font-brush)',
                            fontSize: '42px',
                            lineHeight: 1,
                            color: 'var(--terracotta-800)',
                            marginTop: 4,
                        }}
                    >
                        {step === 1 ? 'The Finds' : 'The Loop'}
                    </div>
                </div>

                {/* Center Stage Visuals */}
                {step === 1 ? (
                    /* Step 1: 3 Fanned Product Cards matching 360:4006 */
                    <div
                        ref={cardsContainerRef}
                        style={{
                            position: 'relative',
                            height: '295px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '12px 0',
                        }}
                    >
                        {/* Left rotated card */}
                        <div
                            className="onboard-fan-card"
                            style={{
                                position: 'absolute',
                                width: '146px',
                                background: '#ffffff',
                                borderRadius: '14px',
                                padding: '8px',
                                border: '1px solid var(--border-card)',
                                transform: 'translateX(-66px) translateY(10px) rotate(-13deg)',
                                boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
                            }}
                        >
                            <img
                                src={REVCLO_ASSETS.onboardingCard2}
                                alt="Archive Find"
                                style={{
                                    width: '100%',
                                    height: '142px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: 6,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>DIESEL</span>
                                <span>₹14,500</span>
                            </div>
                        </div>

                        {/* Right rotated card */}
                        <div
                            className="onboard-fan-card"
                            style={{
                                position: 'absolute',
                                width: '146px',
                                background: '#ffffff',
                                borderRadius: '14px',
                                padding: '8px',
                                border: '1px solid var(--border-card)',
                                transform: 'translateX(66px) translateY(12px) rotate(13deg)',
                                boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
                            }}
                        >
                            <img
                                src={REVCLO_ASSETS.onboardingCard3}
                                alt="Archive Sunglasses"
                                style={{
                                    width: '100%',
                                    height: '142px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: 6,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>VERSACE</span>
                                <span>₹7,200</span>
                            </div>
                        </div>

                        {/* Center Hero Card */}
                        <div
                            className="onboard-fan-card"
                            style={{
                                position: 'relative',
                                zIndex: 3,
                                width: '168px',
                                background: '#ffffff',
                                borderRadius: '16px',
                                padding: '9px',
                                border: '1.5px solid var(--terracotta-800)',
                                boxShadow: '0 16px 34px rgba(54, 28, 21, 0.2)',
                            }}
                        >
                            <span
                                className="revclo-trust-pill"
                                style={{ top: 16, left: 16 }}
                            >
                                92 🔥
                            </span>
                            <img
                                src={REVCLO_ASSETS.quiltedBagMain}
                                alt="Quilted Bag"
                                style={{
                                    width: '100%',
                                    height: '170px',
                                    objectFit: 'cover',
                                    borderRadius: '11px',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: 8,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>QUILTED</span>
                                <span>₹21,000</span>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                Large • Pristine
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Step 2: 8-Item Circular Clothing Loop matching 369:5219 */
                    <div
                        style={{
                            position: 'relative',
                            height: '295px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '12px 0',
                        }}
                    >
                        <div
                            ref={orbitRingRef}
                            style={{
                                position: 'relative',
                                width: '240px',
                                height: '240px',
                                borderRadius: '999px',
                                border: '1px dashed var(--border-card)',
                            }}
                        >
                            {REVCLO_ASSETS.loopItems.map((imgSrc, idx) => {
                                const angle = (idx / REVCLO_ASSETS.loopItems.length) * 2 * Math.PI;
                                const radius = 108;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                return (
                                    <div
                                        key={imgSrc}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            width: '56px',
                                            height: '56px',
                                            marginLeft: '-28px',
                                            marginTop: '-28px',
                                            transform: `translate(${x}px, ${y}px)`,
                                            background: '#ffffff',
                                            borderRadius: '14px',
                                            border: '1px solid var(--border-sand)',
                                            padding: '4px',
                                            boxShadow: '0 6px 14px rgba(0,0,0,0.08)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={`Loop item ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '10px',
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                width: '78px',
                                height: '78px',
                                borderRadius: '999px',
                                background: 'var(--terracotta-920)',
                                color: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(83,43,33,0.3)',
                            }}
                        >
                            <span style={{ fontFamily: 'var(--font-script)', fontSize: '22px' }}>
                                Circular
                            </span>
                            <span style={{ fontSize: '9px', opacity: 0.8 }}>100% Verified</span>
                        </div>
                    </div>
                )}

                {/* Copy & CTA */}
                <div style={{ textAlign: 'center', zIndex: 2 }}>
                    <h2
                        style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--text-ink)',
                            lineHeight: 1.25,
                            marginBottom: 8,
                        }}
                    >
                        {step === 1
                            ? 'One-of-a-kind pieces from closets you trust'
                            : 'Buy, wear, relist — keep iconic fashion in rotation'}
                    </h2>
                    <p
                        style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                            marginBottom: 18,
                            padding: '0 8px',
                        }}
                    >
                        {step === 1
                            ? 'Every piece on RevClo is scored by our AI Trust Scanner for photo authenticity, condition, and fair archive pricing.'
                            : 'List your pre-loved pieces in 30 seconds with AI pricing, chat directly with buyers, and ship effortlessly across India.'}
                    </p>

                    {/* Step Indicator Dots */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 6,
                            marginBottom: 16,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            aria-label="Step 1"
                            style={{
                                width: step === 1 ? 24 : 8,
                                height: 8,
                                borderRadius: 999,
                                background:
                                    step === 1 ? 'var(--terracotta-800)' : 'var(--border-card)',
                                transition: 'all 0.25s ease',
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            aria-label="Step 2"
                            style={{
                                width: step === 2 ? 24 : 8,
                                height: 8,
                                borderRadius: 999,
                                background:
                                    step === 2 ? 'var(--terracotta-800)' : 'var(--border-card)',
                                transition: 'all 0.25s ease',
                            }}
                        />
                    </div>

                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="revclo-primary-btn"
                            style={{ width: '100%' }}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="revclo-primary-btn"
                            style={{
                                width: '100%',
                                fontFamily: 'var(--font-brush)',
                                fontSize: '21px',
                                letterSpacing: '0.02em',
                            }}
                        >
                            Take me to the sauce
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            marginTop: 12,
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            textDecoration: 'underline',
                        }}
                    >
                        Just let me in
                    </button>
                </div>
            </div>
        </div>
    );
}
