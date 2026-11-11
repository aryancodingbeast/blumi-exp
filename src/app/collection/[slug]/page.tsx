'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Check, Share2 } from 'lucide-react';
import { Collection, Product } from '@/types';
import { getCollectionBySlug } from '@/actions/marketplace';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '@/lib/revcloSeedData';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';

export default function CollectionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params.slug === 'string' ? params.slug : 'summer-inspirations';

    const [collection, setCollection] = useState<Collection>(SEED_COLLECTIONS[0]);
    const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
    const [followed, setFollowed] = useState<boolean>(false);
    const [savesCount, setSavesCount] = useState<number>(119);

    useEffect(() => {
        getCollectionBySlug(slug).then((res) => {
            setCollection(res.collection);
            setProducts(res.products);
            setFollowed(res.isFollowed);
            setSavesCount(res.collection.saves_count);
        });
    }, [slug]);

    const handleFollowToggle = () => {
        const next = !followed;
        setFollowed(next);
        setSavesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Hero Cover matching Figma 93:4650 */}
            <div style={{ position: 'relative', height: '250px', width: '100%' }}>
                <img
                    src={collection.cover_image}
                    alt={collection.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.76)',
                    }}
                />

                {/* Top Floating Actions */}
                <div
                    style={{
                        position: 'absolute',
                        top: 14,
                        left: 16,
                        right: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                        className="revclo-icon-btn"
                        style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                        <Share2 size={16} />
                    </button>
                </div>

                {/* Bottom Overlay Metadata */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '18px 16px',
                        background:
                            'linear-gradient(to top, rgba(22,22,22,0.88) 0%, rgba(22,22,22,0.4) 70%, transparent 100%)',
                        color: '#ffffff',
                    }}
                >
                    <Link
                        href={`/creator/${collection.creator_handle}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6,
                        }}
                    >
                        <img
                            src={collection.creator_avatar}
                            alt={collection.creator_name}
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 999,
                                objectFit: 'cover',
                                border: '1px solid #fff',
                            }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>
                            @{collection.creator_name}
                        </span>
                    </Link>

                    <div
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            opacity: 0.85,
                        }}
                    >
                        COLLECTION • {savesCount} SAVES
                    </div>
                    <h1
                        style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '26px',
                            fontWeight: 700,
                            marginTop: 2,
                        }}
                    >
                        {collection.title}
                    </h1>
                </div>
            </div>

            {/* Action Bar matching Figma 93:4650 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-sand)',
                    background: '#ffffff',
                }}
            >
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-ink)' }}>
                    {collection.items_count} Finds
                </span>

                <button
                    type="button"
                    onClick={handleFollowToggle}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 999,
                        background: followed ? 'var(--locust-100)' : 'var(--terracotta-920)',
                        color: followed ? 'var(--locust-800)' : '#ffffff',
                        border: followed
                            ? '1px solid var(--locust-400)'
                            : '1px solid var(--terracotta-920)',
                        fontSize: '12px',
                        fontWeight: 600,
                    }}
                >
                    {followed ? <Check size={14} /> : <Bookmark size={14} />}
                    <span>{followed ? 'Following Collection' : 'Follow Collection'}</span>
                </button>
            </div>

            {/* 2-Column Product Grid */}
            <div style={{ paddingTop: 16 }}>
                <div className="revclo-product-grid">
                    {products.map((product) => (
                        <RevcloProductCard
                            key={product.id}
                            product={product}
                            badgeMode="trust"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
