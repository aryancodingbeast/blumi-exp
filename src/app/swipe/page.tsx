'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { getExchangeableProducts } from '@/actions/products'
import { getSwipeDeck } from '@/actions/swipes'
import ExchangeSelector from '@/components/ExchangeSelector'
import SwipeDeck from '@/components/SwipeDeck'
import { Loader2 } from 'lucide-react'

export default function SwipePage() {
    const [phase, setPhase] = useState<'loading' | 'select' | 'swiping'>('loading')
    const [userProducts, setUserProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [deckProducts, setDeckProducts] = useState<Product[]>([])
    const [deckLoading, setDeckLoading] = useState(false)

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
        setSelectedProduct(product)
        setDeckLoading(true)

        try {
            const deck = await getSwipeDeck(product.id)
            setDeckProducts(deck as Product[])
            setPhase('swiping')
        } catch (err) {
            console.error('[SwipePage] Error loading deck:', err)
        } finally {
            setDeckLoading(false)
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
            <div className="premium-dark-page">
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
