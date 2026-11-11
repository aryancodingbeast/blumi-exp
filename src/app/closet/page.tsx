'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    Package,
    Plus,
    Settings,
    Share2,
    Sparkles,
    X,
} from 'lucide-react';
import { Product } from '@/types';
import { getMarketplaceProducts } from '@/actions/marketplace';
import {
    DEFAULT_DEMO_USER,
    SEED_BRANDS,
    SEED_PRODUCTS,
} from '@/lib/revcloSeedData';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';

export default function ClosetPage() {
    const [profile, setProfile] = useState({
        name: DEFAULT_DEMO_USER.name,
        handle: DEFAULT_DEMO_USER.handle,
        bio: DEFAULT_DEMO_USER.bio,
        location: DEFAULT_DEMO_USER.location,
        avatar: DEFAULT_DEMO_USER.image,
    });
    const [activeTab, setActiveTab] = useState<'shop' | 'brands' | 'finds'>('shop');
    const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
    const [showEmptyPreview, setShowEmptyPreview] = useState<boolean>(false);
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        getMarketplaceProducts().then((res) => {
            if (res && res.length > 0) setProducts(res);
        });
    }, []);

    const shopItems = showEmptyPreview
        ? []
        : products.filter((p) => p.seller_id === DEFAULT_DEMO_USER.id || p.brand === 'QUILTED');
    const likedFinds = showEmptyPreview
        ? []
        : products.filter((p) => p.is_liked);

    const handleShareShop = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(`${window.location.origin}/creator/${profile.handle}`);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Top Bar matching Figma 287:13579 */}
            <header className="revclo-page-header">
                <Link
                    href="/orders"
                    className="revclo-icon-btn"
                    title="Past Orders"
                >
                    <Package size={17} />
                </Link>
                <span className="revclo-page-title">@{profile.handle}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                        href="/sell"
                        className="revclo-icon-btn"
                        title="Upload New Item"
                    >
                        <Plus size={17} />
                    </Link>
                    <Link
                        href="/settings"
                        className="revclo-icon-btn"
                        title="Settings"
                    >
                        <Settings size={17} />
                    </Link>
                </div>
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
                    Shop link copied to clipboard!
                </div>
            )}

            {/* Profile Card matching Figma 287:13579 */}
            <section
                style={{
                    padding: '18px 16px 16px',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                        src={profile.avatar}
                        alt={profile.name}
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
                            <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{profile.name}</h1>
                            <CheckCircle2 size={16} color="var(--terracotta-800)" />
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                            @{profile.handle} • {profile.location}
                        </div>

                        {/* Stats Row: Live | Sold | Finds */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                marginTop: 10,
                                fontSize: '12.5px',
                            }}
                        >
                            <span>
                                <strong>{shopItems.length}</strong> Live
                            </span>
                            <span style={{ color: 'var(--border-card)' }}>|</span>
                            <span>
                                <strong>1</strong> Sold
                            </span>
                            <span style={{ color: 'var(--border-card)' }}>|</span>
                            <span>
                                <strong>{likedFinds.length}</strong> Finds
                            </span>
                        </div>
                    </div>
                </div>

                <p
                    style={{
                        marginTop: 12,
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                    }}
                >
                    {profile.bio}
                </p>

                {/* Action Buttons: Share shop + Edit profile */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                        type="button"
                        onClick={handleShareShop}
                        className="revclo-outline-btn"
                        style={{ flex: 1 }}
                    >
                        <Share2 size={14} />
                        <span>Share shop</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setEditModalOpen(true)}
                        className="revclo-outline-btn"
                        style={{ flex: 1 }}
                    >
                        <span>Edit profile</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowEmptyPreview(!showEmptyPreview)}
                        className="revclo-outline-btn"
                        style={{ fontSize: '11px', padding: '0 10px' }}
                        title="Toggle Empty State Preview (Figma 297:13954)"
                    >
                        {showEmptyPreview ? 'Show Items' : 'Empty State'}
                    </button>
                </div>
            </section>

            {/* Closet Tabs: Shop / Brands / Finds matching 287:13579 */}
            <div
                style={{
                    display: 'flex',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                    marginBottom: 16,
                }}
            >
                {(
                    [
                        { id: 'shop', label: `Shop (${shopItems.length})` },
                        { id: 'brands', label: `Brands (${SEED_BRANDS.length})` },
                        { id: 'finds', label: `Finds (${likedFinds.length})` },
                    ] as const
                ).map((t) => {
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                fontSize: '13px',
                                fontWeight: active ? 700 : 500,
                                color: active
                                    ? 'var(--terracotta-900)'
                                    : 'var(--text-muted)',
                                borderBottom: active
                                    ? '2.5px solid var(--terracotta-800)'
                                    : '2.5px solid transparent',
                            }}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'shop' && (
                shopItems.length === 0 ? (
                    /* Empty State matching Figma 297:13954 */
                    <div
                        style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 999,
                                background: 'var(--terracotta-50)',
                                color: 'var(--terracotta-800)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Sparkles size={24} />
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                            Nothing in your shop yet
                        </h3>
                        <p
                            style={{
                                fontSize: '12.5px',
                                color: 'var(--text-muted)',
                                maxWidth: 250,
                            }}
                        >
                            Turn your pre-loved archive pieces into cash in under 30 seconds.
                        </p>
                        <Link
                            href="/sell"
                            className="revclo-primary-btn"
                            style={{ marginTop: 6 }}
                        >
                            <Plus size={16} />
                            <span>List your first piece</span>
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-product-grid">
                        {shopItems.map((product) => (
                            <RevcloProductCard
                                key={product.id}
                                product={product}
                                badgeMode="condition"
                                showEditButton={true}
                            />
                        ))}
                    </div>
                )
            )}

            {activeTab === 'brands' && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        padding: '0 16px',
                    }}
                >
                    {SEED_BRANDS.map((brand) => (
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
                                gap: 4,
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
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Saved in Feed
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {activeTab === 'finds' && (
                likedFinds.length === 0 ? (
                    <div
                        style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                        }}
                    >
                        Nothing in your finds yet. Tap the heart on any item to save it here.
                    </div>
                ) : (
                    <div className="revclo-product-grid">
                        {likedFinds.map((product) => (
                            <RevcloProductCard
                                key={product.id}
                                product={product}
                                badgeMode="trust"
                            />
                        ))}
                    </div>
                )
            )}

            {/* Edit Profile Modal */}
            {editModalOpen && (
                <div className="revclo-backdrop" onClick={() => setEditModalOpen(false)}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 14,
                            }}
                        >
                            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Edit Closet Profile</h3>
                            <button type="button" onClick={() => setEditModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile({ ...profile, name: e.target.value })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-sand)',
                                        marginTop: 4,
                                        fontSize: '13px',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Closet Bio
                                </label>
                                <textarea
                                    rows={3}
                                    value={profile.bio}
                                    onChange={(e) =>
                                        setProfile({ ...profile, bio: e.target.value })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-sand)',
                                        marginTop: 4,
                                        fontSize: '13px',
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="revclo-primary-btn"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
