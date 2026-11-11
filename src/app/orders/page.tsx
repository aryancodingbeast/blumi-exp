'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Copy,
    MoreVertical,
    Receipt,
    Search,
    Share2,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import { PastOrder } from '@/types';
import {
    getPastOrders,
    ratePastOrder,
    removeOrderFromHistory,
} from '@/actions/marketplace';
import { SEED_PAST_ORDERS } from '@/lib/revcloSeedData';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<PastOrder[]>(SEED_PAST_ORDERS);
    const [tab, setTab] = useState<'bought' | 'sold'>('bought');
    const [query, setQuery] = useState<string>('');
    const [billOrder, setBillOrder] = useState<PastOrder | null>(null);
    const [menuOrderId, setMenuOrderId] = useState<string | null>(null);
    const [feedbackOrder, setFeedbackOrder] = useState<PastOrder | null>(null);
    const [feedbackText, setFeedbackText] = useState<string>('');
    const [copiedId, setCopiedId] = useState<boolean>(false);

    useEffect(() => {
        getPastOrders().then((res) => {
            if (res && res.length > 0) setOrders(res);
        });
    }, []);

    const handleRate = async (orderId: string, stars: number) => {
        const updated = await ratePastOrder(orderId, stars);
        setOrders([...updated]);
    };

    const handleSaveFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedbackOrder) return;
        const updated = await ratePastOrder(
            feedbackOrder.id,
            feedbackOrder.rating || 5,
            feedbackText
        );
        setOrders([...updated]);
        setFeedbackOrder(null);
        setFeedbackText('');
    };

    const handleRemove = async (orderId: string) => {
        setMenuOrderId(null);
        const updated = await removeOrderFromHistory(orderId);
        setOrders([...updated]);
    };

    const filtered = orders.filter((o) => {
        if (o.type !== tab) return false;
        if (query.trim()) {
            const q = query.toLowerCase();
            return (
                o.product_name.toLowerCase().includes(q) ||
                o.shop_name.toLowerCase().includes(q) ||
                o.order_number.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
            {/* Header matching Figma 270:5235 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">Past Orders</span>
                <div style={{ width: 36 }} />
            </header>

            {/* Sold / Bought Tabs matching Figma 270:5235 */}
            <div
                style={{
                    display: 'flex',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                }}
            >
                <button
                    type="button"
                    onClick={() => setTab('sold')}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        fontSize: '13px',
                        fontWeight: tab === 'sold' ? 700 : 500,
                        color: tab === 'sold' ? 'var(--terracotta-900)' : 'var(--text-muted)',
                        borderBottom:
                            tab === 'sold'
                                ? '2.5px solid var(--terracotta-800)'
                                : '2.5px solid transparent',
                    }}
                >
                    Sold ({orders.filter((o) => o.type === 'sold').length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('bought')}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        fontSize: '13px',
                        fontWeight: tab === 'bought' ? 700 : 500,
                        color: tab === 'bought' ? 'var(--terracotta-900)' : 'var(--text-muted)',
                        borderBottom:
                            tab === 'bought'
                                ? '2.5px solid var(--terracotta-800)'
                                : '2.5px solid transparent',
                    }}
                >
                    Bought ({orders.filter((o) => o.type === 'bought').length})
                </button>
            </div>

            {/* Search by piece or shop */}
            <div style={{ padding: '12px 16px' }}>
                <div className="revclo-search-pill">
                    <Search size={15} color="var(--text-muted)" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by piece or shop..."
                        style={{
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            width: '100%',
                            fontSize: '13px',
                        }}
                    />
                </div>
            </div>

            {/* Order Cards List */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filtered.map((order) => {
                    const ratingPrompt =
                        order.rating >= 4
                            ? "We're glad you loved it"
                            : order.rating > 0
                              ? 'How can we improve?'
                              : 'Rate your experience';

                    return (
                        <div
                            key={order.id}
                            style={{
                                position: 'relative',
                                background: '#ffffff',
                                borderRadius: 16,
                                border: '1px solid var(--border-card)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Shop Header: Thriftitnaa • Siliguri • View shop */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    borderBottom: '1px solid var(--border-sand)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img
                                        src={order.shop_avatar}
                                        alt={order.shop_name}
                                        style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 999,
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
                                            {order.shop_name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {order.shop_location} •{' '}
                                            <Link
                                                href={`/creator/${order.shop_slug}`}
                                                style={{
                                                    color: 'var(--terracotta-800)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                View shop
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMenuOrderId(menuOrderId === order.id ? null : order.id)
                                    }
                                    aria-label="Order menu"
                                    style={{ padding: 4, color: 'var(--text-muted)' }}
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            {/* Context Menu matching 270:5235 */}
                            {menuOrderId === order.id && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 48,
                                        right: 12,
                                        zIndex: 20,
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        border: '1px solid var(--border-sand)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setMenuOrderId(null)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            fontSize: '12px',
                                            borderBottom: '1px solid var(--border-sand)',
                                        }}
                                    >
                                        <Share2 size={13} />
                                        <span>Share shop</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(order.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            fontSize: '12px',
                                            color: '#dc2626',
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        <span>Remove from history</span>
                                    </button>
                                </div>
                            )}

                            {/* Item Row: Quilted handbag ₹180 */}
                            <div style={{ padding: '14px' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <img
                                        src={order.product_image}
                                        alt={order.product_name}
                                        style={{
                                            width: 60,
                                            height: 68,
                                            borderRadius: 10,
                                            objectFit: 'cover',
                                            border: '1px solid var(--border-card)',
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                                {order.product_name}
                                            </span>
                                            <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                                ₹{order.item_price}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '11.5px',
                                                color: 'var(--text-muted)',
                                                marginTop: 2,
                                            }}
                                        >
                                            {order.product_brand} • Size {order.product_size}
                                        </div>

                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginTop: 10,
                                                paddingTop: 8,
                                                borderTop: '1px dashed var(--border-sand)',
                                                fontSize: '11.5px',
                                            }}
                                        >
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                Order placed on {order.placed_date} •{' '}
                                                <strong style={{ color: '#007a00' }}>
                                                    {order.status}
                                                </strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setBillOrder(order)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontWeight: 700,
                                                    color: 'var(--terracotta-800)',
                                                }}
                                            >
                                                <Receipt size={13} />
                                                <span>₹{order.total_paid.toFixed(2)}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive 1-5 Star Rating Bar matching Figma 174:5443 */}
                                <div
                                    style={{
                                        marginTop: 12,
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        background: 'var(--bg-canvas)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span
                                            style={{
                                                fontSize: '11.5px',
                                                fontWeight: 600,
                                                marginRight: 4,
                                            }}
                                        >
                                            Rate
                                        </span>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRate(order.id, star)}
                                                aria-label={`Rate ${star} stars`}
                                            >
                                                <Star
                                                    size={17}
                                                    color={
                                                        star <= order.rating
                                                            ? '#f59e0b'
                                                            : 'var(--border-card)'
                                                    }
                                                    fill={
                                                        star <= order.rating ? '#f59e0b' : 'none'
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {ratingPrompt}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFeedbackOrder(order);
                                                setFeedbackText(order.feedback || '');
                                            }}
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: 'var(--terracotta-800)',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Share feedback
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Expandable Bill Summary Sheet matching Figma 186:3024 */}
            {billOrder && (
                <div className="revclo-backdrop" onClick={() => setBillOrder(null)}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: 12,
                                borderBottom: '1px solid var(--border-sand)',
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Bill Summary</h3>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: '11.5px',
                                        color: 'var(--text-muted)',
                                        marginTop: 2,
                                    }}
                                >
                                    <span>Order ID: {billOrder.order_number}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                typeof navigator !== 'undefined' &&
                                                navigator.clipboard
                                            ) {
                                                navigator.clipboard.writeText(
                                                    billOrder.order_number
                                                );
                                            }
                                            setCopiedId(true);
                                            setTimeout(() => setCopiedId(false), 1500);
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            color: 'var(--terracotta-800)',
                                        }}
                                    >
                                        <Copy size={12} />
                                    </button>
                                    {copiedId && (
                                        <span style={{ color: '#007a00', fontWeight: 600 }}>
                                            Copied!
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button type="button" onClick={() => setBillOrder(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div
                            style={{
                                marginTop: 14,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                fontSize: '13px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Item total</span>
                                <span>₹{billOrder.item_total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>GST & Taxes</span>
                                <span>₹{billOrder.gst_amount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Shipping fee</span>
                                <span>₹{billOrder.shipping_fee.toFixed(2)}</span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    color: '#007a00',
                                }}
                            >
                                <span>Archive Bundle Discount</span>
                                <span>-₹{billOrder.discount_amount.toFixed(2)}</span>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 10,
                                    borderTop: '1px solid var(--border-sand)',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                }}
                            >
                                <span>Total Paid</span>
                                <span>₹{billOrder.total_paid.toFixed(2)}</span>
                            </div>

                            <div
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    borderRadius: 10,
                                    background: '#ffffff',
                                    border: '1px solid var(--border-sand)',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <strong style={{ color: 'var(--text-ink)', display: 'block' }}>
                                    Delivered to:
                                </strong>
                                {billOrder.delivery_address}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Feedback Modal */}
            {feedbackOrder && (
                <div className="revclo-backdrop" onClick={() => setFeedbackOrder(null)}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                                Share feedback for {feedbackOrder.shop_name}
                            </h3>
                            <button type="button" onClick={() => setFeedbackOrder(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form
                            onSubmit={handleSaveFeedback}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            <textarea
                                rows={3}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="How was the packaging, fit, and condition?"
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    borderRadius: 10,
                                    border: '1px solid var(--border-sand)',
                                    fontSize: '13px',
                                }}
                            />
                            <button type="submit" className="revclo-primary-btn">
                                Submit Feedback
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
