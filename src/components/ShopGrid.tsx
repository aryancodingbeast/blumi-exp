'use client'

import ProductCard from './ProductCard'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Product } from '@/types'

export default function ShopGrid({ products }: { products: Product[] }) {
    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.product-card-anim',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "power3.out"
                }
            )
        }, container)

        return () => ctx.revert()
    }, [products])

    return (
        <div ref={container} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {products.map((product, index) => (
                <div key={product.id} className="product-card-anim">
                    <ProductCard product={product} index={index} />
                </div>
            ))}
            {products.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '4rem 0', textAlign: 'center' }}>
                    <p style={{ fontStyle: 'italic', opacity: 0.5 }}>The collection is being curated...</p>
                </div>
            )}
        </div>
    )
}
