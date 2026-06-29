import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session?.user?.id) {
        return (
            <div style={{ padding: '10rem 2rem', textAlign: 'center', background: 'var(--bg-primary)', minHeight: '100vh' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: '2rem' }}>Authentication Required_</h1>
                <p style={{ marginBottom: '2rem', opacity: 0.7 }}>You must be logged in to become a seller.</p>
                <Link href="/login" className="btn-pill btn-pill-filled" style={{ display: 'inline-flex' }}>LOGIN_</Link>
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}
