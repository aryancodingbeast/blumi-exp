import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { loginWithGoogle } from '@/actions/auth'
import { Sparkle, ArrowRight } from 'lucide-react'

interface PageProps {
    searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function LoginPage({ searchParams }: PageProps) {
    const session = await auth()
    if (session) redirect('/')

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            background: 'var(--bg-cream)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background soft warm glows */}
            <div style={{
                position: 'absolute',
                top: '-15%',
                left: '-15%',
                width: '70vw',
                height: '70vw',
                maxWidth: '600px',
                maxHeight: '600px',
                background: 'radial-gradient(circle, rgba(196,114,74,0.12) 0%, transparent 70%)',
                filter: 'blur(80px)',
                opacity: 0.7,
                borderRadius: '50%',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-15%',
                right: '-15%',
                width: '70vw',
                height: '70vw',
                maxWidth: '600px',
                maxHeight: '600px',
                background: 'radial-gradient(circle, rgba(196,114,74,0.12) 0%, transparent 70%)',
                filter: 'blur(80px)',
                opacity: 0.5,
                borderRadius: '50%',
                zIndex: 0
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                padding: 'clamp(2.5rem, 5vw, 4.5rem)',
                textAlign: 'center',
                maxWidth: '460px',
                width: '100%',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-sand)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 'var(--radius-md)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2.5rem',
                    color: 'var(--text-light)',
                    boxShadow: 'var(--shadow-subtle)'
                }}>
                    {/* Stylized logo box */}
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.05em' }}>R</span>
                </div>

                <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: 'var(--accent-orange)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: '1rem'
                }}>SECURE AUTHENTICATION_</p>

                <h1 style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                    lineHeight: 1.05,
                    marginBottom: '1.5rem',
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase'
                }}>
                    WELCOME BACK_
                </h1>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    marginBottom: searchParams?.error ? '2rem' : '3.5rem',
                    padding: '0 0.5rem',
                    fontWeight: 500
                }}>
                    Sign in with Google to unlock secure checkout and access your collection.
                </p>

                {searchParams?.error && (
                    <div style={{
                        width: '100%',
                        background: 'rgba(196, 114, 74, 0.08)',
                        border: '1px solid var(--accent-orange)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.2rem',
                        marginBottom: '2.5rem',
                        textAlign: 'left',
                    }}>
                        <p style={{
                            color: 'var(--accent-orange)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: '0.4rem',
                            fontFamily: 'var(--font-sans)'
                        }}>
                            AUTHENTICATION ERROR_
                        </p>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            fontWeight: 500,
                            margin: 0,
                            fontFamily: 'var(--font-sans)'
                        }}>
                            An error occurred during authentication. Please try again with a valid Google account.
                        </p>
                    </div>
                )}

                <form action={loginWithGoogle} style={{ width: '100%' }}>
                    <button type="submit" className="hover-opacity-85" style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1.2rem 1.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-sans)',
                        background: 'var(--text-primary)',
                        color: 'var(--text-light)',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        transition: 'all 0.3s ease'
                    }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                        <ArrowRight size={15} style={{ opacity: 0.6 }} />
                    </button>
                </form>

                <p style={{ marginTop: '2.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    By continuing, you verify your agreement to Revclo's <br/>
                    <a href="#" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a> & <a href="#" style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
