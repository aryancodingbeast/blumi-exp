import { auth } from '@/lib/auth'
import Link from 'next/link'
import SellerHubForm from './SellerHubForm'

export default async function SellerHubPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return (
            <div style={{ 
                padding: '10rem 2rem', 
                textAlign: 'center', 
                background: '#020202', 
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '100%',
                    padding: '3rem 2rem',
                    background: '#040404',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.9)'
                }}>
                    <h1 style={{ 
                        fontFamily: "var(--font-sans, 'Syne', sans-serif)", 
                        fontWeight: 900, 
                        fontSize: '2rem', 
                        marginBottom: '1rem', 
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Authentication Required_
                    </h1>
                    <p style={{ 
                        marginBottom: '2.5rem', 
                        opacity: 0.5, 
                        color: 'white',
                        fontSize: '0.88rem',
                        lineHeight: 1.6
                    }}>
                        You must be logged in with your student account to apply for a seller account in the Blumi network.
                    </p>
                    <Link href="/login" className="btn-pill btn-pill-filled" style={{ display: 'inline-flex', padding: '1.1rem 3rem' }}>
                        LOGIN_
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <SellerHubForm 
            initialName={session.user.name || ''} 
            initialEmail={session.user.email || ''} 
        />
    )
}
