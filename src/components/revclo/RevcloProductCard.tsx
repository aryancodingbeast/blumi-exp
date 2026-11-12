'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Pencil } from 'lucide-react';
import { Product } from '@/types';
import { toggleProductLike } from '@/actions/marketplace';

interface RevcloProductCardProps {
    product: Product;
    badgeMode?: 'trust' | 'condition' | 'none';
    showPristineBadge?: boolean;
    showEditButton?: boolean;
    onEditClick?: (product: Product) => void;
    onToggleLike?: (productId: string, nextLiked: boolean) => void | Promise<void>;
}

export default function RevcloProductCard({
    product,
    badgeMode = 'trust',
    showPristineBadge = false,
    showEditButton = false,
    onEditClick,
    onToggleLike,
}: RevcloProductCardProps) {
    const [liked, setLiked] = useState<boolean>(Boolean(product.is_liked));
    const [animating, setAnimating] = useState(false);

    const primaryImage =
        product.images && product.images.length > 0 ? product.images[0] : '';

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (showEditButton && onEditClick) {
            onEditClick(product);
            return;
        }
        const next = !liked;
        setLiked(next);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 260);
        if (onToggleLike) {
            await onToggleLike(product.id, next);
            return;
        }
        try {
            await toggleProductLike(product.id);
        } catch {
            // optimistic state stays responsive
        }
    };

    const trustScore = product.trust_score || 92;
    const effectiveBadgeMode = showPristineBadge ? 'condition' : badgeMode;

    return (
        <Link href={`/product/${product.id}`} className="revclo-product-card">
            <div className="revclo-card-media">
                {primaryImage && (
                    <img
                        src={primaryImage}
                        alt={product.title || product.name}
                        className="revclo-card-img"
                        loading="lazy"
                        decoding="async"
                    />
                )}

                {effectiveBadgeMode === 'trust' && (
                    <span
                        className="revclo-trust-pill"
                        title={`AI Trust Score: ${trustScore}/100`}
                    >
                        <span>{trustScore}</span>
                        <svg
                            width="11"
                            height="12"
                            viewBox="0 0 12 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6.65 0.7C6.65 0.7 7.1 2.65 5.75 4.1C4.6 5.33 4.85 6.95 5.9 7.55C5.2 6.45 5.85 5.1 6.9 4.45C6.9 4.45 6.65 6.3 7.85 7.45C8.85 8.4 8.75 10.25 7.4 11.25C8.95 10.85 10.25 9.35 10.25 7.45C10.25 4.55 7.75 2.4 6.65 0.7ZM4.15 4.25C2.5 5.65 1.75 7.35 1.75 9.1C1.75 11.45 3.65 13.3 6 13.3C6.45 13.3 6.9 13.2 7.3 13.05C5.65 12.8 4.4 11.4 4.4 9.7C4.4 8.2 5.25 7.15 4.15 4.25Z"
                                fill="#F59E0B"
                            />
                        </svg>
                    </span>
                )}

                {effectiveBadgeMode === 'condition' && (
                    <span className="revclo-pristine-pill">
                        {product.condition || 'Pristine'}
                    </span>
                )}

                <button
                    type="button"
                    onClick={handleLike}
                    aria-label={
                        showEditButton
                            ? 'Edit listing'
                            : liked
                              ? 'Unlike item'
                              : 'Save item'
                    }
                    className={`revclo-heart-btn ${liked && !showEditButton ? 'liked' : ''}`}
                    style={{
                        transform: animating ? 'scale(1.24)' : undefined,
                    }}
                >
                    {showEditButton ? (
                        <Pencil size={14} strokeWidth={2} />
                    ) : (
                        <Heart
                            size={15}
                            strokeWidth={2}
                            fill={liked ? '#dc2626' : 'none'}
                        />
                    )}
                </button>
            </div>

            <div className="revclo-card-meta">
                <div className="revclo-card-row-top">
                    <span className="revclo-card-brand">
                        {product.brand || 'Archive'}
                    </span>
                    <span className="revclo-card-price">
                        ₹{Number(product.price || 299).toLocaleString('en-IN')}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-[#161616] truncate">
                        {product.title || product.name}
                    </span>
                    <span className="revclo-card-size shrink-0">
                        {product.size || 'M'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
