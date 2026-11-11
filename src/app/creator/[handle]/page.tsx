'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Instagram,
    MessageCircle,
    Share2,
} from 'lucide-react';
import { Brand, CreatorProfile, Product } from '@/types';
import { getCreatorByHandle } from '@/actions/marketplace';
import { SEED_BRANDS, SEED_CREATORS, SEED_PRODUCTS } from '@/lib/revcloSeedData';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';

export default function CreatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const handleParam = typeof params.handle === 'string' ? params.handle : 'jenny._';

    const [creator, setCreator] = useState<CreatorProfile>(SEED_CREATORS[1]);
    const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
    const [brands, setBrands] = useState<Brand[]>(SEED_BRANDS);
    const [activeTab, setActiveTab] = useState<'items' | 'brands'>('items');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        getCreatorByHandle(handleParam).then((res) => {
            setCreator(res.creator);
            setProducts(res.products);
            setBrands(res.brands);
        });
    }, [handleParam]);

    const handleShare = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Top Header matching Figma 93:3543 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">@{creator.handle}</span>
                <button
                    type="button"
                    onClick={handleShare}
                    className="revclo-icon-btn"
                    title="Share Creator Closet"
                >
                    <Share2 size={16} />
                </button>
            </header>

            {copied && (
                <div
                    style={{
                        margin: '8px 16px 0',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--badge-pristine-bg)',
                        color: 'var(--badge-pristine-text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'center',
                    }}
                >
                    Closet link copied to clipboard!
                </div>
            )}

            {/* Creator Bio Card matching Figma 93:3543 */}
            <section style={{ padding: '18px 16px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                        src={creator.avatar}
                        alt={creator.name}
                        style={{
                            width: 68,
                            height: 68,
                            borderRadius: 999,
                            objectFit: 'cover',
                            border: '2px solid var(--terracotta-800)',
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{creator.name}</h1>
                            {creator.verified && (
                                <CheckCircle2 size={16} color="var(--terracotta-800)" />
                            )}
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                            @{creator.handle} • {creator.location}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <a
                                href={creator.instagram_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--terracotta-800)',
                                    background: 'var(--terracotta-50)',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    border: '1px solid var(--terracotta-200)',
                                }}
                            >
                                <Instagram size={13} />
                                <span>Instagram</span>
                                <ExternalLink size={11} />
                            </a>

                            <Link
                                href="/chat/conv-2"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--text-ink)',
                                    background: '#ffffff',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    border: '1px solid var(--border-sand)',
                                }}
                            >
                                <MessageCircle size={13} />
                                <span>Message</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <p
                    style={{
                        marginTop: 12,
                        fontSize: '13px',
                        lineHeight: 1.45,
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border-sand)',
                    }}
                >
                    {creator.bio}
                </p>
            </section>

            {/* Tabs: Items vs Brands matching 93:3543 */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-sand)',
                    margin: '0 16px 16px',
                }}
            >
                <button
                    type="button"
                    onClick={() => setActiveTab('items')}
                    style={{
                        flex: 1,
                        padding: '11px 0',
                        fontSize: '13px',
                        fontWeight: activeTab === 'items' ? 700 : 500,
                        color:
                            activeTab === 'items'
                                ? 'var(--terracotta-900)'
                                : 'var(--text-muted)',
                        borderBottom:
                            activeTab === 'items'
                                ? '2.5px solid var(--terracotta-800)'
                                : '2.5px solid transparent',
                    }}
                >
                    Items ({products.length})
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('brands')}
                    style={{
                        flex: 1,
                        padding: '11px 0',
                        fontSize: '13px',
                        fontWeight: activeTab === 'brands' ? 700 : 500,
                        color:
                            activeTab === 'brands'
                                ? 'var(--terracotta-900)'
                                : 'var(--text-muted)',
                        borderBottom:
                            activeTab === 'brands'
                                ? '2.5px solid var(--terracotta-800)'
                                : '2.5px solid transparent',
                    }}
                >
                    Brands ({brands.length})
                </button>
            </div>

            {activeTab === 'items' ? (
                <div className="revclo-product-grid">
                    {products.map((product) => (
                        <RevcloProductCard
                            key={product.id}
                            product={product}
                            badgeMode="trust"
                        />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        padding: '0 16px',
                    }}
                >
                    {brands.map((brand) => (
                        <Link
                            key={brand.id}
                            href={`/brand/${brand.slug}`}
                            style={{
                                background: '#ffffff',
                                borderRadius: 12,
                                border: '1px solid var(--border-card)',
                                padding: 14,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: 'var(--font-script)',
                                    fontSize: '26px',
                                    fontWeight: 700,
                                    color: 'var(--terracotta-900)',
                                }}
                            >
                                {brand.name}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {brand.items_count || 18} pieces in closet
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
