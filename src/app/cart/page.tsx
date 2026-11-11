'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/components/CartContext';

export default function CartPage() {
    const router = useRouter();
    const { items, removeItem, totalPrice } = useCart();

    const gst = Math.round(totalPrice * 0.05);
    const shipping = items.length > 0 ? 40 : 0;
    const grandTotal = totalPrice + gst + shipping;

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
                <span className="revclo-page-title">Shopping Bag ({items.length})</span>
                <div style={{ width: 36 }} />
            </header>

            {items.length === 0 ? (
                <div
                    style={{
                        padding: '64px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: 999,
                            background: 'var(--terracotta-50)',
                            color: 'var(--terracotta-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ShoppingBag size={26} />
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Your bag is empty</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: 240 }}>
                        Explore Certified Fits and verified closets to add archive pieces to your
                        bag.
                    </p>
                    <Link href="/" className="revclo-primary-btn" style={{ marginTop: 4 }}>
                        Explore Marketplace
                    </Link>
                </div>
            ) : (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {items.map(({ product }) => (
                        <div
                            key={product.id}
                            style={{
                                background: '#ffffff',
                                borderRadius: 14,
                                border: '1px solid var(--border-card)',
                                padding: 12,
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                            }}
                        >
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                style={{
                                    width: 68,
                                    height: 76,
                                    borderRadius: 10,
                                    objectFit: 'cover',
                                    border: '1px solid var(--border-sand)',
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {product.brand}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: 2 }}>
                                    {product.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        marginTop: 2,
                                    }}
                                >
                                    Size: {product.size} • {product.condition}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: 6 }}>
                                    ₹{product.price.toLocaleString('en-IN')}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(product.id)}
                                aria-label="Remove item"
                                style={{ color: '#dc2626', padding: 6 }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {/* Bill Summary Box */}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Item Total</span>
                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>GST (5%)</span>
                            <span>₹{gst.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Express Insured Shipping
                            </span>
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
                            <span>Total Payable</span>
                            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <Link
                        href="/checkout"
                        className="revclo-primary-btn"
                        style={{ width: '100%', padding: '14px' }}
                    >
                        <span>Proceed to Checkout</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
}
