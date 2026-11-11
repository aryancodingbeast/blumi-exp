'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import {
    ArrowRight,
    Bookmark,
    ChevronRight,
    Grid,
    Home,
    MessageCircle,
    Search,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import {
    Brand,
    Collection,
    CreatorProfile,
    MarketplaceFilterState,
    Product,
} from '@/types';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';
import RevcloProductCard from './RevcloProductCard';
import FilterSortDrawer from './FilterSortDrawer';
import OnboardingModal from './OnboardingModal';

interface HomeMarketplaceProps {
    initialProducts: Product[];
    brands: Brand[];
    collections: Collection[];
    creators: CreatorProfile[];
    unreadChatsCount?: number;
}

const OUTFIT_VIBES = [
    { id: 'streets', label: 'For the streets', sub: 'Heavyweight leather, denim & Y2K hardware' },
    { id: 'equestrian', label: 'Equestrian peppy', sub: 'Pleated court classics, loafers & knitwear' },
    { id: 'coastal', label: 'Summer Inspirations', sub: 'Sun-baked linen, raffia & tortoiseshell' },
];

export default function HomeMarketplace({
    initialProducts,
    brands,
    collections,
    creators,
    unreadChatsCount = 2,
}: HomeMarketplaceProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'feed' | 'outfits'>('feed');
    const [department, setDepartment] = useState<'Women' | 'Men'>('Women');
    const [selectedVibe, setSelectedVibe] = useState<string>('streets');
    const [searchInput, setSearchInput] = useState<string>('');
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
    const [filters, setFilters] = useState<MarketplaceFilterState>({
        department: 'All',
        sortBy: 'trending',
    });

    const feedContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!feedContainerRef.current) return;
        const sections = feedContainerRef.current.querySelectorAll('.gsap-reveal');
        gsap.fromTo(
            sections,
            { y: 18, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.45,
                stagger: 0.06,
                ease: 'power2.out',
                clearProps: 'transform',
            }
        );
    }, [viewMode, department]);

    const filteredProducts = initialProducts.filter((p) => {
        if (department === 'Men' && p.department === 'Women' && initialProducts.some((x) => x.department === 'Men')) {
            // In Men mode, prioritize Men's items first, but keep universal accessories visible
            if (p.category !== 'Accessories') return false;
        }
        if (filters.category && filters.category !== 'All') {
            if (
                !p.category.toLowerCase().includes(filters.category.toLowerCase()) &&
                !(p.sub_category && p.sub_category.toLowerCase().includes(filters.category.toLowerCase()))
            ) {
                return false;
            }
        }
        if (filters.brands && filters.brands.length > 0) {
            if (!filters.brands.some((b) => b.toLowerCase() === p.brand.toLowerCase())) {
                return false;
            }
        }
        if (filters.sizes && filters.sizes.length > 0) {
            if (!filters.sizes.some((s) => s.toLowerCase() === p.size.toLowerCase())) {
                return false;
            }
        }
        if (typeof filters.minPrice === 'number' && p.price < filters.minPrice) return false;
        if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0 && p.price > filters.maxPrice)
            return false;
        return true;
    });

    const displayProducts = filteredProducts.length > 0 ? filteredProducts : initialProducts;

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInput.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    };

    return (
        <div ref={feedContainerRef} style={{ minHeight: '100vh' }}>
            {/* Top Sticky Navigation Bar (Figma 71:992) */}
            <header className="revclo-top-bar">
                <div className="revclo-top-row">
                    <Link href="/closet" className="revclo-avatar-btn" title="My Closet (@emillyy)">
                        <img src={REVCLO_ASSETS.userTopAvatar} alt="User profile" />
                    </Link>

                    <form onSubmit={handleSearchSubmit} className="revclo-search-pill">
                        <Search size={15} color="var(--text-muted)" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search Vintage Sunglasses, Diesel..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: '12.5px',
                                color: 'var(--text-ink)',
                            }}
                        />
                    </form>

                    {/* Feed vs. Outfit Grid Mode Switcher */}
                    <div className="revclo-mode-switch" role="group" aria-label="View Mode">
                        <button
                            type="button"
                            onClick={() => setViewMode('feed')}
                            className={`revclo-mode-btn ${viewMode === 'feed' ? 'active' : ''}`}
                            title="Home Feed"
                        >
                            <Home size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('outfits')}
                            className={`revclo-mode-btn ${viewMode === 'outfits' ? 'active' : ''}`}
                            title="Certified Fits Grid"
                        >
                            <Grid size={14} />
                        </button>
                    </div>

                    <Link href="/chat" className="revclo-icon-btn" title="Messages">
                        <MessageCircle size={17} />
                        {unreadChatsCount > 0 && <span className="revclo-unread-dot" />}
                    </Link>
                </div>

                {/* Secondary Row: Women / Men Toggle + Onboarding Preview Pill */}
                <div className="revclo-sub-bar">
                    <div className="revclo-dept-tabs">
                        <button
                            type="button"
                            onClick={() => setDepartment('Women')}
                            className={`revclo-dept-tab ${department === 'Women' ? 'active' : ''}`}
                        >
                            Women
                        </button>
                        <button
                            type="button"
                            onClick={() => setDepartment('Men')}
                            className={`revclo-dept-tab ${department === 'Men' ? 'active' : ''}`}
                        >
                            Men
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                            type="button"
                            onClick={() => setIsOnboardingOpen(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 999,
                                background: 'var(--terracotta-50)',
                                border: '1px solid var(--terracotta-200)',
                                color: 'var(--terracotta-800)',
                                fontSize: '11px',
                                fontWeight: 600,
                            }}
                        >
                            <Sparkles size={12} />
                            <span>The Loop</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                borderRadius: 999,
                                background: '#ffffff',
                                border: '1px solid var(--border-sand)',
                                color: 'var(--text-ink)',
                                fontSize: '11px',
                                fontWeight: 600,
                            }}
                        >
                            <SlidersHorizontal size={12} />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>
            </header>

            {viewMode === 'feed' ? (
                /* =========================================================
                   MODE A: REVCLO DISCOVERY FEED (Figma 71:992)
                   ========================================================= */
                <div>
                    {/* 1. Certified Fits Hero Card */}
                    <section className="certified-fits-card gsap-reveal">
                        <img
                            src={REVCLO_ASSETS.certifiedFitsHero}
                            alt="Certified Fits"
                            className="certified-fits-bg"
                        />
                        <div className="certified-fits-overlay">
                            <span className="certified-new-pill">New</span>
                            <div>
                                <h1 className="certified-script-title">Certified Fits</h1>
                                <p className="certified-subtext">
                                    Curated head-to-toe archive looks styled by top closets.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewMode('outfits')}
                                className="certified-cta-btn"
                            >
                                <span>Browse outfits</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    </section>

                    {/* 2. Shop across (5 Categories Horizontal Carousel) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Shop across</h2>
                            <Link href="/search" className="revclo-section-link">
                                View all <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                gap: 12,
                                overflowX: 'auto',
                                padding: '0 16px',
                            }}
                        >
                            {REVCLO_ASSETS.categories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/search?category=${encodeURIComponent(cat.slug)}`}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 6,
                                        minWidth: '76px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '74px',
                                            height: '74px',
                                            borderRadius: '14px',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-card)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <img
                                            src={cat.image}
                                            alt={cat.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: 'var(--text-ink)',
                                        }}
                                    >
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* 3. Shop featured stores ("Lethal" Spotlight + 2-Col Product Grid) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Shop featured stores</h2>
                            <Link href="/brand/lethal" className="revclo-section-link">
                                Explore store <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div style={{ padding: '0 16px', marginBottom: 12 }}>
                            <Link
                                href="/brand/lethal"
                                style={{
                                    display: 'block',
                                    position: 'relative',
                                    height: '126px',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-card)',
                                }}
                            >
                                <img
                                    src={REVCLO_ASSETS.lethalStoreBanner}
                                    alt="Lethal Store"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'brightness(0.75)',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        padding: '14px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        background:
                                            'linear-gradient(to top, rgba(22,22,22,0.82), transparent)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: 'var(--font-script)',
                                            fontSize: '30px',
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            lineHeight: 1,
                                        }}
                                    >
                                        Lethal
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.85)',
                                        }}
                                    >
                                        28 Verified Archive Pieces • 4.9 ★
                                    </span>
                                </div>
                            </Link>
                        </div>

                        <div className="revclo-product-grid">
                            {displayProducts.slice(0, 4).map((product) => (
                                <RevcloProductCard
                                    key={product.id}
                                    product={product}
                                    badgeMode="trust"
                                />
                            ))}
                        </div>
                    </section>

                    {/* 4. Shop featured brands (Diesel, Lethal, QUILTED, Prada) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Shop featured brands</h2>
                            <Link href="/brand/diesel" className="revclo-section-link">
                                All brands <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                gap: 12,
                                overflowX: 'auto',
                                padding: '0 16px',
                            }}
                        >
                            {brands.map((brand) => (
                                <Link
                                    key={brand.id}
                                    href={`/brand/${brand.slug}`}
                                    style={{
                                        minWidth: '152px',
                                        height: '92px',
                                        borderRadius: '14px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: '1px solid var(--border-card)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={brand.hero_image_url}
                                        alt={brand.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            filter: 'brightness(0.68)',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-script)',
                                                fontSize: '28px',
                                                fontWeight: 700,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {brand.name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                opacity: 0.88,
                                                marginTop: 2,
                                            }}
                                        >
                                            {brand.items_count || 24} Finds
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* 5. Most requested collections (Summer Inspiration, Curated Classics, Summer Loving) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Most requested collections</h2>
                            <Link
                                href="/collection/summer-inspirations"
                                className="revclo-section-link"
                            >
                                See all <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                gap: 12,
                                overflowX: 'auto',
                                padding: '0 16px',
                            }}
                        >
                            {collections.map((col) => (
                                <Link
                                    key={col.id}
                                    href={`/collection/${col.slug}`}
                                    style={{
                                        minWidth: '215px',
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        border: '1px solid var(--border-card)',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{ position: 'relative', height: '144px' }}>
                                        <img
                                            src={col.cover_image}
                                            alt={col.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                width: 28,
                                                height: 28,
                                                borderRadius: 999,
                                                background: 'rgba(255,255,255,0.9)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Bookmark size={13} />
                                        </span>
                                    </div>
                                    <div style={{ padding: '10px 12px' }}>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: 'var(--text-ink)',
                                                marginBottom: 6,
                                            }}
                                        >
                                            {col.title}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <img
                                                    src={col.creator_avatar}
                                                    alt={col.creator_name}
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: 999,
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    @{col.creator_handle}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    color: 'var(--terracotta-800)',
                                                }}
                                            >
                                                {col.saves_count} saves
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* 6. Top searches this week (Vintage Sunglasses, Tennis Dress) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Top searches this week</h2>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                                padding: '0 16px',
                            }}
                        >
                            <Link
                                href="/search?q=Vintage+sunglasses&category=Glasses+%26+Sunglasses"
                                style={{
                                    position: 'relative',
                                    height: '118px',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-card)',
                                }}
                            >
                                <img
                                    src={REVCLO_ASSETS.vintageSunglassesSearch}
                                    alt="Vintage Sunglasses"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'brightness(0.78)',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        background:
                                            'linear-gradient(to top, rgba(22,22,22,0.78), transparent)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                        }}
                                    >
                                        Vintage Sunglasses
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: 'rgba(255,255,255,0.8)',
                                        }}
                                    >
                                        Prada • Versace • 90s
                                    </span>
                                </div>
                            </Link>

                            <Link
                                href="/search?q=Tennis+Dress&category=Dresses"
                                style={{
                                    position: 'relative',
                                    height: '118px',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-card)',
                                }}
                            >
                                <img
                                    src={REVCLO_ASSETS.tennisDressSearch}
                                    alt="Tennis Dress"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'brightness(0.78)',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-end',
                                        background:
                                            'linear-gradient(to top, rgba(22,22,22,0.78), transparent)',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                        }}
                                    >
                                        Tennis Dress
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: 'rgba(255,255,255,0.8)',
                                        }}
                                    >
                                        Court Core • Pleated
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </section>

                    {/* 7. Top Creators (Emily Stochl, Jenny Kayne) */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Top Creators</h2>
                            <Link href="/creator/jenny._" className="revclo-section-link">
                                View closets <ChevronRight size={14} />
                            </Link>
                        </div>

                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                gap: 12,
                                overflowX: 'auto',
                                padding: '0 16px',
                            }}
                        >
                            {creators.map((creator) => (
                                <Link
                                    key={creator.id}
                                    href={`/creator/${creator.handle}`}
                                    style={{
                                        minWidth: '142px',
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        border: '1px solid var(--border-card)',
                                        padding: '14px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <img
                                        src={creator.avatar}
                                        alt={creator.name}
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '999px',
                                            objectFit: 'cover',
                                            border: '2px solid var(--terracotta-800)',
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: 'var(--text-ink)',
                                        }}
                                    >
                                        {creator.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        @{creator.handle}
                                    </div>
                                    <span
                                        style={{
                                            marginTop: 2,
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '3px 9px',
                                            borderRadius: 999,
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-sand)',
                                        }}
                                    >
                                        {creator.live_count} Live Finds
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* 8. All Curated Finds Grid */}
                    <section className="revclo-section gsap-reveal">
                        <div className="revclo-section-header">
                            <h2 className="revclo-section-title">Curated Archive Finds</h2>
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(true)}
                                className="revclo-section-link"
                            >
                                Sort & Filter <SlidersHorizontal size={13} />
                            </button>
                        </div>

                        <div className="revclo-product-grid">
                            {displayProducts.map((product) => (
                                <RevcloProductCard
                                    key={product.id}
                                    product={product}
                                    badgeMode="trust"
                                />
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                /* =========================================================
                   MODE B: OUTFIT / EDITORIAL MASONRY GRID (Figma 71:1782)
                   ========================================================= */
                <div style={{ padding: '14px 16px 32px' }}>
                    {/* Vibe Selector Header */}
                    <div
                        className="no-scrollbar"
                        style={{
                            display: 'flex',
                            gap: 8,
                            overflowX: 'auto',
                            marginBottom: 14,
                        }}
                    >
                        {OUTFIT_VIBES.map((vibe) => {
                            const active = selectedVibe === vibe.id;
                            return (
                                <button
                                    key={vibe.id}
                                    type="button"
                                    onClick={() => setSelectedVibe(vibe.id)}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 999,
                                        background: active
                                            ? 'var(--terracotta-920)'
                                            : '#ffffff',
                                        color: active ? '#ffffff' : 'var(--text-ink)',
                                        border: '1px solid var(--border-sand)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {vibe.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Full-bleed Hero Look Tile matching 71:1782 */}
                    <Link
                        href={`/product/${displayProducts[0]?.id || 'prod-quilted-1'}`}
                        style={{
                            display: 'block',
                            position: 'relative',
                            height: '260px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-card)',
                            marginBottom: 10,
                        }}
                    >
                        <img
                            src={REVCLO_ASSETS.outfitGridImage}
                            alt="For the streets editorial outfit"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                background: 'rgba(22,22,22,0.75)',
                                color: '#fff',
                                padding: '4px 10px',
                                borderRadius: 999,
                                fontSize: '11px',
                                fontWeight: 600,
                            }}
                        >
                            {OUTFIT_VIBES.find((v) => v.id === selectedVibe)?.label}
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 12,
                                left: 12,
                                right: 12,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    fontSize: '12px',
                                    fontWeight: 700,
                                }}
                            >
                                ₹499
                            </span>
                            <span
                                style={{
                                    background: 'var(--terracotta-950)',
                                    color: '#fff',
                                    padding: '4px 9px',
                                    borderRadius: 8,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                }}
                            >
                                M
                            </span>
                        </div>
                    </Link>

                    {/* 3-Up Asymmetric Row matching 71:1782 */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 8,
                            marginBottom: 10,
                        }}
                    >
                        {displayProducts.slice(0, 3).map((item) => (
                            <Link
                                key={item.id}
                                href={`/product/${item.id}`}
                                style={{
                                    position: 'relative',
                                    height: '138px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-card)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <img
                                    src={item.images[0]}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 6,
                                        left: 6,
                                        background: 'rgba(255,255,255,0.92)',
                                        padding: '2px 6px',
                                        borderRadius: 6,
                                        fontSize: '10px',
                                        fontWeight: 700,
                                    }}
                                >
                                    ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 6,
                                        right: 6,
                                        background: 'rgba(22,22,22,0.8)',
                                        color: '#fff',
                                        padding: '2px 5px',
                                        borderRadius: 6,
                                        fontSize: '9px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {item.size}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* 2-Up Editorial Row */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.25fr 0.75fr',
                            gap: 8,
                            marginBottom: 10,
                        }}
                    >
                        {displayProducts.slice(3, 5).map((item) => (
                            <Link
                                key={item.id}
                                href={`/product/${item.id}`}
                                style={{
                                    position: 'relative',
                                    height: '184px',
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-card)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <img
                                    src={item.images[0]}
                                    alt={item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        left: 8,
                                        background: 'rgba(255,255,255,0.92)',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                    }}
                                >
                                    ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        background: 'var(--terracotta-950)',
                                        color: '#fff',
                                        padding: '3px 7px',
                                        borderRadius: 6,
                                        fontSize: '10px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {item.size}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Remaining Outfit Pieces */}
                    <div className="revclo-product-grid" style={{ padding: 0, marginTop: 14 }}>
                        {displayProducts.slice(5).map((item) => (
                            <RevcloProductCard key={item.id} product={item} badgeMode="trust" />
                        ))}
                    </div>
                </div>
            )}

            {/* Slide-up Sort & Filter Sheet (Figma 86:4587) */}
            <FilterSortDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                initialFilters={filters}
                onApply={(next) => setFilters(next)}
                onClear={() =>
                    setFilters({
                        department: 'All',
                        category: 'All',
                        brands: [],
                        sizes: [],
                        priceRanges: [],
                        sortBy: 'trending',
                    })
                }
            />

            {/* Onboarding Modal ("The Finds" & "The Loop" — Figma 360:4006 & 369:5219) */}
            <OnboardingModal
                isOpen={isOnboardingOpen}
                onClose={() => setIsOnboardingOpen(false)}
            />
        </div>
    );
}
