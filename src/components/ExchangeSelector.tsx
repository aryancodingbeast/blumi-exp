'use client'

import { useState } from 'react'
import { Product } from '@/types'
import ClosetItemCard from './ClosetItemCard'
import { ArrowRight, Shirt } from 'lucide-react'

interface ExchangeSelectorProps {
    products: Product[]
    onSelect: (product: Product) => void
}

export default function ExchangeSelector({ products, onSelect }: ExchangeSelectorProps) {
    const [selected, setSelected] = useState<Product | null>(null)

    const handleSelect = (product: Product) => {
        setSelected(prev => prev?.id === product.id ? null : product)
    }

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected)
        }
    }

    if (products.length === 0) {
        return (
            <div className="exchange-selector-empty">
                <div className="exchange-empty-icon">
                    <Shirt size={48} />
                </div>
                <h2 className="exchange-empty-title">YOUR CLOSET IS EMPTY_</h2>
                <p className="exchange-empty-text">
                    You need to list at least one item before you can start swiping.
                    Add clothes to your closet first!
                </p>
                <a href="/closet/add" className="exchange-empty-cta">
                    LIST YOUR FIRST ITEM
                    <ArrowRight size={16} />
                </a>
            </div>
        )
    }

    return (
        <div className="exchange-selector">
            <div className="exchange-selector-header">
                <div>
                    <p className="exchange-selector-label">STEP 1_</p>
                    <h2 className="exchange-selector-title">PICK YOUR OFFER</h2>
                    <p className="exchange-selector-subtitle">
                        Select which item from your closet you want to offer in exchange during this swiping session
                    </p>
                </div>
            </div>

            <div className="exchange-selector-grid">
                {products.map(product => (
                    <ClosetItemCard
                        key={product.id}
                        product={product}
                        isSelected={selected?.id === product.id}
                        onSelect={handleSelect}
                        selectable
                    />
                ))}
            </div>

            <div className="exchange-selector-footer">
                {selected && (
                    <div className="exchange-selected-preview">
                        <span className="exchange-selected-label">OFFERING:</span>
                        <span className="exchange-selected-name">{selected.title}</span>
                    </div>
                )}
                <button
                    className="exchange-start-btn"
                    disabled={!selected}
                    onClick={handleConfirm}
                >
                    START SWIPING
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    )
}
