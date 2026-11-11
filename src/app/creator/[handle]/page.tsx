'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Loader2,
    MapPin,
    MessageCircle,
    Share2,
} from 'lucide-react';
import { CreatorProfile, Product } from '@/types';
import {
    getCreatorByHandle,
    getMarketplaceProducts,
    startOrGetConversation,
    toggleProductLike,
} from '@/actions/marketplace';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function CreatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const handle = decodeURIComponent(String(params?.handle || ''));

    const [creator, setCreator] = useState<CreatorProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'sold'>('live');
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            getCreatorByHandle(handle),
            getMarketplaceProducts({ includeSold: true }),
        ])
            .then(([foundCreator, allProducts]) => {
                if (!active) return;
                setCreator(foundCreator);
                if (foundCreator) {
                    const matched = allProducts.filter(
                        (p) =>
                            p.seller_id === foundCreator.id ||
                            p.seller?.handle?.toLowerCase() ===
                                foundCreator.handle.toLowerCase()
                    );
                    setProducts(matched.length > 0 ? matched : allProducts.slice(0, 8));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [handle]);

    const liveItems = useMemo(
        () =>
            products.filter(
                (p) => p.status !== 'SOLD' && p.status !== 'sold'
            ),
        [products]
    );
    const soldItems = useMemo(
        () =>
            products.filter(
                (p) => p.status === 'SOLD' || p.status === 'sold'
            ),
        [products]
    );

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

    const handleMessageCreator = async () => {
        const firstProduct = liveItems[0] || products[0];
        if (!firstProduct) {
            router.push('/chat');
            return;
        }
        const res = await startOrGetConversation({
            productId: firstProduct.id,
        });
        if (res.requiresAuth) {
            router.push(`/login?callbackUrl=/creator/${handle}`);
            return;
        }
        router.push(res.conversationId ? `/chat/${res.conversationId}` : '/chat');
    };

    const shownProducts = activeTab === 'live' ? liveItems : soldItems;

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
                        @{creator?.handle || handle}
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.href);
                        }
                    }}
                    className="revclo-icon-btn"
                    aria-label="Share closet"
                >
                    <Share2 size={16} />
                </button>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">Loading creator closet...</p>
                    </div>
                ) : !creator ? (
                    <div className="py-20 text-center">
                        <p className="text-[16px] font-bold">Closet not found</p>
                        <Link
                            href="/"
                            className="mt-3 inline-block underline text-[13px]"
                        >
                            Return Home
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Creator Profile Header Card (Figma 98:3346 + Desktop Wide Layout) */}
                        <section className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-7 mb-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start sm:items-center gap-4">
                                    <img
                                        src={creator.avatar}
                                        alt={creator.name}
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#532B21] shrink-0"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-[20px] md:text-[24px] font-bold text-[#161616]">
                                                {creator.name}
                                            </h2>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5F6DF] text-[#007A00] text-[11px] font-semibold">
                                                <CheckCircle2 size={12} />
                                                Verified Seller
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-[12px] text-[#5E5E5E] mt-1 flex-wrap">
                                            <span>@{creator.handle}</span>
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin size={12} />
                                                {creator.location}
                                            </span>
                                            {creator.instagram_url && (
                                                <a
                                                    href={creator.instagram_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[#532B21] font-semibold hover:underline"
                                                >
                                                    Instagram
                                                    <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>

                                        <p className="text-[13px] text-[#434343] mt-2 max-w-[540px] leading-relaxed">
                                            {creator.bio}
                                        </p>

                                        {creator.featured_brands.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap mt-3">
                                                {creator.featured_brands.map(
                                                    (b) => (
                                                        <Link
                                                            key={b}
                                                            href={`/brand/${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                                            className="px-2.5 py-1 rounded-full bg-[#F7F6F3] border border-[#DCD6CD] text-[11px] font-semibold text-[#532B21]"
                                                        >
                                                            {b}
                                                        </Link>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
                                    <div className="grid grid-cols-3 gap-4 px-5 py-3 rounded-2xl bg-[#F7F6F3] border border-[#DCD6CD] text-center">
                                        <div>
                                            <div className="text-[17px] font-extrabold text-[#161616]">
                                                {liveItems.length}
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Live
                                            </div>
                                        </div>
                                        <div className="border-x border-[#DCD6CD] px-4">
                                            <div className="text-[17px] font-extrabold text-[#161616]">
                                                {soldItems.length}
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Sold
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[17px] font-extrabold text-[#161616]">
                                                {creator.followers_count +
                                                    (following ? 1 : 0)}
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Followers
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFollowing((f) => !f)
                                            }
                                            className={`px-5 py-2.5 rounded-full text-[12px] font-semibold transition-all ${
                                                following
                                                    ? 'bg-[#E5F6DF] text-[#007A00] border border-[#B0C988]'
                                                    : 'bg-[#532B21] text-white'
                                            }`}
                                        >
                                            {following
                                                ? 'Following Closet'
                                                : 'Follow Closet'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMessageCreator}
                                            className="px-4 py-2.5 rounded-full bg-white border border-[#DCD6CD] hover:border-[#161616] text-[12px] font-semibold text-[#161616] inline-flex items-center gap-1.5"
                                        >
                                            <MessageCircle size={14} />
                                            <span>Message</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Tabs */}
                        <div className="flex items-center gap-6 border-b border-[#DCD6CD] mb-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('live')}
                                className={`pb-3 text-[14px] font-semibold border-b-2 ${
                                    activeTab === 'live'
                                        ? 'border-[#161616] text-[#161616]'
                                        : 'border-transparent text-[#7C7C7C]'
                                }`}
                            >
                                Live Closet ({liveItems.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('sold')}
                                className={`pb-3 text-[14px] font-semibold border-b-2 ${
                                    activeTab === 'sold'
                                        ? 'border-[#161616] text-[#161616]'
                                        : 'border-transparent text-[#7C7C7C]'
                                }`}
                            >
                                Sold Archive ({soldItems.length})
                            </button>
                        </div>

                        <div className="revclo-product-grid !px-0">
                            {shownProducts.map((product) => (
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

            <BottomNavbar />
        </>
    );
}
