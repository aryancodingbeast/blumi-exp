'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    LogIn,
    MapPin,
    Package,
    Receipt,
    ShoppingBag,
    Star,
} from 'lucide-react';
import { PastOrder } from '@/types';
import {
    AuthenticatedMarketplaceUser,
    getCurrentUser,
    getPastOrders,
    ratePastOrder,
} from '@/actions/marketplace';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function PastOrdersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] =
        useState<AuthenticatedMarketplaceUser | null>(null);
    const [orders, setOrders] = useState<PastOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'bought' | 'sold'>('bought');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [feedbackDraft, setFeedbackDraft] = useState('');
    const [ratingSaved, setRatingSaved] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getCurrentUser(), getPastOrders()])
            .then(([user, list]) => {
                if (!active) return;
                setCurrentUser(user);
                setOrders(list);
                if (list[0]) setSelectedOrderId(list[0].id);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const filteredOrders = useMemo(
        () => orders.filter((o) => o.type === tab),
        [orders, tab]
    );

    const selectedOrder = useMemo(
        () =>
            filteredOrders.find((o) => o.id === selectedOrderId) ||
            filteredOrders[0] ||
            null,
        [filteredOrders, selectedOrderId]
    );

    const handleRate = async (orderId: string, stars: number) => {
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? { ...o, rating: stars, feedback: feedbackDraft || o.feedback }
                    : o
            )
        );
        setRatingSaved(true);
        setTimeout(() => setRatingSaved(false), 2500);
        await ratePastOrder(orderId, stars, feedbackDraft);
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
                    <h1 className="revclo-page-title">Past Orders</h1>
                </div>

                {/* Sold | Bought Segmented Control (Figma 326:12650) */}
                <div className="flex items-center gap-1.5 bg-[#E6E3DD] p-1 rounded-full border border-[#DCD6CD]">
                    {(['bought', 'sold'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${
                                tab === t
                                    ? 'bg-[#532B21] text-white'
                                    : 'text-[#5E5E5E]'
                            }`}
                        >
                            {t} (
                            {orders.filter((o) => o.type === t).length})
                        </button>
                    ))}
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">
                            Loading your orders from Supabase...
                        </p>
                    </div>
                ) : !currentUser ? (
                    <div className="max-w-[540px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-8 text-center">
                        <Package
                            size={32}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Sign in to view your orders
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Sign in with your account to track bought items, sold closet payouts, and GST invoices.
                        </p>
                        <Link
                            href="/login?callbackUrl=/orders"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <LogIn size={15} />
                            <span>Sign In</span>
                        </Link>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="max-w-[560px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-10 text-center">
                        <ShoppingBag
                            size={32}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[18px] font-bold text-[#161616]">
                            No {tab} orders yet
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1 mb-5">
                            {tab === 'bought'
                                ? 'Explore the verified archive to find your first piece.'
                                : 'Scan and list a piece from your closet to start selling.'}
                        </p>
                        <Link
                            href={tab === 'bought' ? '/search' : '/sell'}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <span>
                                {tab === 'bought'
                                    ? 'Explore Archive'
                                    : 'List a Piece'}
                            </span>
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-desktop-split">
                        {/* Left Column: Orders List (Figma 326:12650) */}
                        <div className="flex flex-col gap-3.5">
                            {filteredOrders.map((ord) => {
                                const isSelected =
                                    selectedOrder?.id === ord.id;
                                return (
                                    <div
                                        key={`${ord.id}-${ord.product_id}`}
                                        onClick={() =>
                                            setSelectedOrderId(ord.id)
                                        }
                                        className={`bg-white rounded-[18px] border p-4 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-[#532B21] ring-2 ring-[#532B21]/15'
                                                : 'border-[#DCD6CD] hover:border-[#8B4736]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between border-b border-[#EFEFEF] pb-2.5 mb-3">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={ord.shop_avatar}
                                                    alt={ord.shop_name}
                                                    className="w-6 h-6 rounded-full object-cover border border-[#CDC8BF]"
                                                />
                                                <span className="text-[12px] font-bold text-[#161616]">
                                                    {ord.shop_name}
                                                </span>
                                                <span className="text-[11px] text-[#7C7C7C]">
                                                    &bull; {ord.placed_date}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#E5F6DF] text-[#007A00] text-[11px] font-bold">
                                                {ord.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3.5">
                                            <img
                                                src={ord.product_image}
                                                alt={ord.product_name}
                                                className="w-16 h-20 rounded-xl object-cover border border-[#CDC8BF] shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold uppercase text-[#8B4736]">
                                                    {ord.product_brand} &bull; Size{' '}
                                                    {ord.product_size}
                                                </p>
                                                <h3 className="text-[15px] font-bold text-[#161616] truncate">
                                                    {ord.product_name}
                                                </h3>
                                                <p className="text-[12px] text-[#5E5E5E] mt-0.5">
                                                    Order {ord.order_number}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-[16px] font-extrabold text-[#161616]">
                                                    ₹
                                                    {ord.total_paid.toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-[#532B21] font-semibold underline">
                                                    Bill Details
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Column: Order Details, Bill Summary & Rating (Figma 326:12445) */}
                        {selectedOrder && (
                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6 flex flex-col gap-5 sticky top-24">
                                <div className="flex items-center justify-between border-b border-[#EFEFEF] pb-3">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C]">
                                            ORDER DETAILS
                                        </span>
                                        <h2 className="text-[18px] font-bold text-[#161616]">
                                            {selectedOrder.order_number}
                                        </h2>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5F6DF] text-[#007A00] text-[12px] font-bold">
                                        <CheckCircle2 size={13} />
                                        {selectedOrder.status}
                                    </span>
                                </div>

                                {/* Delivery Address */}
                                <div className="p-3.5 rounded-xl bg-[#F7F6F3] border border-[#E6E3DD] flex items-start gap-2.5">
                                    <MapPin
                                        size={16}
                                        className="text-[#532B21] shrink-0 mt-0.5"
                                    />
                                    <div className="text-[12px]">
                                        <span className="font-bold text-[#161616] block">
                                            Delivery Address
                                        </span>
                                        <span className="text-[#5E5E5E]">
                                            {selectedOrder.delivery_address}
                                        </span>
                                    </div>
                                </div>

                                {/* Bill Summary (Figma 326:12445) */}
                                <div>
                                    <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#161616] mb-2.5">
                                        <Receipt size={15} />
                                        <span>Bill Summary</span>
                                    </div>

                                    <div className="flex flex-col gap-2 text-[13px] border-t border-b border-[#EFEFEF] py-3">
                                        <div className="flex justify-between text-[#5E5E5E]">
                                            <span>Item Total</span>
                                            <span>
                                                ₹
                                                {selectedOrder.item_total.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[#5E5E5E]">
                                            <span>GST & Buyer Protection</span>
                                            <span>
                                                ₹
                                                {selectedOrder.gst_amount.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[#5E5E5E]">
                                            <span>Shipping Fee</span>
                                            <span>
                                                {selectedOrder.shipping_fee === 0
                                                    ? 'FREE'
                                                    : `₹${selectedOrder.shipping_fee.toFixed(2)}`}
                                            </span>
                                        </div>
                                        {selectedOrder.discount_amount > 0 && (
                                            <div className="flex justify-between text-[#007A00] font-medium">
                                                <span>Archive Discount</span>
                                                <span>
                                                    -₹
                                                    {selectedOrder.discount_amount.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 text-[16px] font-extrabold text-[#161616]">
                                        <span>Total Paid</span>
                                        <span>
                                            ₹
                                            {selectedOrder.total_paid.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Interactive 5-Star Rating (Figma 326:12445) */}
                                <div className="pt-2 border-t border-[#EFEFEF]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[13px] font-bold text-[#161616]">
                                            Rate your experience with{' '}
                                            {selectedOrder.shop_name}
                                        </span>
                                        {ratingSaved && (
                                            <span className="text-[11px] font-bold text-[#007A00]">
                                                Rating saved!
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const active =
                                                (selectedOrder.rating || 0) >=
                                                star;
                                            return (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() =>
                                                        handleRate(
                                                            selectedOrder.id,
                                                            star
                                                        )
                                                    }
                                                    className="p-1.5 rounded-lg hover:bg-[#F7F6F3] transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={22}
                                                        fill={
                                                            active
                                                                ? '#F59E0B'
                                                                : 'none'
                                                        }
                                                        color={
                                                            active
                                                                ? '#F59E0B'
                                                                : '#C6C6C6'
                                                        }
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <input
                                        type="text"
                                        value={feedbackDraft}
                                        onChange={(e) =>
                                            setFeedbackDraft(e.target.value)
                                        }
                                        placeholder={
                                            selectedOrder.feedback ||
                                            'Leave optional feedback on packaging & fit...'
                                        }
                                        className="w-full h-10 px-3.5 rounded-xl bg-[#F7F6F3] border border-[#DCD6CD] text-[12px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
