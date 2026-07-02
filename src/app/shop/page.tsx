import { getProducts } from '@/actions/products'
import ShopController from '@/components/ShopController'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Product } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
    let products: Product[] = []
    try {
        products = await getProducts()
    } catch (e) {
        console.error('[ShopPage] Failed to fetch products:', e)
    }
    const session = await auth()
    const email = session?.user?.email

    let isOnWaitlist = false
    let waitlistName = ''
    let waitlistNumber = 0
    if (email) {
        try {
            const { data } = await supabaseAdmin
                .from('waitlist')
                .select('email, name, waitlist_number')
                .ilike('email', email.trim())
                .maybeSingle()
            if (data) {
                isOnWaitlist = true
                waitlistName = data.name || ''
                waitlistNumber = data.waitlist_number || 0
            }
        } catch (e) {
            console.error('Failed to verify waitlist status from DB:', e)
        }
    }

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid var(--border-sand)',
                    paddingBottom: '2.5rem',
                    marginBottom: '3.5rem'
                }}>
                    <div>
                        <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'var(--accent-orange)',
                            marginBottom: '0.6rem'
                        }}>
                            DISCOVERY_
                        </p>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--text-primary)',
                            lineHeight: 1,
                            margin: 0
                        }}>
                            THE VAULT
                        </h1>
                    </div>
                    <span style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-sand)',
                        padding: '0.4rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        letterSpacing: '0.05em'
                    }}>
                        {products.length} SELECTED ARTIFACTS
                    </span>
                </div>

                <ShopController 
                    products={products} 
                    initialEmail={email} 
                    initialOnWaitlist={isOnWaitlist} 
                    waitlistName={waitlistName}
                    waitlistNumber={waitlistNumber}
                />
            </div>
        </div>
    )
}
