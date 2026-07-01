'use client'

import { Product } from '@/types'
import Image from 'next/image'
import { Check, Repeat2 } from 'lucide-react'

interface ClosetItemCardProps {
    product: Product
    isSelected?: boolean
    onSelect?: (product: Product) => void
    selectable?: boolean
}

export default function ClosetItemCard({ product, isSelected, onSelect, selectable = false }: ClosetItemCardProps) {
    const primaryImage = product.images?.[0] || '/collage-1.webp'
    const isExchanged = product.status === 'EXCHANGED'

    return (
        <div
            className={`closet-card ${isSelected ? 'closet-card-selected' : ''} ${selectable ? 'closet-card-selectable' : ''} ${isExchanged ? 'closet-card-exchanged' : ''}`}
            onClick={() => selectable && onSelect?.(product)}
        >
            {/* Selection Indicator */}
            {selectable && (
                <div className={`closet-card-check ${isSelected ? 'closet-card-check-active' : ''}`}>
                    <Check size={14} />
                </div>
            )}

            {/* Status Badge */}
            {isExchanged && (
                <div className="closet-card-badge closet-card-badge-exchanged">
                    <Repeat2 size={12} />
                    <span>EXCHANGED</span>
                </div>
            )}

            {/* Image */}
            <div className="closet-card-image">
                <Image
                    src={primaryImage}
                    alt={product.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 250px"
                />
                <div className="closet-card-image-count">
                    {product.images?.length || 0} photos
                </div>
            </div>

            {/* Info */}
            <div className="closet-card-info">
                <h3 className="closet-card-title">{product.title}</h3>
                <div className="closet-card-meta">
                    <span>{product.size || 'Free Size'}</span>
                    <span className="closet-card-dot">·</span>
                    <span>{product.category || 'Tops'}</span>
                </div>
                {product.brand && (
                    <span className="closet-card-brand">{product.brand}</span>
                )}
            </div>
        </div>
    )
}
