'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    Grid2X2,
    Heart,
    Layers,
    MessageCircle,
    Search,
    SlidersHorizontal,
    Sparkles,
    User,
} from 'lucide-react';
import {
    Brand,
    Collection,
    CreatorProfile,
    Product,
} from '@/types';
import {
    AuthenticatedMarketplaceUser,
    toggleProductLike,
} from '@/actions/marketplace';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';
import RevcloProductCard from './RevcloProductCard';
import BottomNavbar from './BottomNavbar';
import FilterSortDrawer, { FilterSortState } from './FilterSortDrawer';
import OnboardingModal from './OnboardingModal';

interface HomeMarketplaceProps {
    initialProducts: Product[];
    brands: Brand[];
    collections: Collection[];
    creators: CreatorProfile[];
    unreadChatsCount?: number;
    currentUser?: AuthenticatedMarketplaceUser | null;
}

const DEFAULT_FILTERS: FilterSortState = {
    sortBy: 'trending',
    category: 'All',
    sizes: [],
    conditions: [],
    brands: [],
    maxPrice: 50000,
};

export default function HomeMarketplace({
    initialProducts,
    brands,
    collections,
    creators,
    unreadChatsCount = 0,
    currentUser = null,
}: HomeMarketplaceProps) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [department, setDepartment] = useState<'Women' | 'Men'>('Women');
    const [viewMode, setViewMode] = useState<'items' | 'outfits'>('items');
    const [searchInput, setSearchInput] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState<FilterSortState>(DEFAULT_FILTERS);

    const handleLikeToggle = async (productId: string, nextLiked: boolean) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId
                    ? {
                          ...p,
                          is_liked: nextLiked,
                          likes_count: Math.max(
                              0,
                              (p.likes_count || 0) + (nextLiked ? 1 : -1)
                          ),
                      }
                    : p
            )
        );
        try {
            await toggleProductLike(productId);
        } catch {
            // optimistic state already updated
        }
    };

    const filteredProducts = useMemo(() => {
        let list = products.filter((p) => {
            if (!p.department) return true;
            return p.department.toLowerCase() === department.toLowerCase();
        });

        // If Men's filter has fewer than 4 tagged items in the live DB, include unisex/outerwear/bottoms so Men's tab is rich
        if (department === 'Men' && list.length < 4) {
            list = products.filter(
                (p) =>
                    p.department === 'Men' ||
                    p.category === 'Outerwear' ||
                    p.category === 'Bottoms' ||
                    p.category === 'Accessories'
            );
        }

        if (filters.category !== 'All') {
            list = list.filter(
                (p) => p.category.toLowerCase() === filters.category.toLowerCase()
            );
        }

        if (filters.sizes.length > 0) {
            const lowerSizes = filters.sizes.map((s) => s.toLowerCase());
            list = list.filter((p) =>
                lowerSizes.includes(String(p.size).toLowerCase())
            );
        }

        if (filters.conditions.length > 0) {
            const lowerConds = filters.conditions.map((c) => c.toLowerCase());
            list = list.filter((p) =>
                lowerConds.includes(String(p.condition).toLowerCase())
            );
        }

        if (filters.brands.length > 0) {
            const lowerBrands = filters.brands.map((b) => b.toLowerCase());
            list = list.filter((p) =>
                lowerBrands.includes(p.brand.toLowerCase())
            );
        }

        if (filters.maxPrice < 50000) {
            list = list.filter((p) => p.price <= filters.maxPrice);
        }

        const copy = [...list];
        switch (filters.sortBy) {
            case 'price_asc':
                copy.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                copy.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                copy.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
                break;
            case 'trust_score':
                copy.sort(
                    (a, b) => (b.trust_score || 90) - (a.trust_score || 90)
                );
                break;
            case 'trending':
            default:
                copy.sort(
                    (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
                );
                break;
        }
        return copy;
    }, [products, department, filters]);

    const topPicks = useMemo(
        () => filteredProducts.slice(0, 10),
        [filteredProducts]
    );

    const recommendedItems = useMemo(
        () =>
            filteredProducts.length > 10
                ? filteredProducts.slice(10, 30)
                : filteredProducts,
        [filteredProducts]
    );

    const loopHighlightItems = useMemo(
        () => products.filter((p) => p.images && p.images.length > 0).slice(0, 10),
        [products]
    );

    const spotlightBrand = brands[0] || null;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInput.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    };

    const activeFilterCount =
        (filters.category !== 'All' ? 1 : 0) +
        filters.sizes.length +
        filters.conditions.length +
        filters.brands.length +
        (filters.maxPrice < 50000 ? 1 : 0);

    return (
        <>
            <OnboardingModal />

            {/* Sticky Top Bar (Mobile Header + Responsive Desktop Filter Toolbar) */}
            <header className="revclo-top-bar">
                {/* Mobile-only top row (< 768px): User Avatar, RevClo Wordmark, Search Pill, Chat Icon */}
                <div className="revclo-top-row revclo-top-row-mobile-only">
                    <Link
                        href={currentUser ? '/closet' : '/login'}
                        className="revclo-avatar-btn"
                        title={
                            currentUser
                                ? `${currentUser.name}'s Closet`
                                : 'Sign In'
                        }
                    >
                        {currentUser?.image ? (
                            <img
                                src={currentUser.image}
                                alt={currentUser.name}
                            />
                        ) : currentUser?.name ? (
                            <span>
                                {currentUser.name.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <User size={16} />
                        )}
                    </Link>

                    <Link
                        href="/"
                        className="revclo-wordmark"
                        aria-label="RevClo Home"
                    >
                        <div
                            style={{
                                width: 88,
                                height: 28,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <img
                                src={REVCLO_ASSETS.wordmarkSprite}
                                alt="RevClo"
                                style={{
                                    position: 'absolute',
                                    width: '215.65%',
                                    height: '583.02%',
                                    left: '-56.98%',
                                    top: '-249.06%',
                                    maxWidth: 'none',
                                }}
                            />
                        </div>
                    </Link>

                    <form
                        onSubmit={handleSearchSubmit}
                        className="revclo-search-pill"
                    >
                        <Search size={14} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search items, brands..."
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                width: '100%',
                                fontSize: 12,
                                color: 'var(--text-ink)',
                            }}
                        />
                    </form>

                    <Link
                        href="/chat"
                        className="revclo-icon-btn"
                        aria-label="Messages"
                    >
                        <MessageCircle size={17} />
                        {unreadChatsCount > 0 && (
                            <span className="revclo-unread-dot" />
                        )}
                    </Link>
                </div>

                {/* Department Switcher + Desktop Quick Category Bar + Item/Outfit Mode Switcher */}
                <div className="revclo-sub-bar">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                        <div
                            className="revclo-dept-tabs shrink-0"
                            role="tablist"
                            aria-label="Department"
                        >
                            {(['Women', 'Men'] as const).map((dept) => (
                                <button
                                    key={dept}
                                    type="button"
                                    role="tab"
                                    aria-selected={department === dept}
                                    onClick={() => setDepartment(dept)}
                                    className={`revclo-dept-tab ${department === dept ? 'active' : ''}`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>

                        {/* Desktop Quick Category Pills */}
                        <div className="hidden md:flex items-center gap-1.5">
                            {(['All', 'Tops', 'Dresses', 'Bottoms', 'Outerwear', 'Accessories'] as const).map(
                                (cat) => {
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
                                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                                active
                                                    ? 'bg-[#161616] text-white'
                                                    : 'bg-white border border-[#DCD6CD] text-[#434343] hover:border-[#532B21]'
                                            }`}
                                        >
                                            {cat === 'All' ? 'All Pieces' : cat}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setFilterOpen(true)}
                            className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCD6CD] hover:border-[#532B21] text-[12px] font-semibold text-[#161616] transition-all"
                        >
                            <SlidersHorizontal size={14} />
                            <span>Filter & Sort</span>
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-[#532B21] text-white text-[10px] flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <div
                            className="revclo-mode-switch"
                            aria-label="Feed Layout Mode"
                        >
                            <button
                                type="button"
                                onClick={() => setViewMode('items')}
                                className={`revclo-mode-btn ${viewMode === 'items' ? 'active' : ''}`}
                                title="Item Grid View"
                            >
                                <Grid2X2 size={14} />
                                <span className="hidden md:inline">Items</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('outfits')}
                                className={`revclo-mode-btn ${viewMode === 'outfits' ? 'active' : ''}`}
                                title="Outfit Editorial View"
                            >
                                <Layers size={14} />
                                <span className="hidden md:inline">Outfits</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="revclo-main-canvas">
                {viewMode === 'items' ? (
                    <>
                        {/* Certified Fits Hero Banner (Figma 71:992 + Desktop Editorial Showcase) */}
                        <div className="certified-fits-card">
                            <img
                                src={REVCLO_ASSETS.certifiedFitsHero}
                                alt="Certified Fits by RevClo"
                                className="certified-fits-bg"
                            />
                            <div className="certified-fits-overlay">
                                <div className="flex items-center justify-between">
                                    <span className="certified-new-pill">
                                        NEW • AI VERIFIED ARCHIVE
                                    </span>
                                    <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[12px] font-medium border border-white/15">
                                        <CheckCircle2 size={13} className="text-[#A8F272]" />
                                        {products.length} Live Authenticated Pieces
                                    </span>
                                </div>

                                <div className="flex items-end justify-between gap-6">
                                    <div>
                                        <h1 className="certified-script-title">
                                            Certified Fits
                                        </h1>
                                        <p className="certified-subtext">
                                            Hand-verified closets, AI condition grading, and real-time Google market pricing across every listing.
                                        </p>
                                    </div>

                                    {/* Desktop Preview Strip inside Hero */}
                                    <div className="hidden lg:flex items-center gap-3">
                                        {topPicks.slice(0, 3).map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/product/${item.id}`}
                                                className="w-[120px] h-[148px] rounded-xl overflow-hidden border border-white/25 bg-black/30 backdrop-blur-md relative group shrink-0"
                                            >
                                                <img
                                                    src={item.images[0]}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white">
                                                    <p className="text-[10px] font-semibold truncate">
                                                        {item.brand}
                                                    </p>
                                                    <p className="text-[11px] font-bold">
                                                        ₹{item.price.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/search?sort=trust_score"
                                        className="certified-cta-btn"
                                    >
                                        Explore Certified Fits
                                        <ArrowUpRight size={14} />
                                    </Link>
                                    <Link
                                        href="/sell"
                                        className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-[12px] font-semibold border border-white/25 transition-all"
                                    >
                                        <Sparkles size={13} />
                                        Scan & List Your Closet
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Who's in the Loop — Real Closets & Live Pieces */}
                        <section className="revclo-section">
                            <div className="revclo-section-header">
                                <h2 className="revclo-section-title">
                                    Who&apos;s in the loop
                                </h2>
                                <Link
                                    href="/search"
                                    className="revclo-section-link"
                                >
                                    View all closets <ChevronRight size={13} />
                                </Link>
                            </div>
                            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-0 pb-1">
                                {loopHighlightItems.map((item, idx) => {
                                    const creator =
                                        creators[idx % Math.max(1, creators.length)];
                                    const href = creator
                                        ? `/creator/${creator.handle}`
                                        : `/product/${item.id}`;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={href}
                                            className="shrink-0 flex flex-col items-center gap-1.5 group"
                                        >
                                            <div className="w-[68px] h-[68px] md:w-[82px] md:h-[82px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#532B21] via-[#C65039] to-[#808B5F] transition-transform group-hover:scale-105">
                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#F2F2F2] bg-[#F7F6F3]">
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-medium text-[#434343] max-w-[74px] md:max-w-[86px] truncate">
                                                @{creator?.handle || item.seller?.handle || 'archive'}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Shop by Category */}
                        <section className="revclo-section">
                            <div className="revclo-section-header">
                                <h2 className="revclo-section-title">
                                    Shop by category
                                </h2>
                                {filters.category !== 'All' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                category: 'All',
                                            }))
                                        }
                                        className="revclo-section-link"
                                    >
                                        Clear ({filters.category})
                                    </button>
                                )}
                            </div>
                            <div className="flex md:grid md:grid-cols-5 gap-2.5 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-0">
                                {REVCLO_ASSETS.categories.map((cat) => {
                                    const isSelected =
                                        filters.category.toLowerCase() ===
                                        cat.slug.toLowerCase();
                                    return (
                                        <button
                                            key={cat.slug}
                                            type="button"
                                            onClick={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    category: isSelected
                                                        ? 'All'
                                                        : cat.slug,
                                                }))
                                            }
                                            className={`shrink-0 w-[108px] md:w-full rounded-[14px] overflow-hidden border transition-all text-left bg-[#F7F6F3] group ${
                                                isSelected
                                                    ? 'border-[#532B21] ring-2 ring-[#532B21]/25'
                                                    : 'border-[#CDC8BF] hover:border-[#8B4736]'
                                            }`}
                                        >
                                            <div className="w-full h-[108px] md:h-[148px] overflow-hidden bg-[#ECE9E2]">
                                                <img
                                                    src={cat.image}
                                                    alt={cat.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="px-2.5 py-2 flex items-center justify-between">
                                                <span className="text-[12px] md:text-[13px] font-semibold text-[#161616]">
                                                    {cat.name}
                                                </span>
                                                <ChevronRight
                                                    size={13}
                                                    className="text-[#7C7C7C]"
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Top Picks From Your Favs */}
                        <section className="revclo-section">
                            <div className="revclo-section-header">
                                <h2 className="revclo-section-title">
                                    Top picks from your favs
                                </h2>
                                <Link
                                    href="/search"
                                    className="revclo-section-link"
                                >
                                    See all ({filteredProducts.length}){' '}
                                    <ChevronRight size={13} />
                                </Link>
                            </div>
                            <div className="revclo-product-grid">
                                {topPicks.map((product) => (
                                    <RevcloProductCard
                                        key={product.id}
                                        product={product}
                                        showPristineBadge
                                        onToggleLike={handleLikeToggle}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Featured Store Spotlight Banner */}
                        {spotlightBrand && (
                            <section className="revclo-section px-4 md:px-0">
                                <Link
                                    href={`/brand/${spotlightBrand.slug}`}
                                    className="block relative h-[210px] md:h-[260px] rounded-[18px] overflow-hidden border border-[#CDC8BF] group"
                                >
                                    <img
                                        src={REVCLO_ASSETS.lethalStoreBanner}
                                        alt={spotlightBrand.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15 p-5 md:p-8 flex flex-col justify-between">
                                        <span className="self-start bg-white/90 text-[#161616] text-[10px] md:text-[11px] font-bold uppercase tracking-[0.06em] px-3 py-1 rounded-full">
                                            FEATURED STORE • {spotlightBrand.items_count || products.length} ITEMS
                                        </span>
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <div className="text-white text-[24px] md:text-[34px] font-bold tracking-tight">
                                                    {spotlightBrand.name}
                                                </div>
                                                <p className="text-white/85 text-[12px] md:text-[14px] max-w-[460px] line-clamp-2 mt-1">
                                                    {spotlightBrand.bio}
                                                </p>
                                            </div>
                                            <span className="shrink-0 px-4 py-2 rounded-full bg-white text-[#161616] text-[12px] md:text-[13px] font-semibold inline-flex items-center gap-1.5">
                                                Visit Store{' '}
                                                <ArrowUpRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </section>
                        )}

                        {/* Collections For You */}
                        <section className="revclo-section">
                            <div className="revclo-section-header">
                                <h2 className="revclo-section-title">
                                    Collections for you
                                </h2>
                                <Link
                                    href="/collection/summer-inspirations"
                                    className="revclo-section-link"
                                >
                                    Explore all <ChevronRight size={13} />
                                </Link>
                            </div>
                            <div className="flex md:grid md:grid-cols-3 gap-3.5 md:gap-5 overflow-x-auto no-scrollbar px-4 md:px-0">
                                {collections.map((col) => (
                                    <Link
                                        key={col.id}
                                        href={`/collection/${col.slug}`}
                                        className="shrink-0 w-[248px] md:w-full rounded-[16px] overflow-hidden border border-[#CDC8BF] bg-[#F7F6F3] group transition-transform hover:-translate-y-1"
                                    >
                                        <div className="relative h-[156px] md:h-[200px] overflow-hidden">
                                            <img
                                                src={col.cover_image}
                                                alt={col.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-3.5 flex flex-col justify-end">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-white/80">
                                                    {col.subtitle ||
                                                        `${col.items_count} PIECES`}
                                                </span>
                                                <div className="text-[17px] md:text-[20px] font-bold text-white leading-tight">
                                                    {col.title}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={col.creator_avatar}
                                                    alt={col.creator_name}
                                                    className="w-6 h-6 rounded-full object-cover border border-[#CDC8BF]"
                                                />
                                                <span className="text-[12px] text-[#5E5E5E]">
                                                    Curated by{' '}
                                                    <strong className="text-[#161616]">
                                                        @{col.creator_handle}
                                                    </strong>
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-[#532B21]">
                                                {col.saves_count} saves
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Recommended For You */}
                        <section className="revclo-section">
                            <div className="revclo-section-header">
                                <h2 className="revclo-section-title">
                                    Recommended for you
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setFilterOpen(true)}
                                    className="revclo-section-link"
                                >
                                    Filter & sort <ChevronRight size={13} />
                                </button>
                            </div>
                            <div className="revclo-product-grid">
                                {recommendedItems.map((product) => (
                                    <RevcloProductCard
                                        key={product.id}
                                        product={product}
                                        onToggleLike={handleLikeToggle}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    /* OUTFIT MODE (Exact Figma 71:1782 Asymmetric Editorial Collage + Desktop Bento Grid) */
                    <section className="revclo-section pt-2 px-0">
                        <div className="revclo-section-header">
                            <div>
                                <h2 className="revclo-section-title">
                                    Curated Outfit Boards
                                </h2>
                                <p className="text-[12px] text-[#5E5E5E] mt-0.5">
                                    Tap any piece in the editorial collage to inspect measurements & shop the look
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFilterOpen(true)}
                                className="revclo-section-link"
                            >
                                Filter Looks <ChevronRight size={13} />
                            </button>
                        </div>

                        {/* Mobile Exact Figma 71:1782 Asymmetric Collage + Desktop Multi-Column Editorial Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-0 sm:px-4 md:px-0">
                            {/* Collage Block 1: Full-width Hero Look (390x272) + 3-up Row (130x140 each) + 2-up Asymmetric Split (259x279 + 2x130x140) */}
                            <div className="bg-white sm:rounded-[20px] overflow-hidden border border-[#DCD6CD] shadow-sm">
                                {/* Row A: Full-bleed Hero Look (Figma 71:1828 - 390x272) */}
                                {filteredProducts[0] && (
                                    <Link
                                        href={`/product/${filteredProducts[0].id}`}
                                        className="block relative w-full h-[272px] md:h-[320px] overflow-hidden border-b border-[#E6E3DD] group"
                                    >
                                        <img
                                            src={filteredProducts[0].images[0]}
                                            alt={filteredProducts[0].title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15 p-4 flex flex-col justify-between">
                                            <span className="self-start px-2.5 py-1 rounded-full bg-[#F2FEDF] text-[#007A00] border border-[#B0C988] text-[10px] font-bold">
                                                FEATURED LOOK • {filteredProducts[0].condition}
                                            </span>
                                            <div className="flex items-end justify-between text-white">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">
                                                        {filteredProducts[0].brand} • Size {filteredProducts[0].size}
                                                    </p>
                                                    <h3 className="text-[16px] font-bold leading-tight">
                                                        {filteredProducts[0].title}
                                                    </h3>
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-white text-[#161616] text-[12px] font-bold">
                                                    ₹{filteredProducts[0].price.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {/* Row B: 3 Equal Squares (Figma 71:1829, 71:1833, 71:1830 - 3 columns x 140px) */}
                                <div className="grid grid-cols-3 border-b border-[#E6E3DD]">
                                    {filteredProducts.slice(1, 4).map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/product/${item.id}`}
                                            className="relative h-[140px] md:h-[168px] border-r last:border-r-0 border-[#E6E3DD] overflow-hidden group"
                                        >
                                            <img
                                                src={item.images[0]}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 to-transparent text-white flex items-center justify-between">
                                                <span className="text-[10px] font-medium truncate">
                                                    {item.size}
                                                </span>
                                                <span className="text-[11px] font-bold">
                                                    ₹{item.price.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Row C: Asymmetric 2/3 Left (259x279) + 1/3 Stacked Right (2 x 130x140) matching Figma 71:1835 + 71:1834 + 71:1831 */}
                                <div className="grid grid-cols-3">
                                    {filteredProducts[4] && (
                                        <Link
                                            href={`/product/${filteredProducts[4].id}`}
                                            className="col-span-2 relative h-[280px] md:h-[320px] border-r border-[#E6E3DD] overflow-hidden group"
                                        >
                                            <img
                                                src={filteredProducts[4].images[0]}
                                                alt={filteredProducts[4].title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
                                                <p className="text-[10px] uppercase tracking-wider text-white/80">
                                                    {filteredProducts[4].brand}
                                                </p>
                                                <p className="text-[14px] font-bold truncate">
                                                    {filteredProducts[4].title}
                                                </p>
                                                <p className="text-[12px] font-semibold text-[#F2FEDF] mt-0.5">
                                                    ₹{filteredProducts[4].price.toLocaleString('en-IN')} • Size {filteredProducts[4].size}
                                                </p>
                                            </div>
                                        </Link>
                                    )}
                                    <div className="col-span-1 flex flex-col">
                                        {filteredProducts.slice(5, 7).map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/product/${item.id}`}
                                                className="relative h-[140px] md:h-[160px] border-b last:border-b-0 border-[#E6E3DD] overflow-hidden group"
                                            >
                                                <img
                                                    src={item.images[0]}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/75 to-transparent text-white flex items-center justify-between">
                                                    <span className="text-[10px]">
                                                        {item.size}
                                                    </span>
                                                    <span className="text-[11px] font-bold">
                                                        ₹{item.price.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Collage Block 2: Full-Bleed Editorial Look Cards (Figma 71:1832 - 390x420) */}
                            <div className="flex flex-col gap-6">
                                {filteredProducts.slice(7, 11).map((item, idx) => {
                                    const companion =
                                        filteredProducts[
                                            (idx + 2) % Math.max(1, filteredProducts.length)
                                        ];
                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-white sm:rounded-[20px] overflow-hidden border border-[#DCD6CD] shadow-sm"
                                        >
                                            <div className="relative h-[360px] md:h-[380px] overflow-hidden group">
                                                <Link href={`/product/${item.id}`}>
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                </Link>
                                                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                                                    <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold">
                                                        Look #{idx + 2} • @{item.seller?.handle || 'archive'}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-full bg-[#361C15] text-white text-[11px] font-bold">
                                                        {item.trust_score || 94}% Verified
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleLikeToggle(
                                                            item.id,
                                                            !item.is_liked
                                                        )
                                                    }
                                                    className={`revclo-heart-btn ${item.is_liked ? 'liked' : ''}`}
                                                    aria-label="Save outfit"
                                                >
                                                    <Heart
                                                        size={15}
                                                        fill={
                                                            item.is_liked
                                                                ? '#dc2626'
                                                                : 'none'
                                                        }
                                                    />
                                                </button>
                                            </div>

                                            <div className="p-3.5 bg-[#F7F6F3] flex items-center justify-between gap-3">
                                                <Link
                                                    href={`/product/${item.id}`}
                                                    className="flex items-center gap-2.5 min-w-0"
                                                >
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.title}
                                                        className="w-11 h-11 rounded-lg object-cover border border-[#CDC8BF] shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-semibold uppercase text-[#7C7C7C] truncate">
                                                            {item.brand} • Size {item.size}
                                                        </p>
                                                        <p className="text-[13px] font-bold text-[#161616] truncate">
                                                            {item.title} — ₹
                                                            {item.price.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                </Link>

                                                {companion && companion.id !== item.id && (
                                                    <Link
                                                        href={`/product/${companion.id}`}
                                                        className="shrink-0 px-3 py-2 rounded-xl bg-white border border-[#DCD6CD] hover:border-[#532B21] text-[11px] font-semibold text-[#161616] flex items-center gap-1.5"
                                                    >
                                                        <span>
                                                            Pair w/ ₹
                                                            {companion.price.toLocaleString(
                                                                'en-IN'
                                                            )}
                                                        </span>
                                                        <ArrowUpRight size={12} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
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
