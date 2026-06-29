'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '@/types'

interface CartItem extends Product {
    quantity: number
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (product: Product) => void
    removeFromCart: (productId: string) => void
    clearCart: () => void
    total: number
    isCartOpen: boolean
    setIsCartOpen: (isOpen: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)

    useEffect(() => {
        const savedCart = localStorage.getItem('revclo-cart')
        if (savedCart) setCart(JSON.parse(savedCart))
    }, [])

    useEffect(() => {
        localStorage.setItem('revclo-cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) return prev
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const clearCart = () => setCart([])

    const total = cart.reduce((sum, item) => sum + item.price, 0)

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, isCartOpen, setIsCartOpen }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within a CartProvider')
    return context
}
