'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    ShoppingBag,
    Trash2,
} from 'lucide-react';
import { useCart } from '@/components/CartContext';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function CartBagPage() {
    const router = useRouter();
    const { items, removeItem, clearCart, totalPrice } = useCart();

    const gst = Math.round(totalPrice * 0.05);
    const shipping = totalPrice >= 999 || totalPrice === 0 ? 0 : 49;
    const grandTotal = totalPrice + gst + shipping;

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
                        Shopping Bag ({items.length})
                    </h1>
                </div>

                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={clearCart}
                        className="text-[12px] font-semibold text-[#8B4736] underline"
                    >
                        Clear Bag
                    </button>
                )}
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {items.length === 0 ? (
                    <div className="max-w-[540px] mx-auto my-10 bg-white rounded-[22px] border border-[#DCD6CD] p-10 text-center">
                        <ShoppingBag
                            size={36}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Your bag is empty
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Explore verified closets and add 1-of-1 archive pieces to your bag.
                        </p>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <span>Browse Archive Catalog</span>
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-desktop-split">
                        {/* Left Column: Bag Items */}
                        <div className="flex flex-col gap-3.5">
                            {items.map(({ product }) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-[18px] border border-[#DCD6CD] p-4 flex items-center gap-4"
                                >
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="w-20 h-24 rounded-xl overflow-hidden border border-[#CDC8BF] shrink-0 bg-[#F7F6F3]"
                                    >
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold uppercase text-[#8B4736]">
                                            {product.brand} &bull; Size{' '}
                                            {product.size}
                                        </p>
                                        <Link
                                            href={`/product/${product.id}`}
                                            className="text-[15px] font-bold text-[#161616] truncate block hover:underline"
                                        >
                                            {product.title}
                                        </Link>
                                        <p className="text-[12px] text-[#007A00] font-semibold mt-0.5">
                                            {product.condition} &bull; 1/1 Piece
                                        </p>
                                        <p className="text-[16px] font-extrabold text-[#161616] mt-1">
                                            ₹
                                            {product.price.toLocaleString(
                                                'en-IN'
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(product.id)}
                                        className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6 flex flex-col gap-4 sticky top-24">
                            <h2 className="text-[16px] font-bold text-[#161616]">
                                Order Summary
                            </h2>

                            <div className="flex flex-col gap-2.5 text-[13px] border-t border-b border-[#EFEFEF] py-3.5">
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>
                                        Subtotal ({items.length} item
                                        {items.length > 1 ? 's' : ''})
                                    </span>
                                    <span className="font-semibold text-[#161616]">
                                        ₹{totalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>Buyer Protection & GST (5%)</span>
                                    <span>₹{gst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>Delhivery Express Shipping</span>
                                    <span className="font-semibold text-[#007A00]">
                                        {shipping === 0
                                            ? 'FREE'
                                            : `₹${shipping}`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[18px] font-extrabold text-[#161616]">
                                <span>Total Payable</span>
                                <span>
                                    ₹{grandTotal.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#F2FEDF]/60 border border-[#B0C988] flex items-center gap-2 text-[12px] text-[#1D4D0F]">
                                <ShieldCheck size={16} className="shrink-0" />
                                <span>
                                    Protected by RevClo Escrow until your package is delivered and verified.
                                </span>
                            </div>

                            <Link
                                href="/checkout"
                                className="h-12 rounded-xl bg-[#161616] hover:bg-black text-white text-[14px] font-semibold flex items-center justify-center gap-2"
                            >
                                <span>Proceed to Checkout</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
