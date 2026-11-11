'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    ChevronDown,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { MarketplaceFilterState, Product } from '@/types';
import { getMarketplaceProducts } from '@/actions/marketplace';
import { SEED_PRODUCTS } from '@/lib/revcloSeedData';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import FilterSortDrawer from '@/components/revclo/FilterSortDrawer';

function SearchCatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialQ = searchParams.get('q') || 'Vintage sunglasses';
    const initialCat = searchParams.get('category') || 'Glasses & Sunglasses';

    const [query, setQuery] = useState<string>(initialQ);
    const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const [activePills, setActivePills] = useState<string[]>([
        initialCat,
        'Prada',
        'Versace',
    ]);
    const [filters, setFilters] = useState<MarketplaceFilterState>({
        query: initialQ,
        category: 'All',
        brands: [],
        sortBy: 'trending',
    });

    useEffect(() => {
        let mounted = true;
        getMarketplaceProducts(filters).then((res) => {
            if (mounted) {
                setProducts(res.length > 0 ? res : SEED_PRODUCTS);
            }
        });
        return () => {
            mounted = false;
        };
    }, [filters]);

    const removePill = (pill: string) => {
        setActivePills((prev) => prev.filter((p) => p !== pill));
    };

    const clearAllPills = () => {
        setActivePills([]);
        setQuery('');
        setFilters({
            department: 'All',
            category: 'All',
            brands: [],
            sizes: [],
            sortBy: 'trending',
        });
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Top Search Bar matching Figma 98:3346 */}
            <header className="revclo-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={17} />
                    </button>

                    <div className="revclo-search-pill" style={{ flex: 1 }}>
                        <Search size={15} color="var(--text-muted)" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setFilters((prev) => ({ ...prev, query: e.target.value }));
                            }}
                            placeholder="Search pieces, brands, closets..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--text-ink)',
                            }}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('');
                                    setFilters((prev) => ({ ...prev, query: '' }));
                                }}
                                aria-label="Clear search"
                            >
                                <X size={14} color="var(--text-muted)" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter & Sort Trigger Row */}
                <div
                    className="no-scrollbar"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflowX: 'auto',
                        marginTop: 10,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'var(--terracotta-920)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <SlidersHorizontal size={13} />
                        <span>All Filters {activePills.length > 0 ? `• ${activePills.length}` : ''}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: '#ffffff',
                            border: '1px solid var(--border-sand)',
                            fontSize: '12px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span>Sort</span>
                        <ChevronDown size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: '#ffffff',
                            border: '1px solid var(--border-sand)',
                            fontSize: '12px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span>Brand</span>
                        <ChevronDown size={13} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: '#ffffff',
                            border: '1px solid var(--border-sand)',
                            fontSize: '12px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span>Size</span>
                        <ChevronDown size={13} />
                    </button>
                </div>
            </header>

            {/* ACTIVE FILTERS Section matching Figma 98:3346 */}
            {activePills.length > 0 && (
                <div style={{ padding: '12px 16px 6px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                            }}
                        >
                            Active Filters
                        </span>
                        <button
                            type="button"
                            onClick={clearAllPills}
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--terracotta-800)',
                            }}
                        >
                            Clear all
                        </button>
                    </div>

                    <div
                        className="no-scrollbar"
                        style={{ display: 'flex', gap: 8, overflowX: 'auto' }}
                    >
                        {activePills.map((pill) => (
                            <span
                                key={pill}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    background: '#ffffff',
                                    border: '1px solid var(--border-card)',
                                    fontSize: '11.5px',
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <span>{pill}</span>
                                <button
                                    type="button"
                                    onClick={() => removePill(pill)}
                                    aria-label={`Remove ${pill}`}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* 2-Column Product Results Grid */}
            <div style={{ paddingTop: 12 }}>
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

            <FilterSortDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                initialFilters={filters}
                onApply={(next) => {
                    setFilters(next);
                    const nextPills: string[] = [];
                    if (next.category && next.category !== 'All') nextPills.push(next.category);
                    if (next.brands) nextPills.push(...next.brands);
                    if (next.sizes) nextPills.push(...next.sizes);
                    if (nextPills.length > 0) setActivePills(nextPills);
                }}
                onClear={clearAllPills}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div style={{ padding: 24 }}>Loading archive catalog...</div>}>
            <SearchCatalogContent />
        </Suspense>
    );
}
