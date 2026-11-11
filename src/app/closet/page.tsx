'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Camera,
    CheckCircle2,
    ExternalLink,
    Heart,
    Loader2,
    LogIn,
    MapPin,
    Package,
    Plus,
    Settings,
    Sparkles,
    Star,
    Trash2,
    User,
} from 'lucide-react';
import { Product } from '@/types';
import {
    AuthenticatedMarketplaceUser,
    deleteRevcloListing,
    getCurrentUser,
    getMarketplaceProducts,
    toggleProductLike,
} from '@/actions/marketplace';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function ClosetProfilePage() {
    const [currentUser, setCurrentUser] =
        useState<AuthenticatedMarketplaceUser | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'closet' | 'sold' | 'wishlist'>(
        'closet'
    );

    const loadClosetData = async () => {
        setLoading(true);
        try {
            const [user, products] = await Promise.all([
                getCurrentUser(),
                getMarketplaceProducts({ includeSold: true }),
            ]);
            setCurrentUser(user);
            setAllProducts(products);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClosetData();
    }, []);

    const myActiveListings = useMemo(() => {
        if (!currentUser) return [];
        return allProducts.filter(
            (p) =>
                p.seller_id === currentUser.id &&
                p.status !== 'SOLD' &&
                p.status !== 'sold'
        );
    }, [allProducts, currentUser]);

    const mySoldListings = useMemo(() => {
        if (!currentUser) return [];
        return allProducts.filter(
            (p) =>
                p.seller_id === currentUser.id &&
                (p.status === 'SOLD' || p.status === 'sold')
        );
    }, [allProducts, currentUser]);

    const myWishlist = useMemo(
        () => allProducts.filter((p) => p.is_liked),
        [allProducts]
    );

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

    const handleDeleteListing = async (productId: string) => {
        setAllProducts((prev) => prev.filter((p) => p.id !== productId));
        try {
            await deleteRevcloListing(productId);
        } catch {
            // ignore
        }
    };

    const displayedProducts =
        activeTab === 'closet'
            ? myActiveListings
            : activeTab === 'sold'
              ? mySoldListings
              : myWishlist;

    return (
        <>
            <header className="revclo-page-header">
                <div>
                    <h1 className="revclo-page-title">
                        {currentUser
                            ? `@${currentUser.handle || 'closet'}`
                            : 'My Closet'}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/orders"
                        className="revclo-outline-btn text-[12px]"
                    >
                        <Package size={14} />
                        <span>Orders</span>
                    </Link>
                    <Link
                        href="/addresses"
                        className="revclo-outline-btn text-[12px] hidden sm:inline-flex"
                    >
                        <MapPin size={14} />
                        <span>Addresses</span>
                    </Link>
                    <Link
                        href="/settings"
                        className="revclo-icon-btn"
                        aria-label="Settings"
                    >
                        <Settings size={17} />
                    </Link>
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2 size={28} className="animate-spin text-[#532B21]" />
                        <p className="text-[13px] font-medium">
                            Loading your closet from Supabase...
                        </p>
                    </div>
                ) : !currentUser ? (
                    /* Clean Unauthenticated State (No Mock Emily User!) */
                    <div className="max-w-[680px] mx-auto my-6 bg-white rounded-[22px] border border-[#DCD6CD] p-6 md:p-10 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-[#F7F6F3] border border-[#DCD6CD] flex items-center justify-center mx-auto mb-4 text-[#532B21]">
                            <User size={28} />
                        </div>
                        <h2 className="text-[22px] font-bold text-[#161616]">
                            Sign in to your RevClo Closet
                        </h2>
                        <p className="text-[13px] md:text-[14px] text-[#5E5E5E] max-w-[440px] mx-auto mt-2 leading-relaxed">
                            Connect your account to list pre-loved pieces with our AI scanner, manage active listings, save wishlist finds, and track orders.
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/login?callbackUrl=/closet"
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#161616] hover:bg-black text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2"
                            >
                                <LogIn size={15} />
                                <span>Sign In with Google</span>
                            </Link>
                            <Link
                                href="/sell"
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#4589FF] hover:bg-[#2F76F6] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2"
                            >
                                <Camera size={15} />
                                <span>Try Guided AI Scanner</span>
                            </Link>
                        </div>

                        {myWishlist.length > 0 && (
                            <div className="mt-10 pt-8 border-t border-[#ECE9E2] text-left">
                                <h3 className="text-[15px] font-bold text-[#161616] mb-4">
                                    Saved Wishlist Items on This Device ({myWishlist.length})
                                </h3>
                                <div className="revclo-product-grid !px-0">
                                    {myWishlist.map((item) => (
                                        <RevcloProductCard
                                            key={item.id}
                                            product={item}
                                            onToggleLike={handleLikeToggle}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Authenticated User Profile & Closet (Figma 287:13578 + Desktop Wide Header) */
                    <>
                        <section className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-7 mb-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Left: User Identity */}
                                <div className="flex items-start sm:items-center gap-4">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#532B21] bg-[#161616] text-white flex items-center justify-center text-[28px] font-bold shrink-0">
                                        {currentUser.image ? (
                                            <img
                                                src={currentUser.image}
                                                alt={currentUser.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>
                                                {currentUser.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-[20px] md:text-[24px] font-bold text-[#161616]">
                                                {currentUser.name}
                                            </h2>
                                            {currentUser.verified && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5F6DF] text-[#007A00] text-[11px] font-semibold">
                                                    <CheckCircle2 size={12} />
                                                    Verified Closet
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-[12px] text-[#5E5E5E] mt-1 flex-wrap">
                                            <span>@{currentUser.handle}</span>
                                            {currentUser.location && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {currentUser.location}
                                                </span>
                                            )}
                                            {currentUser.instagram_url && (
                                                <a
                                                    href={currentUser.instagram_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[#532B21] font-medium hover:underline"
                                                >
                                                    Instagram
                                                    <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>

                                        <p className="text-[13px] text-[#434343] mt-2 max-w-[520px] leading-relaxed">
                                            {currentUser.bio}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Figma 287:13578 Stats Card (Listed | Sold | Rating) + Quick CTAs */}
                                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-4 shrink-0">
                                    <div className="grid grid-cols-3 gap-4 px-5 py-3 rounded-2xl bg-[#F7F6F3] border border-[#DCD6CD] text-center">
                                        <div>
                                            <div className="text-[18px] font-extrabold text-[#161616]">
                                                {myActiveListings.length}
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F] font-medium">
                                                Listed
                                            </div>
                                        </div>
                                        <div className="border-x border-[#DCD6CD] px-4">
                                            <div className="text-[18px] font-extrabold text-[#161616]">
                                                {mySoldListings.length}
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F] font-medium">
                                                Sold
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[18px] font-extrabold text-[#161616] inline-flex items-center gap-1">
                                                <span>4.9</span>
                                                <Star
                                                    size={13}
                                                    fill="#F59E0B"
                                                    color="#F59E0B"
                                                />
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F] font-medium">
                                                Rating
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <Link
                                            href="/sell"
                                            className="px-4 py-2.5 rounded-full bg-[#161616] hover:bg-black text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={14} />
                                            <span>Add Piece to Closet</span>
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="px-4 py-2.5 rounded-full bg-white border border-[#DCD6CD] hover:border-[#161616] text-[#161616] text-[12px] font-semibold"
                                        >
                                            Edit Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Tabs: Closet | Sold | Wishlist (Figma 287:13578) */}
                        <div className="flex items-center justify-between border-b border-[#DCD6CD] mb-6">
                            <div className="flex items-center gap-6">
                                {(
                                    [
                                        {
                                            id: 'closet',
                                            label: `Closet (${myActiveListings.length})`,
                                        },
                                        {
                                            id: 'sold',
                                            label: `Sold (${mySoldListings.length})`,
                                        },
                                        {
                                            id: 'wishlist',
                                            label: `Wishlist (${myWishlist.length})`,
                                        },
                                    ] as const
                                ).map((tab) => {
                                    const active = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`pb-3 text-[14px] font-semibold border-b-2 transition-all ${
                                                active
                                                    ? 'border-[#161616] text-[#161616]'
                                                    : 'border-transparent text-[#7C7C7C] hover:text-[#161616]'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <Link
                                href="/sell"
                                className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0F62FE] pb-2"
                            >
                                <Sparkles size={13} />
                                Scan new garment
                            </Link>
                        </div>

                        {displayedProducts.length === 0 ? (
                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-10 text-center my-4">
                                <p className="text-[15px] font-bold text-[#161616]">
                                    {activeTab === 'closet'
                                        ? 'Your closet has no active listings yet'
                                        : activeTab === 'sold'
                                          ? 'No sold items yet'
                                          : 'Your wishlist is empty'}
                                </p>
                                <p className="text-[13px] text-[#6F6F6F] mt-1 max-w-[380px] mx-auto">
                                    {activeTab === 'wishlist'
                                        ? 'Tap the heart icon on any piece across the marketplace to save it here.'
                                        : 'Use the 3-step AI scanner to capture your garment and get an instant Google market valuation.'}
                                </p>
                                <Link
                                    href={activeTab === 'wishlist' ? '/search' : '/sell'}
                                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                                >
                                    {activeTab === 'wishlist' ? (
                                        <>
                                            <Heart size={14} />
                                            <span>Explore Archive</span>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={14} />
                                            <span>List Your First Piece</span>
                                        </>
                                    )}
                                </Link>
                            </div>
                        ) : (
                            <div className="revclo-product-grid !px-0">
                                {displayedProducts.map((product) => (
                                    <div key={product.id} className="relative group">
                                        <RevcloProductCard
                                            product={product}
                                            showPristineBadge
                                            onToggleLike={handleLikeToggle}
                                        />
                                        {activeTab === 'closet' &&
                                            product.seller_id === currentUser.id && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteListing(product.id)
                                                    }
                                                    title="Delete listing"
                                                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
