'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Heart,
    Loader2,
    MessageCircle,
    Share2,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Tag,
} from 'lucide-react';
import { Product } from '@/types';
import {
    getProductDetailBundle,
    startOrGetConversation,
    toggleProductLike,
} from '@/actions/marketplace';
import { useCart } from '@/components/CartContext';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = String(params?.id || '');
    const { addItem, items } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [sellerOtherItems, setSellerOtherItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImgIdx, setActiveImgIdx] = useState(0);
    const [trustExpanded, setTrustExpanded] = useState(true);
    const [addedToast, setAddedToast] = useState(false);

    // Make Offer modal state
    const [offerOpen, setOfferOpen] = useState(false);
    const [offerAmount, setOfferAmount] = useState<number>(0);
    const [sendingChat, setSendingChat] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getProductDetailBundle(productId)
            .then(({ product: resolved, sellerOtherItems: sellerItems, related: relatedItems }) => {
                if (!active) return;
                setProduct(resolved);
                if (resolved) {
                    setOfferAmount(Math.max(99, Math.round(resolved.price * 0.88)));
                    setSellerOtherItems(sellerItems);
                    setRelated(relatedItems);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [productId]);

    if (loading) {
        return (
            <div className="py-28 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                <Loader2 size={28} className="animate-spin text-[#532B21]" />
                <p className="text-[13px] font-medium">Loading archive piece...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="py-24 px-4 text-center">
                <h2 className="text-[18px] font-bold text-[#161616]">
                    Piece Not Found
                </h2>
                <Link
                    href="/search"
                    className="mt-4 inline-flex px-5 py-2.5 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                >
                    Browse Catalog
                </Link>
            </div>
        );
    }

    const inBag = items.some((i) => i.product.id === product.id);
    const isSold = product.status === 'SOLD' || product.status === 'sold';

    const handleLike = async () => {
        const next = !product.is_liked;
        setProduct({
            ...product,
            is_liked: next,
            likes_count: Math.max(0, (product.likes_count || 0) + (next ? 1 : -1)),
        });
        try {
            await toggleProductLike(product.id);
        } catch {
            // ignore
        }
    };

    const handleAddToBag = () => {
        if (isSold) return;
        addItem(product);
        setAddedToast(true);
        setTimeout(() => setAddedToast(false), 2400);
    };

    const handleBuyNow = () => {
        if (isSold) return;
        if (!inBag) addItem(product);
        router.push('/checkout');
    };

    const handleMessageSeller = async (customText?: string) => {
        setSendingChat(true);
        try {
            const res = await startOrGetConversation({
                productId: product.id,
                initialMessage: customText,
            });
            if (res.requiresAuth) {
                router.push(`/login?callbackUrl=/product/${product.id}`);
                return;
            }
            if (res.conversationId) {
                router.push(`/chat/${res.conversationId}`);
            } else {
                router.push('/chat');
            }
        } finally {
            setSendingChat(false);
            setOfferOpen(false);
        }
    };

    return (
        <>
            {/* Top Subheader */}
            <header className="revclo-page-header">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="revclo-page-title truncate">
                            {product.title}
                        </h1>
                        <p className="text-[11px] text-[#7C7C7C] truncate">
                            {product.brand} &bull; Size {product.size} &bull; {product.condition}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleLike}
                        className={`revclo-icon-btn ${product.is_liked ? 'text-[#DC2626] border-[#FCA5A5] bg-[#FFF5F5]' : ''}`}
                        aria-label="Save item"
                    >
                        <Heart
                            size={17}
                            fill={product.is_liked ? '#dc2626' : 'none'}
                        />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (navigator.share) {
                                navigator
                                    .share({
                                        title: product.title,
                                        url: window.location.href,
                                    })
                                    .catch(() => {});
                            } else if (navigator.clipboard) {
                                navigator.clipboard.writeText(window.location.href);
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
                {/* 2-Column Split on Desktop, Single Column on Mobile */}
                <div className="revclo-desktop-split mb-12">
                    {/* Left Column: Image Gallery + Thumbnails */}
                    <div className="flex flex-col gap-3 md:sticky md:top-24">
                        <div className="relative aspect-[4/5] w-full rounded-[20px] overflow-hidden bg-[#F7F6F3] border border-[#CDC8BF]">
                            <img
                                src={
                                    product.images[activeImgIdx] ||
                                    product.images[0]
                                }
                                alt={product.title}
                                className="w-full h-full object-cover"
                            />

                            <span className="revclo-trust-pill !top-3.5 !left-3.5 !px-3 !py-1.5 !text-[12px]">
                                <ShieldCheck size={14} className="text-[#A8F272]" />
                                {product.trust_score || 94}% AI Trust
                            </span>

                            <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-[#F2FEDF] text-[#007A00] border border-[#B0C988] text-[11px] font-bold">
                                {product.condition}
                            </span>

                            {isSold && (
                                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                    <span className="px-6 py-2.5 rounded-full bg-white text-[#161616] text-[14px] font-extrabold uppercase tracking-wider">
                                        SOLD OUT
                                    </span>
                                </div>
                            )}
                        </div>

                        {product.images.length > 1 && (
                            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImgIdx(idx)}
                                        className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                                            activeImgIdx === idx
                                                ? 'border-[#532B21] scale-[1.02]'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Product Info, AI Trust Breakdown, Seller Card & Actions */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <Link
                                    href={`/brand/${product.brand_slug || product.brand.toLowerCase()}`}
                                    className="text-[12px] font-bold uppercase tracking-wider text-[#8B4736] hover:underline"
                                >
                                    {product.brand}
                                </Link>
                                <span className="text-[12px] text-[#7C7C7C]">
                                    {product.likes_count || 14} saves
                                </span>
                            </div>

                            <h2 className="text-[22px] md:text-[26px] font-bold text-[#161616] leading-tight">
                                {product.title}
                            </h2>

                            <div className="flex items-baseline gap-3 mt-3">
                                <span className="text-[26px] font-extrabold text-[#161616]">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </span>
                                {product.original_price &&
                                    product.original_price > product.price && (
                                        <>
                                            <span className="text-[14px] text-[#8C8C8C] line-through">
                                                ₹
                                                {product.original_price.toLocaleString(
                                                    'en-IN'
                                                )}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E5F6DF] text-[#007A00] text-[11px] font-bold">
                                                {Math.round(
                                                    ((product.original_price -
                                                        product.price) /
                                                        product.original_price) *
                                                        100
                                                )}
                                                % OFF MRP
                                            </span>
                                        </>
                                    )}
                            </div>

                            {/* Key Specs Grid */}
                            <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-[#EFEFEF]">
                                <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E6E3DD]">
                                    <span className="text-[10px] uppercase text-[#7C7C7C] font-semibold block">
                                        Size
                                    </span>
                                    <span className="text-[13px] font-bold text-[#161616]">
                                        {product.size}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E6E3DD]">
                                    <span className="text-[10px] uppercase text-[#7C7C7C] font-semibold block">
                                        Condition
                                    </span>
                                    <span className="text-[13px] font-bold text-[#007A00]">
                                        {product.condition}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-[#F7F6F3] border border-[#E6E3DD]">
                                    <span className="text-[10px] uppercase text-[#7C7C7C] font-semibold block">
                                        Category
                                    </span>
                                    <span className="text-[13px] font-bold text-[#161616] truncate block">
                                        {product.sub_category || product.category}
                                    </span>
                                </div>
                            </div>

                            {/* Primary Action Buttons */}
                            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                                <button
                                    type="button"
                                    disabled={isSold}
                                    onClick={handleAddToBag}
                                    className="flex-1 h-12 rounded-xl bg-[#532B21] hover:bg-[#361C15] disabled:opacity-50 text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
                                >
                                    {addedToast ? (
                                        <>
                                            <Check size={16} />
                                            <span>Added to Bag</span>
                                        </>
                                    ) : inBag ? (
                                        <>
                                            <ShoppingBag size={16} />
                                            <span>In Your Bag • Add Another</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={16} />
                                            <span>
                                                Add to Bag • ₹
                                                {product.price.toLocaleString('en-IN')}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {!isSold && (
                                    <button
                                        type="button"
                                        onClick={handleBuyNow}
                                        className="flex-1 h-12 rounded-xl bg-[#161616] hover:bg-black text-white text-[14px] font-semibold transition-all"
                                    >
                                        Buy Now
                                    </button>
                                )}
                            </div>

                            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setOfferOpen(true)}
                                    className="h-10 rounded-xl bg-[#F7F6F3] hover:bg-[#ECE9E2] border border-[#DCD6CD] text-[12px] font-semibold text-[#161616] flex items-center justify-center gap-1.5"
                                >
                                    <Tag size={14} />
                                    <span>Make an Offer</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={sendingChat}
                                    onClick={() => handleMessageSeller()}
                                    className="h-10 rounded-xl bg-[#F7F6F3] hover:bg-[#ECE9E2] border border-[#DCD6CD] text-[12px] font-semibold text-[#161616] flex items-center justify-center gap-1.5"
                                >
                                    <MessageCircle size={14} />
                                    <span>Ask Seller</span>
                                </button>
                            </div>
                        </div>

                        {/* AI Trust Score Card (Figma 80:2022) */}
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setTrustExpanded((e) => !e)}
                                className="w-full p-4 md:p-5 flex items-center justify-between text-left bg-[#FBF9F6]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#361C15] text-white flex items-center justify-center font-extrabold text-[13px]">
                                        {product.trust_score || 94}%
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-[#161616] flex items-center gap-1.5">
                                            <span>RevClo AI Trust Verification</span>
                                            <Sparkles
                                                size={13}
                                                className="text-[#C65039]"
                                            />
                                        </div>
                                        <p className="text-[11px] text-[#5E5E5E]">
                                            Photo consistency, label check & condition verified
                                        </p>
                                    </div>
                                </div>
                                {trustExpanded ? (
                                    <ChevronUp size={17} />
                                ) : (
                                    <ChevronDown size={17} />
                                )}
                            </button>

                            {trustExpanded && (
                                <div className="p-4 md:p-5 pt-2 border-t border-[#EFEFEF] flex flex-col gap-2.5 text-[12px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#5E5E5E]">
                                            Multi-Angle Photo Consistency
                                        </span>
                                        <span className="font-semibold text-[#007A00] inline-flex items-center gap-1">
                                            <CheckCircle2 size={13} /> Passed
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#5E5E5E]">
                                            Brand & Fabric Grading
                                        </span>
                                        <span className="font-semibold text-[#007A00] inline-flex items-center gap-1">
                                            <CheckCircle2 size={13} /> Verified ({product.brand})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#5E5E5E]">
                                            Buyer Protection Escrow
                                        </span>
                                        <span className="font-semibold text-[#161616]">
                                            100% Full Refund Guarantee
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product Description */}
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5">
                            <h3 className="text-[14px] font-bold text-[#161616] mb-2">
                                Garment Notes & Details
                            </h3>
                            <p className="text-[13px] text-[#434343] whitespace-pre-line leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Real Seller Closet Card */}
                        {product.seller && (
                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 flex items-center justify-between gap-4">
                                <Link
                                    href={`/creator/${product.seller.handle || product.seller_id}`}
                                    className="flex items-center gap-3.5 min-w-0"
                                >
                                    <img
                                        src={product.seller.image || product.images[0]}
                                        alt={product.seller.name}
                                        className="w-12 h-12 rounded-full object-cover border border-[#CDC8BF] shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[14px] font-bold text-[#161616] truncate">
                                                {product.seller.name}
                                            </span>
                                            <CheckCircle2
                                                size={13}
                                                className="text-[#007A00] shrink-0"
                                            />
                                        </div>
                                        <p className="text-[12px] text-[#5E5E5E] truncate">
                                            @{product.seller.handle} &bull; Ships within 24h
                                        </p>
                                    </div>
                                </Link>

                                <Link
                                    href={`/creator/${product.seller.handle || product.seller_id}`}
                                    className="shrink-0 px-3.5 py-2 rounded-xl bg-[#F7F6F3] border border-[#DCD6CD] hover:border-[#161616] text-[12px] font-semibold text-[#161616]"
                                >
                                    View Closet
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* More from this Closet */}
                {sellerOtherItems.length > 0 && (
                    <section className="revclo-section">
                        <div className="revclo-section-header">
                            <h3 className="revclo-section-title">
                                More from {product.seller?.name || 'this closet'}
                            </h3>
                            <Link
                                href={`/creator/${product.seller?.handle || product.seller_id}`}
                                className="revclo-section-link"
                            >
                                See full closet
                            </Link>
                        </div>
                        <div className="revclo-product-grid">
                            {sellerOtherItems.map((item) => (
                                <RevcloProductCard
                                    key={item.id}
                                    product={item}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Related Pieces */}
                {related.length > 0 && (
                    <section className="revclo-section">
                        <div className="revclo-section-header">
                            <h3 className="revclo-section-title">
                                Similar archive pieces
                            </h3>
                            <Link href="/search" className="revclo-section-link">
                                Browse all
                            </Link>
                        </div>
                        <div className="revclo-product-grid">
                            {related.map((item) => (
                                <RevcloProductCard
                                    key={item.id}
                                    product={item}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Make an Offer Modal */}
            {offerOpen && (
                <div
                    className="revclo-backdrop"
                    onClick={() => setOfferOpen(false)}
                >
                    <div
                        className="revclo-sheet p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-[17px] font-bold text-[#161616] mb-1">
                            Make an Offer on {product.title}
                        </h3>
                        <p className="text-[12px] text-[#5E5E5E] mb-4">
                            Listed at ₹{product.price.toLocaleString('en-IN')}. Send your offer directly to @{product.seller?.handle || 'seller'}.
                        </p>

                        <div className="flex gap-2 mb-4">
                            {[0.9, 0.85, 0.8].map((pct) => {
                                const suggested = Math.max(
                                    99,
                                    Math.round((product.price * pct) / 10) * 10
                                );
                                return (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setOfferAmount(suggested)}
                                        className={`flex-1 py-2 rounded-xl border text-[12px] font-bold ${
                                            offerAmount === suggested
                                                ? 'bg-[#161616] text-white border-[#161616]'
                                                : 'bg-white text-[#161616] border-[#DCD6CD]'
                                        }`}
                                    >
                                        ₹{suggested.toLocaleString('en-IN')} (
                                        {Math.round((1 - pct) * 100)}% off)
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-4">
                            <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                Your Offer (₹)
                            </label>
                            <input
                                type="number"
                                value={offerAmount}
                                onChange={(e) =>
                                    setOfferAmount(Number(e.target.value))
                                }
                                className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#DCD6CD] text-[16px] font-bold outline-none focus:border-[#161616]"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={sendingChat}
                            onClick={() =>
                                handleMessageSeller(
                                    `Hi! Would you accept ₹${offerAmount.toLocaleString('en-IN')} for ${product.title}? Ready to pay immediately.`
                                )
                            }
                            className="w-full h-12 rounded-xl bg-[#161616] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
                        >
                            {sendingChat ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <span>
                                    Send Offer of ₹
                                    {offerAmount.toLocaleString('en-IN')}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <BottomNavbar />
        </>
    );
}
