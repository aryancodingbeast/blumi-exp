'use client'

import { useState } from 'react'
import { getCampusOrders } from '@/actions/campusOrders'
import { getProducts } from '@/actions/products'
import { Lock, ShieldAlert, ArrowRight, Loader2, Search, Calendar, Phone, Mail, FileText, CheckCircle2, User, Copy, Check } from 'lucide-react'

export default function CampusOrdersPage() {
    const [password, setPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [orders, setOrders] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return

        setLoading(true)
        setError('')

        try {
            const [res, allProducts] = await Promise.all([
                getCampusOrders(password),
                getProducts().catch(err => {
                    console.error('[CampusOrders] Failed to load products reference catalog:', err)
                    return []
                })
            ])
            if (res.success && res.data) {
                setIsAuthenticated(true)
                setOrders(res.data)
                setProducts(allProducts || [])
            } else {
                setError(res.message || 'Passcode rejected. Access denied.')
            }
        } catch (err) {
            setError('System handshake failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Filter orders based on search query (name or phone)
    const filteredOrders = orders.filter(order =>
        (order.name && order.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.phone && order.phone.includes(searchQuery)) ||
        (order.orderId && order.orderId.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    // Calculate total campus distribution volume
    const totalVolume = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                background: 'var(--bg-cream)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'var(--font-sans)'
            }}>
                {/* Soft warm background glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70vw',
                    height: '70vw',
                    maxWidth: '500px',
                    maxHeight: '500px',
                    background: 'radial-gradient(circle, rgba(196,114,74,0.12) 0%, transparent 75%)',
                    filter: 'blur(70px)',
                    zIndex: 0,
                    borderRadius: '50%'
                }} />

                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '3rem 2.5rem',
                    maxWidth: '460px',
                    width: '100%',
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border-sand)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'var(--accent-orange)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        color: 'var(--text-light)',
                        boxShadow: 'var(--shadow-subtle)'
                    }}>
                        <Lock size={24} />
                    </div>

                    <p style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: 'var(--accent-orange)',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        marginBottom: '0.8rem'
                    }}>RESTRICTED ADMIN ARCHIVE_</p>

                    <h1 style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '1.8rem',
                        lineHeight: 1.1,
                        marginBottom: '1.2rem',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                    }}>
                        CAMPUS VAULT LEDGER
                    </h1>

                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        marginBottom: '2.5rem',
                        fontWeight: 500
                    }}>
                        This catalog is password protected. Enter the cryptographic administrative vault code to load campus-vault distribution orders.
                    </p>

                    <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                placeholder="ENTER VAULT ACCESS CODE"
                                style={{
                                    background: '#fff',
                                    border: error ? '1px solid var(--accent-orange)' : '1px solid var(--border-sand)',
                                    color: 'var(--text-primary)',
                                    padding: '1.1rem 1.2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    textAlign: 'center',
                                    letterSpacing: '0.3em',
                                    borderRadius: 'var(--radius-sm)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--accent-orange)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                justifyContent: 'center',
                                border: '1px solid rgba(196, 114, 74, 0.35)',
                                background: 'rgba(196, 114, 74, 0.08)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.75rem 1rem'
                            }}>
                                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                                <span>{error.toUpperCase()}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            style={{
                                width: '100%',
                                background: 'var(--text-primary)',
                                color: 'var(--text-light)',
                                border: 'none',
                                padding: '1.1rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                cursor: (loading || !password) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'all 0.3s ease',
                                opacity: !password ? 0.55 : 1
                            }}
                            onMouseEnter={e => { if (password && !loading) e.currentTarget.style.background = 'var(--accent-orange)'; e.currentTarget.style.color = 'var(--text-light)' }}
                            onMouseLeave={e => { if (password && !loading) e.currentTarget.style.background = 'var(--text-primary)'; e.currentTarget.style.color = 'var(--text-light)' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>UNSEALING LEDGER...</span>
                                </>
                            ) : (
                                <>
                                    <span>AUTHENTICATE ACCESSS</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-cream)',
            color: 'var(--text-primary)',
            padding: '8rem 2rem 4rem',
            fontFamily: 'var(--font-sans)'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{
                    borderBottom: '1px solid var(--border-sand)',
                    paddingBottom: '2.5rem',
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div>
                        <p style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: 'var(--accent-orange)',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            marginBottom: '0.6rem'
                        }}>SECURED SYSTEM HUB_</p>
                        <h1 style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            lineHeight: 1,
                            margin: 0,
                            letterSpacing: '0.01em'
                        }}>CAMPUS ORDERS LEDGER</h1>
                    </div>

                    <button
                        onClick={() => setIsAuthenticated(false)}
                        style={{
                            background: 'var(--bg-white)',
                            border: '1px solid var(--border-black)',
                            color: 'var(--text-primary)',
                            padding: '0.7rem 1.4rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-orange)'; e.currentTarget.style.color = 'var(--accent-orange)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-black)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    >
                        LOCK VAULT
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '3rem'
                }}>
                    <div style={{
                        background: 'var(--bg-white)',
                        border: '1px solid var(--border-sand)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-subtle)',
                        padding: '2rem 1.8rem'
                    }}>
                        <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>TOTAL CAMPUS ORDERS_</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{filteredOrders.length}</p>
                    </div>
                    <div style={{
                        background: 'var(--bg-white)',
                        border: '1px solid var(--border-sand)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-subtle)',
                        padding: '2rem 1.8rem'
                    }}>
                        <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>ACCUMULATED CAMPUS VOLUME_</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-orange)', margin: 0, lineHeight: 1 }}>₹{totalVolume.toFixed(2)}</p>
                    </div>
                </div>

                {/* Search / Filter Utility */}
                <div style={{
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border-sand)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-subtle)',
                    padding: '1.5rem 1.8rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <Search size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="FILTER BY BUYER NAME, PHONE NUMBER, OR ORDER ID..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                            width: '100%',
                            textTransform: 'uppercase'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-orange)',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                            }}
                        >
                            CLEAR_
                        </button>
                    )}
                </div>

                {/* Orders List Table */}
                <div style={{
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border-sand)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-subtle)',
                    overflowX: 'auto'
                }}>
                    {filteredOrders.length === 0 ? (
                        <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                            <ShieldAlert size={40} style={{ color: 'var(--accent-orange)', marginBottom: '1.5rem' }} />
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>VAULT ARCHIVE EMPTY_</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
                                No campus order matches found in the ledger. Secure campus orders will register automatically.
                            </p>
                        </div>
                    ) : (
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            textAlign: 'left',
                            fontSize: '0.8rem'
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '1px solid var(--border-sand)',
                                    color: 'var(--text-secondary)',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase'
                                }}>
                                    <th style={{ padding: '1.5rem 1.8rem' }}>BUYER_</th>
                                    <th style={{ padding: '1.5rem 1.8rem' }}>CONTACT_</th>
                                    <th style={{ padding: '1.5rem 1.8rem' }}>ORDER ID_</th>
                                    <th style={{ padding: '1.5rem 1.8rem' }}>ITEMS_</th>
                                    <th style={{ padding: '1.5rem 1.8rem', textAlign: 'right' }}>VOLUME_</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} style={{
                                        borderBottom: '1px solid var(--border-sand)',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-cream)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Buyer Name & Email */}
                                        <td style={{ padding: '1.5rem 1.8rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    background: 'var(--bg-cream)',
                                                    border: '1px solid var(--border-sand)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>{order.name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Mail size={10} /> {order.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact Phone */}
                                        <td style={{ padding: '1.5rem 1.8rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.45rem'
                                            }}>
                                                <Phone size={11} style={{ color: 'var(--accent-orange)' }} />
                                                {order.phone}
                                            </span>
                                        </td>

                                        {/* Order ID */}
                                        <td style={{ padding: '1.5rem 1.8rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.72rem',
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: 600
                                                }}>
                                                    {order.orderId ? `${order.orderId.substring(0, 12)}...` : 'N/A'}
                                                </span>
                                                {order.orderId && (
                                                    <button
                                                        onClick={() => handleCopy(order.orderId)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: copiedId === order.orderId ? 'var(--accent-teal)' : 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            padding: '0.2rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            transition: 'color 0.2s ease'
                                                        }}
                                                    >
                                                        {copiedId === order.orderId ? <Check size={11} /> : <Copy size={11} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Items */}
                                        <td style={{ padding: '1.5rem 1.8rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                {order.items && order.items.length > 0 ? (
                                                    order.items.map((item: any, idx: number) => {
                                                        const matchedProduct = products.find(p => p.id === item.productId)
                                                        return (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                                <span style={{
                                                                    background: 'var(--bg-cream)',
                                                                    border: '1px solid var(--border-sand)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    color: 'var(--text-primary)',
                                                                    padding: '0.25rem 0.6rem',
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 700,
                                                                    fontFamily: 'var(--font-mono)',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.02em',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {matchedProduct ? matchedProduct.title.toUpperCase() : `ID: ${item.productId.slice(0, 6).toUpperCase()}`}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.68rem',
                                                                    color: 'var(--accent-orange)',
                                                                    fontFamily: 'var(--font-mono)',
                                                                    fontWeight: 700
                                                                }}>
                                                                    ₹{item.price}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Price / Volume */}
                                        <td style={{ padding: '1.5rem 1.8rem', textAlign: 'right' }}>
                                            <span style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 700,
                                                fontSize: '0.88rem',
                                                color: 'var(--accent-orange)'
                                            }}>
                                                ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
