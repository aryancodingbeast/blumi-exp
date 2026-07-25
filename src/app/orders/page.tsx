import { auth } from '@/lib/auth'
import { getUserOrders } from '@/actions/orders'
import { getOrderTrackingDetails } from '@/actions/shiprocket'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'

export default async function OrdersPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/orders')
    }

    const email = session.user.email || 'buyer@blumi.com'
    
    // Resolve profile UUID dynamically by email to prevent non-UUID or Google ID mapping failures
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle()
        
    const safeUserId = profile?.id || '8f89e27c-0b8c-4f1e-9a1b-3c4d5e6f7a8b'
    const rawOrders = await getUserOrders(safeUserId)

    const orders = await Promise.all(
        rawOrders.map(async (order) => {
            try {
                const tracking = await getOrderTrackingDetails(order.id, email)
                return {
                    ...order,
                    tracking: tracking.success ? tracking : null
                }
            } catch (e) {
                console.error(`Failed to load tracking details for order ${order.id}:`, e)
                return { ...order, tracking: null }
            }
        })
    )

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '2.5rem',
                    marginBottom: '4.5rem'
                }}>
                    <div>
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: '#d11a1a',
                            marginBottom: '0.6rem'
                        }}>COLLECTION ARCHIVE_</p>
                        <h1 style={{
                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            lineHeight: 1,
                            margin: 0
                        }}>MY CLOSET</h1>
                        <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.85rem',
                            color: 'rgba(255, 255, 255, 0.4)',
                            marginTop: '0.5rem'
                        }}>Your clocked pieces live here.</p>
                    </div>
                    <span style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#d11a1a',
                        border: '1px solid #d11a1a',
                        padding: '0.4rem 1.2rem',
                        borderRadius: '0px',
                        letterSpacing: '0.05em'
                    }}>
                        SECURED DRIP VAULT
                    </span>
                </div>

                {orders.length === 0 ? (
                    <div style={{
                        padding: '8rem 2rem',
                        textAlign: 'center',
                        background: '#020202',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '0px'
                    }}>
                        <p style={{
                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            color: '#ffffff',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            marginBottom: '2rem',
                            opacity: 0.8
                        }}>YOU HAVEN'T CLOCKED ANY PIECES YET</p>
                        <Link href="/shop" className="hover-opacity-80" style={{
                            display: 'inline-block',
                            background: '#ffffff',
                            border: 'none',
                            color: '#000000',
                            padding: '1rem 3rem',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.3s ease'
                        }}>
                            SECURE YOUR FIRST DRIP
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
                        {orders.map((order: any) => {
                            // Streetwear step map
                            const steps = [
                                'Drip secured',
                                'Getting the drip ready',
                                'Drip in transit',
                                'Your fit is pulling up',
                                'Business officially stood on'
                            ]
                            
                            // Determine active step index
                            let activeIndex = 0
                            if (order.tracking) {
                                activeIndex = order.tracking.currentStep
                            } else {
                                if (order.status === 'PLACED') activeIndex = 0
                                else if (order.status === 'SHIPPED') activeIndex = 2
                                else if (order.status === 'DELIVERED') activeIndex = 4
                            }

                            return (
                                <div key={order.id} style={{
                                    background: '#030303',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    padding: '3rem 2.5rem',
                                    borderRadius: '0px'
                                }}>
                                    {/* Order Meta Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        paddingBottom: '2rem',
                                        marginBottom: '3rem',
                                        flexWrap: 'wrap',
                                        gap: '2rem'
                                    }}>
                                        <div>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>DRIP IDENTIFIER_</p>
                                            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>#{order.id.slice(0, 12).toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>PURCHASE DATE_</p>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                                                {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>TRANSACTION TOTAL_</p>
                                            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '1.1rem', fontWeight: 700, color: '#d11a1a' }}>₹{order.total_amount}</p>
                                        </div>
                                        <div>
                                            <span style={{
                                                background: '#d11a1a',
                                                color: '#ffffff',
                                                padding: '0.4rem 1rem',
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                letterSpacing: '0.12em',
                                                textTransform: 'uppercase',
                                                boxShadow: '0 4px 10px rgba(209, 26, 26, 0.4)'
                                            }}>
                                                CLOCKED
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items & Visuals */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem', alignItems: 'start' }} className="orders-grid">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            {order.order_items.map((item: any) => (
                                                <div key={item.id} style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: '#070707', border: '1px solid rgba(255,255,255,0.03)', padding: '1.2rem' }}>
                                                    <div style={{ width: '84px', aspectRatio: '3/4', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                        {item.products?.images?.[0] ? (
                                                            <Image src={item.products.images[0]} alt="" fill style={{ objectFit: 'cover', filter: 'none' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 style={{
                                                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                                            fontSize: '0.95rem',
                                                            fontWeight: 800,
                                                            color: '#ffffff',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            marginBottom: '0.3rem'
                                                        }}>{item.products?.title || 'Secured Drip Item'}</h3>
                                                        <p style={{
                                                            fontFamily: "'Inter', sans-serif",
                                                            fontSize: '0.68rem',
                                                            color: '#d11a1a',
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.08em'
                                                        }}>SIZE M &bull; 1/1 EDITION</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Page 8 Track Order Timeline */}
                                        <div style={{
                                            background: '#070707',
                                            border: '1px solid rgba(255, 255, 255, 0.03)',
                                            padding: '2.5rem 2rem',
                                            borderRadius: '0px'
                                        }}>
                                            <p style={{
                                                fontFamily: "'Inter', sans-serif",
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                color: '#d11a1a',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                marginBottom: '2rem'
                                            }}>TRACK ORDER_</p>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                                                {/* Timeline Line */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '4px',
                                                    top: '8px',
                                                    bottom: '8px',
                                                    width: '1px',
                                                    background: 'rgba(255, 255, 255, 0.08)'
                                                }} />

                                                {steps.map((step, idx) => {
                                                    const isCompleted = idx <= activeIndex
                                                    const isActive = idx === activeIndex

                                                    return (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                                                            {/* Timeline Dot */}
                                                            <div style={{
                                                                position: 'absolute',
                                                                left: '-23px',
                                                                width: '9px',
                                                                height: '9px',
                                                                borderRadius: '50%',
                                                                background: isCompleted ? '#d11a1a' : '#1a1a1a',
                                                                border: isActive ? '3px solid #ffffff' : 'none',
                                                                boxShadow: isActive ? '0 0 15px #d11a1a' : 'none',
                                                                transition: 'all 0.3s ease'
                                                            }} />
                                                            
                                                            <span style={{
                                                                fontFamily: "'Inter', sans-serif",
                                                                fontSize: '0.78rem',
                                                                fontWeight: isCompleted ? 700 : 500,
                                                                color: isCompleted ? (isActive ? '#ffffff' : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.2)',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.08em',
                                                                transition: 'all 0.3s ease'
                                                            }}>
                                                                {step} {isActive && '_'}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {order.tracking && order.tracking.trackingCode && (
                                                <div style={{
                                                    marginTop: '2.5rem',
                                                    paddingTop: '1.5rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.8rem'
                                                }}>
                                                    <div>
                                                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.52rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>AWB TRACKING CODE_</p>
                                                        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                                                            {order.tracking.trackingCode}
                                                            <span style={{ fontSize: '0.52rem', color: '#10b981', marginLeft: '0.6rem', border: '1px solid rgba(16,185,129,0.3)', padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                                                                {order.tracking.isSimulated ? 'Simulated' : 'Live Shiprocket'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.52rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>CURRENT STATUS_</p>
                                                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 800, color: '#d11a1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {order.tracking.statusLabel}
                                                        </p>
                                                    </div>
                                                    {order.tracking.location && (
                                                        <div>
                                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.52rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>LAST SEEN LOCATION_</p>
                                                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                {order.tracking.location}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
