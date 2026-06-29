'use client'

import { useCart } from '@/components/CartContext'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function HeaderCart() {
    const { cart, setIsCartOpen } = useCart()
    const count = cart.length
    const btnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!btnRef.current) return
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' })
    }, [])

    return (
        <button
            ref={btnRef}
            onClick={() => setIsCartOpen(true)}
            className="nav-anchor-btn"
            style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0',
                transition: 'opacity 0.3s ease'
            }}
            aria-label="Open cart"
        >
            BAG ({count})
        </button>
    )
}
