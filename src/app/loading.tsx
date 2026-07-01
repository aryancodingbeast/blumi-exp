'use client'

import React, { useState, useEffect } from 'react'

export default function Loading() {
    const [logIndex, setLogIndex] = useState(0)

    const loadingLogs = [
        "DECRYPTING_VAULT…",
        "SYNCING_INVENTORY…",
        "SECURING_DROP_001…",
        "VERIFYING_ACCESS…",
        "CONNECTING…"
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setLogIndex((prev) => {
                if (prev < loadingLogs.length - 1) {
                    return prev + 1
                }
                return prev
            })
        }, 300)
        return () => clearInterval(interval)
    }, [])

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--bg-cream, #FAF7F2)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            overflow: 'hidden'
        }}>
            {/* Simple Elegant Streetwear Ring */}
            <div style={{
                position: 'relative',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="streetwear-simple-spinner" />
            </div>

            {/* Technical Status Decrypt Text */}
            <span style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-primary, #2C1810)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                opacity: 0.8
            }}>
                {loadingLogs[logIndex]}
            </span>

            {/* Spin Keyframe Animation */}
            <style jsx global>{`
                @keyframes streetwearSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .streetwear-simple-spinner {
                    width: 32px;
                    height: 32px;
                    border: 2px solid var(--border-sand, #E8DFD8);
                    border-top: 2px solid var(--accent-pink);
                    border-radius: 50%;
                    animation: streetwearSpin 0.8s linear infinite;
                }
            `}</style>
        </div>
    )
}
