'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ExternalLink,
    Loader2,
    Share2,
    SlidersHorizontal,
} from 'lucide-react';
import { Brand, Product } from '@/types';
import {
    getBrandBySlug,
    getMarketplaceProducts,
    toggleBrandFollow,
    toggleProductLike,
} from '@/actions/marketplace';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import FilterSortDrawer, {
    FilterSortState,
} from '@/components/revclo/FilterSortDrawer';
import BottomNavbar from '@/components/revclo/BottomNavbar';

const DEFAULT_FILTERS: FilterSortState = {
    sortBy: 'trending',
    category: 'All',
    sizes: [],
    conditions: [],
    brands: [],
    maxPrice: 50000,
};

export default function BrandDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = String(params?.slug || '');

    const [brand, setBrand] = useState<Brand | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterSortState>(DEFAULT_FILTERS);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            getBrandBySlug(slug),
            getMarketplaceProducts({ brandSlug: slug }),
        ])
            .then(async ([foundBrand, brandProducts]) => {
                if (!active) return;
                setBrand(foundBrand);
                setFollowersCount(foundBrand?.followers_count || 180);
                if (brandProducts.length > 0) {
                    setProducts(brandProducts);
                } else {
                    const fallback = await getMarketplaceProducts({ sortBy: 'trending' });
                    if (active) setProducts(fallback.slice(0, 12));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [slug]);

    const handleFollow = async () => {
        if (!brand) return;
        const next = !following;
        setFollowing(next);
        setFollowersCount((c) => c + (next ? 1 : -1));
        try {
            const res = await toggleBrandFollow(brand.slug);
            setFollowing(res.following);
            setFollowersCount(res.followersCount);
        } catch {
            // ignore
        }
    };

    const handleLikeToggle = async (productId: string, nextLiked: boolean) => {
        setProducts((prev) =>
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

    return (
        <>
            <header className="revclo-page-header">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <h1 className="revclo-page-title">
                        {brand?.name || slug.toUpperCase()}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        className="revclo-outline-btn text-[12px]"
                    >
                        <SlidersHorizontal size={14} />
                        <span>Filter</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(
                                    window.location.href
                                );
                            }
                        }}
                        className="revclo-icon-btn"
                        aria-label="Share"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">Loading brand archive...</p>
                    </div>
                ) : (
                    <>
                        {brand && (
                            <section className="relative rounded-[22px] overflow-hidden border border-[#CDC8BF] bg-[#1E1410] text-white mb-8">
                                <img
                                    src={brand.hero_image_url}
                                    alt={brand.name}
                                    className="w-full h-[220px] md:h-[280px] object-cover opacity-55"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20 p-5 md:p-8 flex flex-col justify-between">
                                    <span className="self-start px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold uppercase tracking-wider">
                                        VERIFIED ARCHIVE LABEL • {products.length} PIECES
                                    </span>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <h2 className="text-[28px] md:text-[38px] font-extrabold tracking-tight">
                                                {brand.name}
                                            </h2>
                                            <p className="text-[13px] md:text-[14px] text-white/85 max-w-[560px] mt-1 leading-relaxed">
                                                {brand.bio}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleFollow}
                                                className={`px-5 py-2.5 rounded-full text-[12px] font-bold transition-all ${
                                                    following
                                                        ? 'bg-[#F2FEDF] text-[#007A00]'
                                                        : 'bg-white text-[#161616]'
                                                }`}
                                            >
                                                {following
                                                    ? `Following (${followersCount})`
                                                    : `Follow Brand (${followersCount})`}
                                            </button>
                                            {brand.website_url && (
                                                <a
                                                    href={brand.website_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
                                                >
                                                    <span>Website</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        <div className="revclo-product-grid !px-0">
                            {products.map((product) => (
                                <RevcloProductCard
                                    key={product.id}
                                    product={product}
                                    showPristineBadge
                                    onToggleLike={handleLikeToggle}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            <FilterSortDrawer
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                value={filters}
                onChange={setFilters}
                totalResults={products.length}
            />

            <BottomNavbar
                showFilterPill
                onFilterClick={() => setFilterOpen(true)}
            />
        </>
    );
}
