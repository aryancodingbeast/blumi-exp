'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/components/CartContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { isDropExpired } from '@/lib/expiry'

export default function AddToCartButton({ product }: { product: any }) {
    const { addToCart, cart, setIsCartOpen } = useCart()
    const isInCart = cart.some(item => item.id === product.id)
    const router = useRouter()

    const [productStatus, setProductStatus] = useState(product.status)

    // Dynamic 1-hour countdown timer logic
    const [timeLeft, setTimeLeft] = useState('')
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const calculateTimeLeft = () => {
            setIsExpired(isDropExpired())
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 5000)
        return () => clearInterval(interval)
    }, [])

    // Supabase Realtime details subscription
    useEffect(() => {
        console.log(`[AddToCartButton] Subscribing to realtime updates for product ${product.id}...`)
        const channel = supabase
            .channel(`product-details-realtime-${product.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${product.id}` },
                (payload: any) => {
                    console.log(`[AddToCartButton] Realtime product update received:`, payload.new)
                    setProductStatus(payload.new.status)
                    // Trigger a router refresh to seamlessly fetch server-rendered status badges on the details page
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            console.log(`[AddToCartButton] Cleaning up details subscription for ${product.id}.`)
            supabase.removeChannel(channel)
        }
    }, [product.id, router])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {productStatus?.toUpperCase() !== 'SOLD' && (
                <div style={{
                    background: isExpired ? 'rgba(209, 26, 26, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                    border: isExpired ? '1px solid rgba(209, 26, 26, 0.15)' : '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '1rem 1.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                }}>
                    <span style={{ color: isExpired ? 'rgba(209, 26, 26, 0.55)' : 'rgba(255,255,255,0.45)', fontWeight: 800 }}>
                        [SYSTEM COLLECTION_]
                    </span>
                    <span style={{ color: isExpired ? '#d11a1a' : '#ffffff', fontWeight: 900 }}>
                        {isExpired ? 'DROP FINISHED' : 'UNLIMITED AVAILABLE'}
                    </span>
                </div>
            )}
 
             <button
                 disabled={isInCart || productStatus?.toUpperCase() === 'SOLD' || isExpired}
                 onClick={() => {
                     addToCart(product)
                     setIsCartOpen(true)
                 }}
                 className="clock-it-btn"
                 style={{
                     width: '100%',
                     background: (productStatus?.toUpperCase() === 'SOLD' || isExpired) ? '#111111' : isInCart ? '#0a0a0a' : '#d11a1a',
                     border: (productStatus?.toUpperCase() === 'SOLD' || isExpired) ? '1px solid rgba(255,255,255,0.08)' : isInCart ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                     color: (productStatus?.toUpperCase() === 'SOLD' || isExpired) ? 'rgba(255,255,255,0.3)' : '#ffffff',
                     padding: '1.2rem 2rem',
                     fontSize: '0.85rem',
                     fontWeight: 900,
                     letterSpacing: '0.15em',
                     textTransform: 'uppercase',
                     fontFamily: "'Inter', sans-serif",
                     cursor: (isInCart || productStatus?.toUpperCase() === 'SOLD' || isExpired) ? 'not-allowed' : 'pointer',
                     borderRadius: '0px',
                     transition: 'all 0.3s ease',
                     boxShadow: (isInCart || productStatus?.toUpperCase() === 'SOLD' || isExpired) ? 'none' : '0 6px 20px rgba(209, 26, 26, 0.35)'
                 }}
                 onMouseEnter={(e) => {
                     if (!isInCart && productStatus?.toUpperCase() !== 'SOLD' && !isExpired) {
                         e.currentTarget.style.transform = 'translateY(-2px)';
                         e.currentTarget.style.boxShadow = '0 10px 25px rgba(209, 26, 26, 0.5)';
                     }
                 }}
                 onMouseLeave={(e) => {
                     if (!isInCart && productStatus?.toUpperCase() !== 'SOLD' && !isExpired) {
                         e.currentTarget.style.transform = 'translateY(0)';
                         e.currentTarget.style.boxShadow = '0 6px 20px rgba(209, 26, 26, 0.35)';
                     }
                 }}
             >
                 <span>{productStatus?.toUpperCase() === 'SOLD' ? 'SOLD OUT' : isExpired ? 'DROP FINISHED' : isInCart ? 'ITEM CLOCKED' : 'CLOCK IT'}</span>
             </button>
        </div>
    )
}
