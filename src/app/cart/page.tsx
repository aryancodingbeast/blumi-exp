'use client'

import { useCart } from '@/components/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ArrowLeft, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { isDropExpired } from '@/lib/expiry'

export default function CartPage() {
    const { cart, removeFromCart, total } = useCart()
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const checkExpiry = () => {
            setIsExpired(isDropExpired())
        }
        checkExpiry()
        const interval = setInterval(checkExpiry, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="premium-dark-page">
            <div className="page-wrap" style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <div className="cart-head" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '2.5rem',
                    marginBottom: '3.5rem',
                    background: 'transparent',
                    borderRadius: '0px'
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
                        }}>
                            CHECKOUT FLOW_
                        </p>
                        <h1 style={{
                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            color: '#ffffff',
                            lineHeight: 1,
                            margin: 0
                        }}>
                            YOUR SELECTION
                        </h1>
                    </div>
                    <Link href="/shop" style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em'
                    }}>
                        <ArrowLeft size={14} style={{ color: '#d11a1a' }} />
                        <span>RETURN TO SHOP</span>
                    </Link>
                </div>

                {cart.length === 0 ? (
                    <div style={{
                        padding: '10rem 2rem',
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
                        }}>YOUR SELECTION IS CURRENTLY EMPTY</p>
                        <Link href="/shop" style={{
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
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            BROWSE THE VAULT
                        </Link>
                    </div>
                ) : (
                    <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem' }}>
                        {/* List Section */}
                        <div style={{ background: 'transparent', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {cart.map((item) => (
                                <div key={item.id} className="cart-row" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '110px 1fr auto',
                                    gap: '2rem',
                                    background: '#030303',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    padding: '1.5rem',
                                    borderRadius: '0px',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {item.images?.[0] ? (
                                            <Image src={item.images[0]} alt={item.title} fill style={{ objectFit: 'cover', filter: 'none' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            color: '#ffffff',
                                            marginBottom: '0.4rem',
                                            letterSpacing: '0.05em'
                                        }}>{item.title}</h3>
                                        <p style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.68rem',
                                            color: '#d11a1a',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em'
                                        }}>1/1 COLLECTIVE ARCHIVE &bull; SIZE M</p>
                                    </div>
                                    <div className="cart-price-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                                        <p style={{
                                            fontFamily: "var(--font-mono, monospace)",
                                            fontWeight: 700,
                                            fontSize: '1.25rem',
                                            color: '#ffffff'
                                        }}>₹{item.price}</p>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{
                                                background: 'rgba(209, 26, 26, 0.08)',
                                                border: '1px solid rgba(209, 26, 26, 0.2)',
                                                color: '#d11a1a',
                                                padding: '0.5rem 0.8rem',
                                                borderRadius: '0px',
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                fontFamily: "'Inter', sans-serif",
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#d11a1a';
                                                e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(209, 26, 26, 0.08)';
                                                e.currentTarget.style.color = '#d11a1a';
                                            }}
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{
                                background: '#030303',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '3.5rem 2.5rem',
                                borderRadius: '0px',
                                height: 'fit-content'
                            }}>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.68rem',
                                    fontWeight: 900,
                                    color: '#d11a1a',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    marginBottom: '3rem'
                                }}>ORDER TRANSACTION_</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.2rem' }}>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SUBTOTAL_</span>
                                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>₹{total.toFixed(2)}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3.5rem' }}>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SHIPPING_</span>
                                    <span style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: '0.58rem',
                                        fontWeight: 900,
                                        color: '#ffffff',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        padding: '0.25rem 0.6rem',
                                        letterSpacing: '0.08em'
                                    }}>FREE SECURED</span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3.5rem', paddingTop: '2.2rem', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                                    <span style={{ fontFamily: "var(--font-sans, 'Syne', sans-serif)", fontWeight: 900, fontSize: '1.1rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL</span>
                                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, fontSize: '2rem', color: '#d11a1a' }}>₹{total.toFixed(2)}</span>
                                </div>

                                {isExpired ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                                        <div style={{
                                            background: 'rgba(209, 26, 26, 0.08)',
                                            border: '1px solid rgba(209, 26, 26, 0.3)',
                                            padding: '1rem 1.2rem',
                                            textAlign: 'center',
                                            fontFamily: "'Inter', sans-serif",
                                            color: '#d11a1a',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase'
                                        }}>
                                            [SECURE CHECKOUT CLOSED: DROP FINISHED_]
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            background: '#111111',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: 'rgba(255, 255, 255, 0.35)',
                                            padding: '1.2rem 2rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 900,
                                            fontFamily: "'Inter', sans-serif",
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase',
                                            cursor: 'not-allowed',
                                            textAlign: 'center'
                                        }}>
                                            <span>DROP FINISHED</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Link href="/checkout" style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        background: '#d11a1a',
                                        color: '#ffffff',
                                        padding: '1.2rem 2rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 900,
                                        fontFamily: "'Inter', sans-serif",
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        textDecoration: 'none',
                                        boxShadow: '0 6px 20px rgba(209, 26, 26, 0.35)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(209, 26, 26, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(209, 26, 26, 0.35)';
                                    }}
                                    >
                                        <span>SECURE CHECKOUT</span>
                                        <CreditCard size={15} style={{ marginLeft: '0.6rem' }} />
                                    </Link>
                                )}
                            </div>

                            <div style={{ background: '#d11a1a', padding: '1rem 1.5rem', borderRadius: '0px', textAlign: 'center', boxShadow: '0 4px 15px rgba(209, 26, 26, 0.25)' }}>
                                <p style={{ fontWeight: 900, fontSize: '0.62rem', letterSpacing: '0.12em', color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>LIMITED TIME: SECURE SHIPPING AUTO-APPLIED AT ZERO COST</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @media (max-width: 980px) {
                    .cart-layout {
                        grid-template-columns: 1fr !important;
                        gap: 3rem !important;
                    }
                }
            `}</style>
        </div>
    )
}
