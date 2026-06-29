'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface ProductImageGalleryProps {
    images: string[]
    title: string
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const defaultImage = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1000'
    const [activeImage, setActiveImage] = useState(images?.[1] || images?.[0] || defaultImage)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Main Editorial Window */}
            <div className="detail-image-container" style={{
                aspectRatio: '3/4',
                position: 'relative',
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <Image
                    src={activeImage}
                    alt={title}
                    fill
                    priority
                    style={{
                        objectFit: 'cover',
                        filter: 'none',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                />
                {/* Badges on image */}
                <div style={{
                    position: 'absolute',
                    top: '1.2rem',
                    left: '1.2rem',
                    background: '#d11a1a',
                    color: '#ffffff',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    zIndex: 10
                }}>
                    1/1 PIECE LEFT
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '1.2rem',
                    left: '1.2rem',
                    background: 'rgba(0, 0, 0, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)'
                }}>
                    FREEBIES INCLUDED
                </div>
            </div>

            {/* Thumbnail and callout grid row */}
            <div style={{ display: 'grid', gridTemplateColumns: images?.[1] ? '1fr 1fr 1.2fr' : '1fr 1.2fr', gap: '1.5rem' }}>
                {/* Main Image Thumbnail */}
                <div 
                    onClick={() => setActiveImage(images?.[1] || images?.[0] || defaultImage)}
                    style={{ 
                        aspectRatio: '1/1', 
                        position: 'relative', 
                        border: activeImage === (images?.[1] || images?.[0] || defaultImage) ? '2px solid #d11a1a' : '1px solid rgba(255, 255, 255, 0.08)', 
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Image
                        src={images?.[1] || images?.[0] || defaultImage}
                        alt="Primary Look"
                        fill
                        style={{
                            objectFit: 'cover',
                            filter: 'none',
                            opacity: activeImage === (images?.[1] || images?.[0] || defaultImage) ? 1 : 0.45,
                            transition: 'opacity 0.3s ease'
                        }}
                    />
                </div>

                {/* Secondary Image Thumbnail */}
                {images?.[1] && (
                    <div 
                        onClick={() => setActiveImage(images[0])}
                        style={{ 
                            aspectRatio: '1/1', 
                            position: 'relative', 
                            border: activeImage === images[0] ? '2px solid #d11a1a' : '1px solid rgba(255, 255, 255, 0.08)', 
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Image
                            src={images[0]}
                            alt="Secondary Look"
                            fill
                            style={{
                                objectFit: 'cover',
                                filter: 'none',
                                opacity: activeImage === images[0] ? 1 : 0.45,
                                transition: 'opacity 0.3s ease'
                            }}
                        />
                    </div>
                )}

                {/* Material Focus Callout */}
                <div style={{
                    aspectRatio: images?.[1] ? 'auto' : '1/1',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#050505',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.2rem',
                    textAlign: 'center'
                }}>
                    <div>
                        <p className="label-caps" style={{ fontSize: '0.52rem', color: '#d11a1a', letterSpacing: '0.12em', marginBottom: '0.4rem', fontWeight: 900 }}>MATERIAL FOCUS_</p>
                        <p style={{
                            fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            lineHeight: 1.3,
                            margin: 0
                        }}>
                            SUSTAINABLE ORGANIC COTTON BLEND
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
