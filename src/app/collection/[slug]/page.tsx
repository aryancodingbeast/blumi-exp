'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Loader2, Share2 } from 'lucide-react';
import { Collection, Product } from '@/types';
import {
    getCollectionBySlug,
    getMarketplaceProducts,
    toggleCollectionFollow,
    toggleProductLike,
} from '@/actions/marketplace';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function CollectionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = String(params?.slug || '');

    const [collection, setCollection] = useState<Collection | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [savesCount, setSavesCount] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            getCollectionBySlug(slug),
            getMarketplaceProducts({ collectionSlug: slug }),
            getMarketplaceProducts({ sortBy: 'trending' }),
        ])
            .then(([col, colProducts, allProducts]) => {
                if (!active) return;
                setCollection(col);
                setSavesCount(col?.saves_count || 64);
                setProducts(
                    colProducts.length > 0 ? colProducts : allProducts.slice(0, 12)
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [slug]);

    const handleToggleSave = async () => {
        if (!collection) return;
        const next = !saved;
        setSaved(next);
        setSavesCount((c) => c + (next ? 1 : -1));
        try {
            const res = await toggleCollectionFollow(collection.slug);
            setSaved(res.following);
            setSavesCount(res.savesCount);
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
                        {collection?.title || 'Curated Collection'}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleToggleSave}
                        className={`revclo-outline-btn text-[12px] ${saved ? '!bg-[#532B21] !text-white !border-[#532B21]' : ''}`}
                    >
                        <Bookmark
                            size={14}
                            fill={saved ? 'currentColor' : 'none'}
                        />
                        <span>{saved ? 'Saved' : 'Save'} ({savesCount})</span>
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
                        <p className="text-[13px]">Loading collection...</p>
                    </div>
                ) : (
                    <>
                        {collection && (
                            <section className="relative rounded-[22px] overflow-hidden border border-[#CDC8BF] bg-[#1E1410] text-white mb-8">
                                <img
                                    src={collection.cover_image}
                                    alt={collection.title}
                                    className="w-full h-[210px] md:h-[260px] object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 md:p-8 flex flex-col justify-between">
                                    <span className="self-start px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider">
                                        {collection.subtitle ||
                                            `${products.length} CURATED PIECES`}
                                    </span>

                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                        <div>
                                            <h2 className="text-[26px] md:text-[36px] font-extrabold">
                                                {collection.title}
                                            </h2>
                                            <Link
                                                href={`/creator/${collection.creator_handle}`}
                                                className="inline-flex items-center gap-2 mt-2 text-[13px] text-white/90 hover:underline"
                                            >
                                                <img
                                                    src={
                                                        collection.creator_avatar
                                                    }
                                                    alt={
                                                        collection.creator_name
                                                    }
                                                    className="w-6 h-6 rounded-full object-cover border border-white/40"
                                                />
                                                <span>
                                                    Curated by{' '}
                                                    <strong>
                                                        @{collection.creator_handle}
                                                    </strong>
                                                </span>
                                            </Link>
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

            <BottomNavbar />
        </>
    );
}
