'use client';

import React from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';

export default function LoginPage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'var(--bg-canvas)',
            }}
        >
            <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <img
                        src={REVCLO_ASSETS.onboardingLogoSvg}
                        alt="RevClo"
                        style={{ width: 28, height: 28 }}
                    />
                    <span
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--terracotta-900)',
                        }}
                    >
                        RevClo
                    </span>
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-brush)',
                        fontSize: '40px',
                        color: 'var(--terracotta-800)',
                        marginTop: 6,
                    }}
                >
                    The Finds
                </div>
            </div>

            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 20,
                    border: '1px solid var(--border-card)',
                    padding: 20,
                    textAlign: 'center',
                    boxShadow: '0 12px 32px rgba(54,28,21,0.08)',
                }}
            >
                <img
                    src={REVCLO_ASSETS.quiltedBagMain}
                    alt="RevClo Archive"
                    style={{
                        width: '160px',
                        height: '168px',
                        objectFit: 'cover',
                        borderRadius: 14,
                        marginBottom: 14,
                    }}
                />
                <h1 style={{ fontSize: '19px', fontWeight: 700, marginBottom: 6 }}>
                    Welcome to RevClo
                </h1>
                <p
                    style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        marginBottom: 18,
                        lineHeight: 1.45,
                    }}
                >
                    Sign in to sync your closet, chat with sellers, and shop AI-verified pre-loved
                    fashion.
                </p>

                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/' })}
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: '#ffffff',
                        border: '1px solid var(--border-sand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        fontSize: '13.5px',
                        fontWeight: 600,
                        marginBottom: 10,
                    }}
                >
                    <img
                        src={REVCLO_ASSETS.googleIcon}
                        alt="Google"
                        style={{ width: 18, height: 18 }}
                    />
                    <span>Continue with Google</span>
                </button>

                <Link
                    href="/"
                    className="revclo-primary-btn"
                    style={{ width: '100%', fontFamily: 'var(--font-brush)', fontSize: '19px' }}
                >
                    Take me to the sauce
                </Link>
            </div>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                By continuing, you agree to RevClo&apos;s Terms of Use & Privacy Policy.
            </p>
        </div>
    );
}
