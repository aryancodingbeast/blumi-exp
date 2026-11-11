'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    AlertCircle,
    ArrowLeft,
    ChevronRight,
    FileText,
    LogOut,
    MapPin,
    Package,
    ShieldCheck,
    UserX,
    X,
} from 'lucide-react';
import { DEFAULT_DEMO_USER, REVCLO_ASSETS } from '@/lib/revcloSeedData';

export default function SettingsPage() {
    const router = useRouter();
    const [activeModal, setActiveModal] = useState<
        'none' | 'report' | 'policy' | 'verification' | 'blocked'
    >('none');
    const [reportCategory, setReportCategory] = useState<string>('Order or Delivery Issue');
    const [reportText, setReportText] = useState<string>('');
    const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);

    const handleReportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setReportSubmitted(true);
        setTimeout(() => {
            setReportSubmitted(false);
            setReportText('');
            setActiveModal('none');
        }, 1200);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
            {/* Top Bar matching Figma 165:5431 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">Settings</span>
                <div style={{ width: 36 }} />
            </header>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Profile Summary Card */}
                <Link
                    href="/closet"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid var(--border-card)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src={DEFAULT_DEMO_USER.image}
                            alt={DEFAULT_DEMO_USER.name}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 999,
                                objectFit: 'cover',
                            }}
                        />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700 }}>
                                {DEFAULT_DEMO_USER.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                @{DEFAULT_DEMO_USER.handle} • View Closet
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                </Link>

                {/* Primary Settings Group */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid var(--border-sand)',
                        overflow: 'hidden',
                    }}
                >
                    <Link
                        href="/orders"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                            borderBottom: '1px solid var(--border-sand)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Package size={18} color="var(--terracotta-800)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Orders</span>
                        </div>
                        <ChevronRight size={17} color="var(--text-muted)" />
                    </Link>

                    <Link
                        href="/addresses"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                            borderBottom: '1px solid var(--border-sand)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <MapPin size={18} color="var(--terracotta-800)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Addresses</span>
                        </div>
                        <ChevronRight size={17} color="var(--text-muted)" />
                    </Link>

                    <button
                        type="button"
                        onClick={() => setActiveModal('verification')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                            borderBottom: '1px solid var(--border-sand)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={18} color="var(--terracotta-800)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Verification</span>
                        </div>
                        <span className="revclo-pristine-pill" style={{ position: 'static' }}>
                            Verified
                        </span>
                    </button>

                    {/* Linked with Google & Apple matching 165:5431 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                            borderBottom: '1px solid var(--border-sand)',
                        }}
                    >
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>Linked with</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img
                                src={REVCLO_ASSETS.googleIcon}
                                alt="Google"
                                style={{ width: 22, height: 22, objectFit: 'contain' }}
                            />
                            <img
                                src={REVCLO_ASSETS.appleIcon}
                                alt="Apple"
                                style={{ width: 22, height: 22, objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setActiveModal('blocked')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <UserX size={18} color="var(--text-secondary)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Blocked Users</span>
                        </div>
                        <ChevronRight size={17} color="var(--text-muted)" />
                    </button>
                </div>

                {/* Support & Legal Group */}
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid var(--border-sand)',
                        overflow: 'hidden',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setActiveModal('report')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                            borderBottom: '1px solid var(--border-sand)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <AlertCircle size={18} color="var(--terracotta-800)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                Report a problem
                            </span>
                        </div>
                        <ChevronRight size={17} color="var(--text-muted)" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveModal('policy')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 16px',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FileText size={18} color="var(--text-secondary)" />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>User Policy</span>
                        </div>
                        <ChevronRight size={17} color="var(--text-muted)" />
                    </button>
                </div>

                {/* App Version & Logout Pill matching 165:5431 */}
                <div
                    style={{
                        marginTop: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: 999,
                            background: '#ffffff',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            fontSize: '14px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>

                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        App Version v1.2.01
                    </span>
                </div>
            </div>

            {/* Report a Problem Modal matching Figma 178:5309 */}
            {activeModal === 'report' && (
                <div className="revclo-backdrop" onClick={() => setActiveModal('none')}>
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
                                marginBottom: 14,
                            }}
                        >
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Report a problem</h3>
                            <button type="button" onClick={() => setActiveModal('none')}>
                                <X size={18} />
                            </button>
                        </div>

                        {reportSubmitted ? (
                            <div
                                style={{
                                    padding: '28px 16px',
                                    textAlign: 'center',
                                    color: '#007a00',
                                    fontWeight: 600,
                                }}
                            >
                                Thank you! Our trust & safety team has received your report.
                            </div>
                        ) : (
                            <form
                                onSubmit={handleReportSubmit}
                                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            marginBottom: 6,
                                        }}
                                    >
                                        Choose a category
                                    </label>
                                    <select
                                        value={reportCategory}
                                        onChange={(e) => setReportCategory(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid var(--border-sand)',
                                            background: '#ffffff',
                                            fontSize: '13px',
                                        }}
                                    >
                                        <option>Order or Delivery Issue</option>
                                        <option>Counterfeit / Authenticity Concern</option>
                                        <option>Payment or Refund Delay</option>
                                        <option>Bug or Technical Glitch</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            marginBottom: 6,
                                        }}
                                    >
                                        Describe what happened
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={reportText}
                                        onChange={(e) => setReportText(e.target.value)}
                                        placeholder="Share order ID or item details..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid var(--border-sand)',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>

                                <button type="submit" className="revclo-primary-btn">
                                    Submit Report
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* User Policy Modal matching Figma 178:6011 */}
            {activeModal === 'policy' && (
                <div className="revclo-backdrop" onClick={() => setActiveModal('none')}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20, maxHeight: '80vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 14,
                            }}
                        >
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>User Policy</h3>
                            <button type="button" onClick={() => setActiveModal('none')}>
                                <X size={18} />
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                fontSize: '12.5px',
                                lineHeight: 1.55,
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <h4 style={{ color: 'var(--text-ink)', fontSize: '14px' }}>
                                1. Privacy Policy & Buyer Protection
                            </h4>
                            <p>
                                Every transaction on RevClo is protected by escrow until delivery is
                                confirmed. Seller payouts are released within 24 hours of verified
                                delivery.
                            </p>
                            <h4 style={{ color: 'var(--text-ink)', fontSize: '14px' }}>
                                2. Terms of Use & AI Trust Score
                            </h4>
                            <p>
                                Sellers must upload unaltered photos of the actual garment. Items
                                with a Trust Score below 75 require manual tag verification before
                                appearing in Certified Fits.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification & Blocked Drawers */}
            {(activeModal === 'verification' || activeModal === 'blocked') && (
                <div className="revclo-backdrop" onClick={() => setActiveModal('none')}>
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
                                {activeModal === 'verification'
                                    ? 'Seller Verification Status'
                                    : 'Blocked Users'}
                            </h3>
                            <button type="button" onClick={() => setActiveModal('none')}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {activeModal === 'verification'
                                ? 'Your phone number, UPI payout account, and closet identity (@emillyy) are verified.'
                                : 'You have not blocked any closets on RevClo.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
