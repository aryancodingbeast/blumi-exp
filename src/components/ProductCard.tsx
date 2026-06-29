'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'
import { isDropExpired } from '@/lib/expiry'

export default function ProductCard({ product, index = 0 }: { product: Product, index?: number }) {
    const [isExpired, setIsExpired] = React.useState(false)

    React.useEffect(() => {
        const checkExpiry = () => {
            setIsExpired(isDropExpired())
        }
        checkExpiry()
        const interval = setInterval(checkExpiry, 5000)
        return () => clearInterval(interval)
    }, [])

    const extractSize = (desc: string | null) => {
        if (!desc) return 'M'
        const match = desc.match(/\b(XS|S|M|L|XL|XXL)\b/i)
        return match ? match[1].toUpperCase() : 'M'
    }

    return (
        <Link
            href={`/product/${product.id}`}
            prefetch={false}
            className="product-card-streetwear"
            style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative'
            }}
        >
            <div className="product-card-image" style={{
                aspectRatio: '3/4',
                position: 'relative',
                marginBottom: '0.6rem',
                borderRadius: '0px', // Sharp streetwear edges
                overflow: 'hidden',
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {product.images?.[0] ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {/* Primary Image */}
                        <Image
                            src={product.images[1] || product.images[0]}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="product-image-streetwear primary-img"
                            quality={75}
                            style={{
                                objectFit: 'cover',
                                filter: 'none',
                            }}
                        />
                        {/* Secondary Image (Hover Details) */}
                        {product.images[1] && (
                            <Image
                                src={product.images[0]}
                                alt={`${product.title} Alternate`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="product-image-streetwear-hover secondary-img"
                                quality={75}
                                style={{
                                    objectFit: 'cover',
                                    filter: 'none',
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                        <span style={{ opacity: 0.2, fontSize: '0.72rem', color: '#888' }}>NO VISUAL</span>
                    </div>
                )}

                {/* 1/1 Piece Left Badge */}
                <div style={{
                    position: 'absolute',
                    top: '0.8rem',
                    left: '0.8rem',
                    background: '#d11a1a',
                    color: '#ffffff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0px',
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    zIndex: 2,
                    boxShadow: '0 4px 10px rgba(209, 26, 26, 0.4)'
                }}>
                    1/1 PIECE LEFT
                </div>

                {/* Freebies Included Badge */}
                <div style={{
                    position: 'absolute',
                    bottom: '0.8rem',
                    left: '0.8rem',
                    background: 'rgba(0, 0, 0, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0px',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    zIndex: 2,
                    backdropFilter: 'blur(4px)'
                }}>
                    FREEBIES INCLUDED
                </div>

                {/* Sold Out / Expired Overlay */}
                {(product.status?.toUpperCase() === 'SOLD' || isExpired) && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3
                    }}>
                        <span style={{
                            border: '2px solid #d11a1a',
                            color: '#d11a1a',
                            padding: '0.5rem 1.2rem',
                            fontWeight: 900,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            transform: 'rotate(-8deg)'
                        }}>
                            {product.status?.toUpperCase() === 'SOLD' ? 'SOLD OUT' : 'DROP FINISHED'}
                        </span>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{
                        fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#ffffff',
                        lineHeight: 1.2
                    }}>
                        {product.title}
                    </h3>
                    <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.68rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        marginTop: '0.2rem'
                    }}>
                        SIZE {extractSize(product.description)} &bull; 1/1 EXCLUSIVE
                    </p>
                </div>
                <p style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--accent-red, #d11a1a)'
                }}>
                    ₹{product.price}
                </p>
            </div>

            <style jsx>{`
                .product-card-streetwear {
                    position: relative;
                    transition: opacity 0.3s ease;
                }

                .product-card-streetwear:hover {
                    opacity: 0.95;
                }

                .product-card-streetwear :global(.primary-img) {
                    opacity: 1;
                    z-index: 2;
                    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
                }

                .product-card-streetwear :global(.secondary-img) {
                    opacity: 0;
                    z-index: 1;
                    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
                }

                @media (hover: hover) {
                    .product-card-streetwear:hover :global(.primary-img) {
                        opacity: 0;
                        z-index: 1;
                        transform: scale(1.05);
                    }
                    .product-card-streetwear:hover :global(.secondary-img) {
                        opacity: 1;
                        z-index: 2;
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </Link>
    )
}
