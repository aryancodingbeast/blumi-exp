'use client'

import { useState, useEffect, useRef } from 'react'
import { Product } from '@/types'
import { getExchangeableProducts } from '@/actions/products'
import { getSwipeDeck } from '@/actions/swipes'
import ExchangeSelector from '@/components/ExchangeSelector'
import SwipeDeck from '@/components/SwipeDeck'
import { Loader2 } from 'lucide-react'
import gsap from 'gsap'

export default function SwipePage() {
    const [phase, setPhase] = useState<'loading' | 'select' | 'swiping'>('loading')
    const [userProducts, setUserProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [deckProducts, setDeckProducts] = useState<Product[]>([])
    const [deckLoading, setDeckLoading] = useState(false)
    const selectContainerRef = useRef<HTMLDivElement>(null)
    const transitioningRef = useRef(false)

    useEffect(() => {
        document.body.classList.add('checkout-flow-active')
        loadUserProducts()
        return () => document.body.classList.remove('checkout-flow-active')
    }, [])

    const loadUserProducts = async () => {
        try {
            const products = await getExchangeableProducts()
            setUserProducts(products)
            setPhase('select')
        } catch (err) {
            console.error('[SwipePage] Error loading products:', err)
            setPhase('select')
        }
    }

    const handleSelectProduct = async (product: Product) => {
        if (transitioningRef.current) return
        transitioningRef.current = true
        setSelectedProduct(product)

        // Kick off the deck fetch immediately so the exit tween runs in parallel
        const deckPromise = getSwipeDeck(product.id)

        // Animated select → swiping handoff (skipped under reduced motion)
        const container = selectContainerRef.current
        const reduceMotion = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!reduceMotion && container) {
            await new Promise<void>((resolve) => {
                gsap.to(container, {
                    opacity: 0,
                    y: -20,
                    duration: 0.35,
                    ease: 'power2.in',
                    overwrite: 'auto',
                    onComplete: resolve
                })
            })
        }

        setDeckLoading(true)

        try {
            const deck = await deckPromise
            setDeckProducts(deck as Product[])
            setPhase('swiping')
        } catch (err) {
            console.error('[SwipePage] Error loading deck:', err)
            // Restore the selector so the user can try again
            if (container) gsap.set(container, { opacity: 1, y: 0 })
        } finally {
            setDeckLoading(false)
            transitioningRef.current = false
        }
    }

    if (phase === 'loading' || deckLoading) {
        return (
            <div className="swipe-loading">
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-pink)' }} />
                <p className="swipe-loading-text">
                    {deckLoading ? 'LOADING SWIPE DECK…' : 'LOADING YOUR CLOSET…'}
                </p>
            </div>
        )
    }

    if (phase === 'select') {
        return (
            <div ref={selectContainerRef} className="premium-dark-page">
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <ExchangeSelector
                        products={userProducts}
                        onSelect={handleSelectProduct}
                    />
                </div>
            </div>
        )
    }

    if (phase === 'swiping' && selectedProduct) {
        return (
            <div className="swipe-page-container">
                <SwipeDeck
                    initialProducts={deckProducts}
                    offeredProduct={selectedProduct}
                />
            </div>
        )
    }

    return null
}
