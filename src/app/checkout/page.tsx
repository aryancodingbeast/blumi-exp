'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { SavedAddress } from '@/types';
import { getSavedAddresses } from '@/actions/marketplace';
import { SEED_ADDRESSES } from '@/lib/revcloSeedData';
import { useCart } from '@/components/CartContext';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();
    const [addresses, setAddresses] = useState<SavedAddress[]>(SEED_ADDRESSES);
    const [selectedAddrId, setSelectedAddrId] = useState<string>(SEED_ADDRESSES[0].id);
    const [placingOrder, setPlacingOrder] = useState<boolean>(false);
    const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

    useEffect(() => {
        getSavedAddresses().then((res) => {
            if (res && res.length > 0) {
                setAddresses(res);
                setSelectedAddrId(res[0].id);
            }
        });
    }, []);

    const subtotal = totalPrice || 21000;
    const gst = Math.round(subtotal * 0.05);
    const shipping = 40;
    const total = subtotal + gst + shipping;

    const handlePlaceOrder = () => {
        setPlacingOrder(true);
        setTimeout(() => {
            clearCart();
            setPlacingOrder(false);
            setOrderSuccess(true);
        }, 700);
    };

    if (orderSuccess) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    padding: '64px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 14,
                }}
            >
                <div
                    style={{
                        width: 68,
                        height: 68,
                        borderRadius: 999,
                        background: 'var(--badge-pristine-bg)',
                        color: 'var(--badge-pristine-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CheckCircle2 size={34} />
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Order Confirmed!</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: 280 }}>
                    Your payment is held safely in RevClo Escrow. The seller has been notified to
                    dispatch your archive piece.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <Link href="/orders" className="revclo-primary-btn">
                        View Order & Bill
                    </Link>
                    <Link href="/" className="revclo-outline-btn">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">Checkout</span>
                <div style={{ width: 36 }} />
            </header>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Delivery Address Selection */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid var(--border-card)',
                        padding: 14,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                        }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                            Select Delivery Address
                        </span>
                        <Link
                            href="/addresses"
                            style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--terracotta-800)',
                            }}
                        >
                            + Manage
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {addresses.map((addr) => {
                            const active = selectedAddrId === addr.id;
                            return (
                                <button
                                    key={addr.id}
                                    type="button"
                                    onClick={() => setSelectedAddrId(addr.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: 12,
                                        borderRadius: 10,
                                        background: active
                                            ? 'var(--terracotta-50)'
                                            : 'var(--bg-canvas)',
                                        border: active
                                            ? '1.5px solid var(--terracotta-800)'
                                            : '1px solid var(--border-sand)',
                                        display: 'flex',
                                        gap: 10,
                                    }}
                                >
                                    <MapPin
                                        size={16}
                                        color="var(--terracotta-800)"
                                        style={{ marginTop: 2, flexShrink: 0 }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                            {addr.label} • {addr.receiver_name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                marginTop: 2,
                                            }}
                                        >
                                            {addr.address_line1}, {addr.city} - {addr.pincode}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Escrow & Payment Summary */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid var(--border-sand)',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        fontSize: '13px',
                    }}
                >
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 4 }}>
                        Order Bill Summary ({items.length || 1} item)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Item total</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GST</span>
                        <span>₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Shipping fee</span>
                        <span>₹{shipping}</span>
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
                        <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--locust-100)',
                        color: 'var(--locust-800)',
                        fontSize: '12px',
                    }}
                >
                    <ShieldCheck size={16} />
                    <span>100% Buyer Protection via RevClo Escrow & Razorpay</span>
                </div>

                <button
                    type="button"
                    disabled={placingOrder}
                    onClick={handlePlaceOrder}
                    className="revclo-primary-btn"
                    style={{ width: '100%', padding: '14px' }}
                >
                    {placingOrder
                        ? 'Processing Escrow Payment...'
                        : `Pay ₹${total.toLocaleString('en-IN')} & Place Order`}
                </button>
            </div>
        </div>
    );
}
