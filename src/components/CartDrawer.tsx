'use client'

import { useCart } from '@/components/CartContext'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Image from 'next/image'
import Link from 'next/link'
import { isDropExpired } from '@/lib/expiry'

export default function CartDrawer() {
    const { cart, removeFromCart, total, isCartOpen, setIsCartOpen } = useCart()
    const drawerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const checkExpiry = () => {
            setIsExpired(isDropExpired())
        }
        checkExpiry()
        const interval = setInterval(checkExpiry, 5000)
        return () => clearInterval(interval)
    }, [])

    useGSAP(() => {
        const overlay = overlayRef.current
        const drawer = drawerRef.current
        if (!overlay || !drawer) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (isCartOpen) {
            document.body.style.overflow = 'hidden'
            if (reduceMotion) {
                gsap.set(overlay, { opacity: 1, pointerEvents: 'auto' })
                gsap.set(drawer, { x: 0 })
                return
            }
            gsap.to(overlay, { opacity: 1, duration: 0.4, pointerEvents: 'auto', overwrite: 'auto' })
            gsap.to(drawer, { x: 0, duration: 0.6, ease: 'power4.out', overwrite: 'auto' })
            // Items cascade in as the drawer settles
            const items = gsap.utils.selector(drawer)('.cart-drawer-item')
            if (items.length > 0) {
                gsap.from(items, {
                    x: 40,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.06,
                    delay: 0.15,
                    ease: 'power3.out',
                    overwrite: 'auto'
                })
            }
        } else {
            document.body.style.overflow = 'unset'
            if (reduceMotion) {
                gsap.set(overlay, { opacity: 0, pointerEvents: 'none' })
                gsap.set(drawer, { x: '100%' })
                return
            }
            gsap.to(overlay, { opacity: 0, duration: 0.4, pointerEvents: 'none', overwrite: 'auto' })
            gsap.to(drawer, { x: '100%', duration: 0.6, ease: 'power4.in', overwrite: 'auto' })
        }
    }, { dependencies: [isCartOpen] })

    return (
        <>
            <div ref={overlayRef} onClick={() => setIsCartOpen(false)} className="streetwear-cart-overlay" />
            <div ref={drawerRef} className="streetwear-cart-drawer">
                <div className="cart-drawer-header">
                    <h2 className="cart-drawer-title">YOUR BAG_</h2>
                    <button onClick={() => setIsCartOpen(false)} className="cart-drawer-close-btn hover-opacity-80">
                        <X size={20} />
                    </button>
                </div>
                <div className="cart-drawer-items">
                    {cart.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', color: 'rgba(255, 255, 255, 0.3)' }}>
                            <ShoppingBag size={40} style={{ color: '#d11a1a' }} />
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>YOUR BAG IS EMPTY_</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cart.map((item) => (
                                <div key={item.id} className="cart-drawer-item">
                                    <Image
                                        src={item.images[0] || 'https://via.placeholder.com/80x80'}
                                        alt={item.title}
                                        width={80}
                                        height={80}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0px', border: '1px solid rgba(255,255,255,0.08)' }}
                                    />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h3 className="cart-drawer-item-title">{item.title}</h3>
                                                <button onClick={() => removeFromCart(item.id)} className="hover-opacity-80" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ffffff' }}>
                                                    <Trash2 size={15} style={{ opacity: 0.6 }} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="cart-drawer-item-price">₹{item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {cart.length > 0 && (
                    <div className="cart-drawer-footer">
                        <div className="cart-drawer-total">
                            <span>TOTAL_</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ffffff' }}>₹{total.toLocaleString()}</span>
                        </div>
                        {isExpired ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.62rem',
                                    color: '#d11a1a',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    margin: 0,
                                    textAlign: 'center'
                                }}>
                                    [DROP TIMELINE SECURED & FINISHED_]
                                </p>
                                <div style={{
                                    width: '100%',
                                    background: '#111111',
                                    border: '1px solid rgba(209, 26, 26, 0.25)',
                                    color: 'rgba(255, 255, 255, 0.35)',
                                    padding: '1.2rem 2rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    fontFamily: "'Inter', sans-serif",
                                    textAlign: 'center',
                                    cursor: 'not-allowed'
                                }}>
                                    DROP FINISHED
                                </div>
                            </div>
                        ) : (
                            <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="cart-drawer-checkout-btn hover-opacity-85">
                                SECURE THE DROP
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}