'use client'

import ProductCard from './ProductCard'
import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Product } from '@/types'

if (typeof window !== 'undefined' && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)
}

export default function ShopGrid({ products }: { products: Product[] }) {
    const container = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const root = container.current
        if (!root) return

        const q = gsap.utils.selector(root)
        const cards = q('.product-card-anim')
        if (cards.length === 0) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) {
            // No motion: ensure the grid rests fully visible
            gsap.set(cards, { opacity: 1, y: 0 })
            return
        }

        // Batched scroll reveals — cards rise in as they enter the viewport
        gsap.set(cards, { opacity: 0, y: 30 })
        ScrollTrigger.batch(cards, {
            start: 'top 88%',
            once: true,
            onEnter: (elements) => {
                gsap.to(elements, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    overwrite: true
                })
            }
        })
    }, { scope: container, dependencies: [products] })

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
