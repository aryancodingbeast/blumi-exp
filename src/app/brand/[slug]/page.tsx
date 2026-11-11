'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Check,
    ExternalLink,
    Plus,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { Brand, MarketplaceFilterState, Product } from '@/types';
import { getBrandBySlug } from '@/actions/marketplace';
import { SEED_BRANDS, SEED_PRODUCTS } from '@/lib/revcloSeedData';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import FilterSortDrawer from '@/components/revclo/FilterSortDrawer';

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params.slug === 'string' ? params.slug : 'diesel';

    const [brand, setBrand] = useState<Brand>(SEED_BRANDS[0]);
    const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
    const [inFeed, setInFeed] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const [filters, setFilters] = useState<MarketplaceFilterState>({
        sortBy: 'trending',
    });

    useEffect(() => {
        getBrandBySlug(slug).then((res) => {
            setBrand(res.brand);
            setProducts(res.products);
            setInFeed(res.isFollowed);
        });
    }, [slug]);

    const filtered = products.filter((p) => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            if (
                !p.name.toLowerCase().includes(q) &&
                !p.category.toLowerCase().includes(q)
            ) {
                return false;
            }
        }
        return true;
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Top Bar matching Figma 102:3591 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">{brand.name}</span>
                <div style={{ width: 36 }} />
            </header>

            {/* Brand Hero Banner & Script Title matching 102:3591 */}
            <section
                style={{
                    padding: '20px 16px 16px',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1
                        style={{
                            fontFamily: 'var(--font-script)',
                            fontSize: '46px',
                            fontWeight: 700,
                            lineHeight: 0.95,
                            color: 'var(--terracotta-900)',
                        }}
                    >
                        {brand.name}
                    </h1>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-card)',
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid var(--border-sand)',
                        }}
                    >
                        {brand.followers_count.toLocaleString()} followers
                    </span>
                </div>

                <p
                    style={{
                        marginTop: 10,
                        fontSize: '13px',
                        lineHeight: 1.45,
                        color: 'var(--text-secondary)',
                    }}
                >
                    {brand.bio}
                </p>

                {/* Action Buttons: Add to My Feed + Visit site */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                        type="button"
                        onClick={() => setInFeed(!inFeed)}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: inFeed ? 'var(--locust-100)' : 'var(--terracotta-920)',
                            color: inFeed ? 'var(--locust-800)' : '#ffffff',
                            border: inFeed
                                ? '1px solid var(--locust-400)'
                                : '1px solid var(--terracotta-920)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                        }}
                    >
                        {inFeed ? <Check size={15} /> : <Plus size={15} />}
                        <span>{inFeed ? 'Added to My Feed' : 'Add to My Feed'}</span>
                    </button>

                    <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="revclo-outline-btn"
                        style={{ padding: '10px 14px', fontSize: '12.5px' }}
                    >
                        <span>Visit site</span>
                        <ExternalLink size={13} />
                    </a>
                </div>

                {/* Search Brand Input + Filter Row */}
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <div className="revclo-search-pill" style={{ flex: 1 }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${brand.name}...`}
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: '12.5px',
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        className="revclo-outline-btn"
                        style={{ padding: '0 12px', fontSize: '12px' }}
                    >
                        <SlidersHorizontal size={13} />
                        <span>All Filters</span>
                    </button>
                </div>
            </section>

            {/* Brand Catalog Grid */}
            <div style={{ paddingTop: 16 }}>
                <div className="revclo-product-grid">
                    {filtered.map((product) => (
                        <RevcloProductCard
                            key={product.id}
                            product={product}
                            badgeMode="trust"
                        />
                    ))}
                </div>
            </div>

            <FilterSortDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                initialFilters={filters}
                onApply={(next) => setFilters(next)}
                onClear={() => setFilters({ sortBy: 'trending' })}
            />
        </div>
    );
}
