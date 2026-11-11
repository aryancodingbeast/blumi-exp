'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { Product } from '@/types';
import {
    getMarketplaceProducts,
    toggleProductLike,
} from '@/actions/marketplace';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import FilterSortDrawer, {
    FilterSortState,
} from '@/components/revclo/FilterSortDrawer';
import BottomNavbar from '@/components/revclo/BottomNavbar';

const INITIAL_FILTERS: FilterSortState = {
    sortBy: 'trending',
    category: 'All',
    sizes: [],
    conditions: [],
    brands: [],
    maxPrice: 50000,
};

function SearchCatalogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQ = searchParams.get('q') || '';
    const initialCat = searchParams.get('category') || 'All';
    const initialSort =
        (searchParams.get('sort') as FilterSortState['sortBy']) || 'trending';

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState(initialQ);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterSortState>({
        ...INITIAL_FILTERS,
        category: initialCat,
        sortBy: initialSort,
    });

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getMarketplaceProducts({ sortBy: 'trending' })
            .then((items) => {
                if (active) setAllProducts(items);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const dynamicBrands = useMemo(() => {
        const counts = new Map<string, number>();
        for (const p of allProducts) {
            if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([b]) => b);
    }, [allProducts]);

    const dynamicSizes = useMemo(() => {
        const set = new Set<string>();
        for (const p of allProducts) {
            if (p.size) set.add(String(p.size));
        }
        return Array.from(set).slice(0, 8);
    }, [allProducts]);

    const filteredProducts = useMemo(() => {
        let list = [...allProducts];

        if (query.trim()) {
            const terms = query
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);
            list = list.filter((p) => {
                const hay = `${p.title} ${p.brand} ${p.category} ${p.sub_category || ''} ${p.description || ''} ${p.seller?.name || ''}`.toLowerCase();
                return terms.every((t) => hay.includes(t));
            });
        }

        if (filters.category !== 'All') {
            list = list.filter(
                (p) =>
                    p.category.toLowerCase() ===
                        filters.category.toLowerCase() ||
                    p.sub_category?.toLowerCase() ===
                        filters.category.toLowerCase()
            );
        }

        if (filters.sizes.length > 0) {
            const lower = filters.sizes.map((s) => s.toLowerCase());
            list = list.filter((p) =>
                lower.includes(String(p.size).toLowerCase())
            );
        }

        if (filters.conditions.length > 0) {
            const lower = filters.conditions.map((c) => c.toLowerCase());
            list = list.filter((p) =>
                lower.includes(String(p.condition).toLowerCase())
            );
        }

        if (filters.brands.length > 0) {
            const lower = filters.brands.map((b) => b.toLowerCase());
            list = list.filter((p) => lower.includes(p.brand.toLowerCase()));
        }

        if (filters.maxPrice < 50000) {
            list = list.filter((p) => p.price <= filters.maxPrice);
        }

        switch (filters.sortBy) {
            case 'price_asc':
                list.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                list.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                list.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
                break;
            case 'trust_score':
                list.sort(
                    (a, b) => (b.trust_score || 90) - (a.trust_score || 90)
                );
                break;
            case 'trending':
            default:
                list.sort(
                    (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
                );
                break;
        }

        return list;
    }, [allProducts, query, filters]);

    const handleLikeToggle = async (productId: string, nextLiked: boolean) => {
        setAllProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, is_liked: nextLiked } : p
            )
        );
        try {
            await toggleProductLike(productId);
        } catch {
            // ignore
        }
    };

    const toggleArrayValue = (arr: string[], val: string) =>
        arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

    const resetAll = () => {
        setQuery('');
        setFilters(INITIAL_FILTERS);
    };

    return (
        <>
            <header className="revclo-page-header">
                <div className="flex items-center gap-2.5 flex-1">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>

                    <div className="revclo-search-pill flex-1 max-w-[560px]">
                        <Search size={15} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search corsets, tops, dresses, Hollister, Shein..."
                            className="w-full bg-transparent border-none outline-none text-[13px] text-[#161616]"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setFilterOpen(true)}
                    className="revclo-outline-btn text-[12px] shrink-0"
                >
                    <SlidersHorizontal size={14} />
                    <span>Filter & Sort</span>
                </button>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {/* Quick Filter Chips Row (Figma 93:3543) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
                    {(
                        [
                            'All',
                            'Tops',
                            'Dresses',
                            'Bottoms',
                            'Outerwear',
                            'Accessories',
                        ] as const
                    ).map((cat) => {
                        const active = filters.category === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        category: cat,
                                    }))
                                }
                                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 border transition-all ${
                                    active
                                        ? 'bg-[#532B21] text-white border-[#532B21]'
                                        : 'bg-white text-[#434343] border-[#DCD6CD] hover:border-[#532B21]'
                                }`}
                            >
                                {cat === 'All' ? 'All Categories' : cat}
                            </button>
                        );
                    })}
                </div>

                <div className="revclo-desktop-sidebar-grid">
                    {/* Desktop Persistent Left Filter Sidebar */}
                    <aside className="hidden lg:flex flex-col gap-5 bg-white rounded-[20px] border border-[#DCD6CD] p-5 sticky top-24">
                        <div className="flex items-center justify-between border-b border-[#EFEFEF] pb-3">
                            <h2 className="text-[15px] font-bold text-[#161616]">
                                Refine Catalog
                            </h2>
                            <button
                                type="button"
                                onClick={resetAll}
                                className="text-[11px] font-semibold text-[#8B4736] inline-flex items-center gap-1"
                            >
                                <RotateCcw size={11} />
                                Reset
                            </button>
                        </div>

                        {/* Sort By */}
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C] mb-2">
                                Sort By
                            </h3>
                            <div className="flex flex-col gap-1.5">
                                {(
                                    [
                                        { id: 'trending', label: 'Trending First' },
                                        { id: 'price_asc', label: 'Price: Low to High' },
                                        { id: 'price_desc', label: 'Price: High to Low' },
                                        { id: 'newest', label: 'Newest Arrivals' },
                                        { id: 'trust_score', label: 'Highest AI Trust' },
                                    ] as const
                                ).map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            setFilters((f) => ({
                                                ...f,
                                                sortBy: opt.id,
                                            }))
                                        }
                                        className={`text-left px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                                            filters.sortBy === opt.id
                                                ? 'bg-[#161616] text-white font-semibold'
                                                : 'text-[#434343] hover:bg-[#F7F6F3]'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sizes */}
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C] mb-2">
                                Size
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {dynamicSizes.map((sz) => {
                                    const active = filters.sizes.includes(sz);
                                    return (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() =>
                                                setFilters((f) => ({
                                                    ...f,
                                                    sizes: toggleArrayValue(
                                                        f.sizes,
                                                        sz
                                                    ),
                                                }))
                                            }
                                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                                                active
                                                    ? 'bg-[#532B21] text-white border-[#532B21]'
                                                    : 'bg-[#F7F6F3] text-[#161616] border-[#DCD6CD]'
                                            }`}
                                        >
                                            {sz}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Brands */}
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C] mb-2">
                                Brands & Closets
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {dynamicBrands.map((b) => {
                                    const active = filters.brands.includes(b);
                                    return (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() =>
                                                setFilters((f) => ({
                                                    ...f,
                                                    brands: toggleArrayValue(
                                                        f.brands,
                                                        b
                                                    ),
                                                }))
                                            }
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                                active
                                                    ? 'bg-[#161616] text-white border-[#161616]'
                                                    : 'bg-white text-[#434343] border-[#DCD6CD]'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* Right Main Results Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[13px] font-medium text-[#5E5E5E]">
                                Showing{' '}
                                <strong className="text-[#161616]">
                                    {filteredProducts.length}
                                </strong>{' '}
                                verified pieces
                                {query ? ` for "${query}"` : ''}
                            </p>
                            {(query ||
                                filters.category !== 'All' ||
                                filters.sizes.length > 0 ||
                                filters.brands.length > 0) && (
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    className="text-[12px] font-semibold text-[#8B4736] underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                                <Loader2
                                    size={26}
                                    className="animate-spin text-[#532B21]"
                                />
                                <p className="text-[13px]">
                                    Searching live Supabase catalog...
                                </p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-12 text-center">
                                <h3 className="text-[16px] font-bold text-[#161616]">
                                    No matching pieces found
                                </h3>
                                <p className="text-[13px] text-[#6F6F6F] mt-1 mb-4">
                                    Try clearing a filter or searching for another brand or category.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    className="px-5 py-2.5 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                                >
                                    Reset Search
                                </button>
                            </div>
                        ) : (
                            <div className="revclo-product-grid !px-0">
                                {filteredProducts.map((product) => (
                                    <RevcloProductCard
                                        key={product.id}
                                        product={product}
                                        showPristineBadge
                                        onToggleLike={handleLikeToggle}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <FilterSortDrawer
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                value={filters}
                onChange={setFilters}
                totalResults={filteredProducts.length}
            />

            <BottomNavbar
                showFilterPill
                onFilterClick={() => setFilterOpen(true)}
            />
        </>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="py-24 text-center text-[13px] text-[#5E5E5E]">
                    Loading catalog...
                </div>
            }
        >
            <SearchCatalogContent />
        </Suspense>
    );
}
