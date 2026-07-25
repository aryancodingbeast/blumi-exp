import { auth } from '@/lib/auth'
import Link from 'next/link'
import SellerHubForm from '../SellerHubForm'

export default async function SellerSetupPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return (
            <div className="sourcing-auth-gate">
                <div className="sourcing-auth-card">
                    <h1>Sign in required</h1>
                    <p>Log in to apply for an OG seller account.</p>
                    <Link href="/login?callbackUrl=/seller/setup" className="sourcing-list-btn">
                        Log in
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
