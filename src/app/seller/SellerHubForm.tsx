'use client'

import { applyAsOgSeller } from '@/actions/sellers'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, CheckCircle2, Loader2, ArrowRight, Mail, User } from 'lucide-react'

interface SellerHubFormProps {
    initialName: string
    initialEmail: string
}

export default function SellerHubForm({ initialName, initialEmail }: SellerHubFormProps) {
    const router = useRouter()
    const [name, setName] = useState(initialName)
    const [email, setEmail] = useState(initialEmail)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const cleanName = name.trim()
        const cleanEmail = email.trim().toLowerCase()

        if (!cleanName || !cleanEmail) {
            setError('Please fill in all fields.')
            return
        }

        if (!cleanEmail.endsWith('@igdtuw.ac.in')) {
            setError('Verification failed: Only IGDTUW student emails (@igdtuw.ac.in) are eligible.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await applyAsOgSeller({
                name: cleanName,
                email: cleanEmail
            })

            if (res.success) {
                setSuccess(true)
            } else {
                setError(res.message || 'Failed to submit application.')
            }
        } catch (err) {
            setError('Failed to connect to verification servers.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ 
            padding: '10rem 1.5rem 4rem', 
            minHeight: '100vh', 
            background: '#020202',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Ambient Red Glow Background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70vw',
                height: '70vw',
                maxWidth: '500px',
                maxHeight: '500px',
                background: 'radial-gradient(circle, rgba(209,26,26,0.08) 0%, transparent 75%)',
                filter: 'blur(60px)',
                zIndex: 0,
                borderRadius: '50%'
            }} />

            <div style={{ 
                maxWidth: '500px', 
                width: '100%',
                background: '#040404',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
            }}>
                {/* Form Header Banner */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #d11a1a, #5a0c0c)',
                    padding: '3rem 2.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                        zIndex: 1
                    }} />
                    <Sparkles size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05, color: 'white', zIndex: 0 }} />
                    
                    <p style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: 900, 
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        marginBottom: '0.6rem',
                        position: 'relative',
                        zIndex: 2
                    }}>SELLER HUB_</p>
                    
                    <h1 style={{ 
                        fontFamily: "var(--font-sans, 'Syne', sans-serif)", 
                        fontWeight: 900, 
                        fontSize: '2rem', 
                        lineHeight: 1.1, 
                        color: 'white', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.02em',
                        margin: 0,
                        position: 'relative',
                        zIndex: 2
                    }}>
                        BECOME AN OG SELLER
                    </h1>
                </div>

                {/* Form Content / Success view */}
                <div style={{ padding: '2.5rem 2.5rem 3rem' }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(209, 26, 26, 0.08)',
                                color: '#d11a1a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem',
                                border: '1px solid rgba(209, 26, 26, 0.2)'
                            }}>
                                <CheckCircle2 size={36} />
                            </div>
                            
                            <h2 style={{ 
                                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                fontSize: '1.4rem', 
                                fontWeight: 900, 
                                marginBottom: '1rem', 
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: '#d11a1a'
                            }}>
                                WE WILL GET BACK TO YOU SOON_
                            </h2>
                            
                            <p style={{ 
                                fontSize: '0.82rem', 
                                lineHeight: 1.7, 
                                opacity: 0.5, 
                                marginBottom: '2.5rem',
                                fontWeight: 500,
                                color: 'white'
                            }}>
                                Your application has been securely queued. Curators review campus requests in waves. We will check your student credentials and send access instructions to your email once approved.
                            </p>
                            
                            <button
                                type="button"
                                onClick={() => router.push('/shop')}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    color: '#000000',
                                    border: 'none',
                                    padding: '1.1rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#d11a1a'; e.currentTarget.style.color = '#ffffff' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#000000' }}
                            >
                                RETURN TO VAULT
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                            <p style={{ 
                                fontSize: '0.85rem', 
                                lineHeight: 1.6, 
                                color: 'rgba(255,255,255,0.45)',
                                margin: 0,
                                fontWeight: 500
                            }}>
                                Want to host drop campaigns and list your closet pieces? Fill in your name and student email below. Access keys will be allocated once verified.
                            </p>

                            {/* Name Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ 
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.62rem', 
                                    fontWeight: 900,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase'
                                }}>
                                    FULL NAME_
                                </label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <User size={16} style={{ position: 'absolute', left: '1.2rem', color: 'rgba(255,255,255,0.2)' }} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Aryan Singh"
                                        style={{
                                            width: '100%',
                                            background: '#0a0a0a',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#ffffff',
                                            padding: '1.1rem 1.2rem 1.1rem 3rem',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Inter', sans-serif",
                                            fontWeight: 600,
                                            borderRadius: '0px'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Email Input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ 
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.62rem', 
                                    fontWeight: 900,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase'
                                }}>
                                    IGDTUW STUDENT EMAIL_
                                </label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '1.2rem', color: 'rgba(255,255,255,0.2)' }} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError('') }}
                                        placeholder="name@igdtuw.ac.in"
                                        style={{
                                            width: '100%',
                                            background: '#0a0a0a',
                                            border: error ? '1px solid #d11a1a' : '1px solid rgba(255,255,255,0.08)',
                                            color: '#ffffff',
                                            padding: '1.1rem 1.2rem 1.1rem 3rem',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Inter', sans-serif",
                                            fontWeight: 600,
                                            borderRadius: '0px'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: "var(--font-mono, monospace)" }}>
                                    * Enforces strict IGDTUW student email suffix check
                                </span>
                            </div>

                            {error && (
                                <p style={{ 
                                    color: '#d11a1a', 
                                    fontSize: '0.72rem', 
                                    fontWeight: 800, 
                                    margin: 0,
                                    letterSpacing: '0.02em',
                                    textTransform: 'uppercase',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    background: '#ffffff',
                                    color: '#000000',
                                    border: 'none',
                                    padding: '1.2rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.6rem',
                                    transition: 'all 0.3s ease',
                                    marginTop: '0.5rem'
                                }}
                                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#d11a1a'; e.currentTarget.style.color = '#ffffff' } }}
                                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#000000' } }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>SUBMITTING QUEUE APPLICATION...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>SUBMIT SELLER REQUEST</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
