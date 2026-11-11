'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Heart,
    MessageCircle,
    Share2,
    ShieldCheck,
    ShoppingBag,
} from 'lucide-react';
import { Product } from '@/types';
import { getMarketplaceProductById, toggleProductLike } from '@/actions/marketplace';
import { SEED_CREATORS, SEED_PRODUCTS } from '@/lib/revcloSeedData';
import { useCart } from '@/components/CartContext';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem } = useCart();

    const productId = typeof params.id === 'string' ? params.id : 'prod-quilted-1';
    const [product, setProduct] = useState<Product>(
        SEED_PRODUCTS.find((p) => p.id === productId) || SEED_PRODUCTS[0]
    );
    const [selectedImg, setSelectedImg] = useState<number>(0);
    const [liked, setLiked] = useState<boolean>(Boolean(product.is_liked));
    const [addedToast, setAddedToast] = useState<boolean>(false);

    useEffect(() => {
        getMarketplaceProductById(productId).then((res) => {
            if (res) {
                setProduct(res);
                setLiked(Boolean(res.is_liked));
            }
        });
    }, [productId]);

    const seller =
        SEED_CREATORS.find((c) => c.id === product.seller_id) || SEED_CREATORS[0];

    const handleAddToBag = () => {
        addItem(product);
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 2000);
    };

    const handleLikeToggle = async () => {
        setLiked(!liked);
        await toggleProductLike(product.id);
    };

    const related = SEED_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 110 }}>
            {/* Top Header */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">{product.brand}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        onClick={handleLikeToggle}
                        className="revclo-icon-btn"
                        aria-label="Save item"
                    >
                        <Heart
                            size={16}
                            color={liked ? '#dc2626' : 'var(--text-ink)'}
                            fill={liked ? '#dc2626' : 'none'}
                        />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                        className="revclo-icon-btn"
                        aria-label="Share"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </header>

            {/* Primary Image Gallery */}
            <div style={{ padding: '14px 16px 0' }}>
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1.12',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                    }}
                >
                    <img
                        src={
                            product.images[selectedImg] ||
                            product.images[0] ||
                            '/figma/14bdb6af-eb9e-4d33-ba53-2b0e83cb8918.png'
                        }
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="revclo-trust-pill" style={{ top: 12, left: 12 }}>
                        <span>{product.trust_score || 92}</span>
                        <span>🔥</span>
                    </span>
                    <span
                        className="revclo-pristine-pill"
                        style={{ top: 12, right: 12, left: 'auto' }}
                    >
                        {product.condition}
                    </span>
                </div>

                {product.images.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedImg(idx)}
                                style={{
                                    width: 60,
                                    height: 64,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    border:
                                        selectedImg === idx
                                            ? '2px solid var(--terracotta-800)'
                                            : '1px solid var(--border-card)',
                                }}
                            >
                                <img
                                    src={img}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Title, Price & Specs */}
            <div style={{ padding: '16px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Link
                        href={`/brand/${product.brand_slug || product.brand.toLowerCase()}`}
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: 'var(--terracotta-800)',
                        }}
                    >
                        {product.brand}
                    </Link>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Size: <strong style={{ color: 'var(--text-ink)' }}>{product.size}</strong>
                    </span>
                </div>

                <h1 style={{ fontSize: '19px', fontWeight: 700, marginTop: 4 }}>
                    {product.name}
                </h1>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: '22px', fontWeight: 700 }}>
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.original_price && (
                        <span
                            style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                textDecoration: 'line-through',
                            }}
                        >
                            ₹{product.original_price.toLocaleString('en-IN')} retail
                        </span>
                    )}
                </div>

                <p
                    style={{
                        marginTop: 12,
                        fontSize: '13px',
                        lineHeight: 1.5,
                        color: 'var(--text-secondary)',
                    }}
                >
                    {product.description}
                </p>

                {/* AI Trust Score Verification Card */}
                <div
                    style={{
                        marginTop: 16,
                        padding: '14px',
                        borderRadius: 14,
                        background: 'var(--terracotta-950)',
                        color: '#ffffff',
                        border: '1px solid var(--terracotta-800)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={17} color="#f59e0b" />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                RevClo AI Trust Score: {product.trust_score || 92}/100 🔥
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: 'rgba(242,254,223,0.16)',
                                color: '#b0c988',
                                fontWeight: 600,
                            }}
                        >
                            Verified Piece
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 6,
                            fontSize: '11.5px',
                            color: 'var(--terracotta-200)',
                        }}
                    >
                        <span>✓ Photo Consistency</span>
                        <span>✓ Brand Tag Verified</span>
                        <span>✓ Condition: {product.condition}</span>
                        <span>✓ Escrow Protected</span>
                    </div>
                </div>

                {/* Seller Closet Card */}
                <div
                    style={{
                        marginTop: 14,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1px solid var(--border-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Link
                        href={`/creator/${seller.handle}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                        <img
                            src={seller.avatar}
                            alt={seller.name}
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 999,
                                objectFit: 'cover',
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '13.5px',
                                    fontWeight: 700,
                                }}
                            >
                                <span>{seller.name}</span>
                                <CheckCircle2 size={14} color="var(--terracotta-800)" />
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                @{seller.handle} • Ships in 24 hrs
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/chat/conv-1"
                        className="revclo-outline-btn"
                        style={{ padding: '7px 12px', fontSize: '12px' }}
                    >
                        <MessageCircle size={14} />
                        <span>Ask seller</span>
                    </Link>
                </div>
            </div>

            {/* More From This Edit */}
            <section className="revclo-section" style={{ marginTop: 8 }}>
                <div className="revclo-section-header">
                    <h2 className="revclo-section-title">Similar Archive Finds</h2>
                </div>
                <div className="revclo-product-grid">
                    {related.map((item) => (
                        <RevcloProductCard key={item.id} product={item} badgeMode="trust" />
                    ))}
                </div>
            </section>

            {/* Sticky Bottom Add to Bag / Buy Bar */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 460,
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderTop: '1px solid var(--border-sand)',
                    display: 'flex',
                    gap: 10,
                    zIndex: 70,
                }}
            >
                <Link
                    href="/chat/conv-1"
                    className="revclo-outline-btn"
                    style={{ flex: 0.9, padding: '12px' }}
                >
                    <MessageCircle size={16} />
                    <span>Make Offer</span>
                </Link>
                <button
                    type="button"
                    onClick={handleAddToBag}
                    className="revclo-primary-btn"
                    style={{ flex: 1.4, padding: '12px' }}
                >
                    {addedToast ? <Check size={16} /> : <ShoppingBag size={16} />}
                    <span>{addedToast ? 'Added to Bag!' : 'Add to Bag'}</span>
                </button>
            </div>
        </div>
    );
}
