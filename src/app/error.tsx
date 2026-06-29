'use client'

import { useEffect } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    if (isRedirectError(error)) {
        throw error
    }

    useEffect(() => {
        console.error(error)
    }, [error])

    const isSupabaseError = error.message.includes('Supabase') || error.message.includes('unreachable')

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-primary, #fff)',
            color: 'var(--text-primary, #000)'
        }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1rem' }}>
                {isSupabaseError ? 'Database Connection Issue' : 'Something went wrong'}
            </h2>
            <p style={{
                maxWidth: '600px',
                marginBottom: '2rem',
                fontSize: '1.1rem',
                lineHeight: '1.6',
                opacity: 0.8
            }}>
                {error.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '1rem 2rem',
                        background: 'var(--bg-accent, #000)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md, 4px)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Try again
                </button>
                {isSupabaseError && (
                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '1rem 2rem',
                            background: 'white',
                            color: 'black',
                            border: '1px solid black',
                            borderRadius: 'var(--radius-md, 4px)',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        Supabase Dashboard
                    </a>
                )}
            </div>
        </div>
    )
}
