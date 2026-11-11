'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/components/CartContext';

interface BottomNavbarProps {
    onFilterClick?: () => void;
    showFilterPill?: boolean;
}

export default function BottomNavbar({
    onFilterClick,
    showFilterPill = false,
}: BottomNavbarProps) {
    const pathname = usePathname();
    const { items } = useCart();
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const isHome =
        pathname === '/' ||
        pathname.startsWith('/search') ||
        pathname.startsWith('/shop') ||
        pathname.startsWith('/brand') ||
        pathname.startsWith('/collection') ||
        pathname.startsWith('/creator');
    const isCloset =
        pathname.startsWith('/closet') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/orders') ||
        pathname.startsWith('/addresses');
    const isBag = pathname.startsWith('/cart') || pathname.startsWith('/checkout');

    return (
        <div className="revclo-bottom-nav-wrap">
            <div className="revclo-bottom-nav-inner">
                <nav className="revclo-nav-pill" aria-label="Primary Bottom Navigation">
                    <Link
                        href="/"
                        className={`revclo-nav-item ${isHome ? 'active' : ''}`}
                        title="Home Feed"
                    >
                        {/* RevClo R-hanger emblem */}
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 10.5L12 3l9 7.5" />
                            <path d="M5 9.5V19a1 1 0 001 1h12a1 1 0 001-1V9.5" />
                            <path d="M9.5 14.5h5" />
                        </svg>
                        {isHome && <span>Home</span>}
                    </Link>

                    <Link
                        href="/closet"
                        className={`revclo-nav-item ${isCloset ? 'active' : ''}`}
                        title="My Closet"
                    >
                        {/* Hanger SVG matching Figma 71:992 */}
                        <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 7a2.5 2.5 0 1 0-2.5-2.5c0 1.38 2.5 2.5 2.5 4.5v1" />
                            <path d="M2.8 17.2 12 10l9.2 7.2a1.5 1.5 0 0 1-.9 2.8H3.7a1.5 1.5 0 0 1-.9-2.8Z" />
                        </svg>
                        {isCloset && <span>Closet</span>}
                    </Link>

                    <Link
                        href="/cart"
                        className={`revclo-nav-item ${isBag ? 'active' : ''}`}
                        title="Shopping Bag"
                    >
                        <ShoppingBag size={17} strokeWidth={2} />
                        {isBag && <span>Bag</span>}
                        {totalCount > 0 && <span className="revclo-nav-badge">{totalCount}</span>}
                    </Link>
                </nav>

                {showFilterPill && onFilterClick ? (
                    <button
                        type="button"
                        onClick={onFilterClick}
                        className="revclo-sell-fab"
                        style={{
                            width: 'auto',
                            padding: '0 16px',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                        }}
                    >
                        <SlidersHorizontal size={15} />
                        <span>Filter</span>
                    </button>
                ) : (
                    <Link
                        href="/sell"
                        className="revclo-sell-fab"
                        aria-label="List a new item"
                        title="Sell on RevClo"
                    >
                        <Plus size={22} strokeWidth={2.4} />
                    </Link>
                )}
            </div>
        </div>
    );
}
