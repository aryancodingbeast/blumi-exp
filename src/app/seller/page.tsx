import { auth } from '@/lib/auth'
import Link from 'next/link'
import { getSellerProducts } from '@/actions/products'
import { dashboardStore } from '@/lib/dashboardStore'
import type { Product } from '@/types'
import SourcingDashboard from './SourcingDashboard'

export const dynamic = 'force-dynamic'

export default async function SellerHubPage() {
    const session = await auth()

    if (!session?.user?.id) {
        return (
            <div className="sourcing-auth-gate">
                <div className="sourcing-auth-card">
                    <h1>Sign in required</h1>
                    <p>Log in to view your sourcing dashboard and listed items.</p>
                    <Link href="/login?callbackUrl=/seller" className="sourcing-list-btn">
                        Log in
                    </Link>
                </div>
            </div>
        )
    }

    let products: Product[] = []
    try {
        products = await getSellerProducts(session.user.id)
    } catch (e) {
        console.error('[SellerHubPage] Failed to load user listings:', e)
    }

    const demands = dashboardStore.getDemands()
    const revenue = dashboardStore.getRevenue()

    return (
        <SourcingDashboard
            products={products}
            demands={demands}
            revenue={revenue}
            userName={session.user.name || 'Seller'}
        />
    )
}
