'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Camera,
    Compass,
    MessageCircle,
    Package,
    Plus,
    Search,
    ShoppingBag,
    Sparkles,
    User,
} from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { getCurrentUser, AuthenticatedMarketplaceUser } from '@/actions/marketplace';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';

export default function DesktopNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { items } = useCart();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [profile, setProfile] = useState<AuthenticatedMarketplaceUser | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let active = true;
        try {
            const cached = sessionStorage.getItem('revclo_user_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Date.now() - (parsed.ts || 0) < 60_000) {
                    setProfile(parsed.user || null);
                    return;
                }
            }
        } catch {
            // ignore storage errors
        }

        getCurrentUser()
            .then((u) => {
                if (!active) return;
                setProfile(u);
                try {
                    sessionStorage.setItem(
                        'revclo_user_cache',
                        JSON.stringify({ user: u, ts: Date.now() })
                    );
                } catch {
                    // ignore
                }
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
            router.push('/search');
        }
    };

    const navItems = [
        { label: 'Explore', href: '/', icon: Compass, match: (p: string) => p === '/' },
        {
            label: 'Catalog',
            href: '/search',
            icon: Sparkles,
            match: (p: string) =>
                p.startsWith('/search') ||
                p.startsWith('/shop') ||
                p.startsWith('/brand') ||
                p.startsWith('/collection'),
        },
        {
            label: 'Messages',
            href: '/chat',
            icon: MessageCircle,
            match: (p: string) => p.startsWith('/chat'),
        },
        {
            label: 'Orders',
            href: '/orders',
            icon: Package,
            match: (p: string) => p.startsWith('/orders'),
        },
        {
            label: 'My Closet',
            href: '/closet',
            icon: User,
            match: (p: string) => p.startsWith('/closet') || p.startsWith('/settings'),
        },
    ];

    const displayUser = profile;

    return (
        <header className="hidden md:block sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#EAEAEA]">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between gap-6">
                {/* Left: Brand Logo & Primary Navigation */}
                <div className="flex items-center gap-8 shrink-0">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative w-[108px] h-[34px] overflow-hidden">
                            <img
                                src={REVCLO_ASSETS.wordmarkSprite}
                                alt="RevClo"
                                className="absolute max-w-none"
                                style={{
                                    width: '215%',
                                    height: '583%',
                                    left: '-56%',
                                    top: '-249%',
                                }}
                            />
                        </div>
                        <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full bg-[#F5F5F5] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5F5F5F]">
                            Archive Marketplace
                        </span>
                    </Link>

                    <nav className="flex items-center gap-1 lg:gap-2">
                        {navItems.map((item) => {
                            const active = item.match(pathname);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all ${
                                        active
                                            ? 'bg-[#161616] text-white shadow-sm'
                                            : 'text-[#525252] hover:text-[#161616] hover:bg-[#F5F5F5]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Center: Global Search Bar */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex-1 max-w-[420px] relative"
                >
                    <Search className="w-4 h-4 text-[#7A7A7A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search brands, corsets, denim, vintage bags..."
                        className="w-full h-10 pl-10 pr-16 rounded-full bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#161616] text-[13px] text-[#161616] placeholder:text-[#8A8A8A] outline-none transition-all"
                    />
                    {searchQuery.trim() && (
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 rounded-full bg-[#161616] text-white text-[11px] font-medium"
                        >
                            Go
                        </button>
                    )}
                </form>

                {/* Right: Sell CTA, Bag, Authenticated User / Sign In */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/sell"
                        className="h-10 px-4 rounded-full bg-[#4589FF] hover:bg-[#2F76F6] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Camera className="w-4 h-4" />
                        <span>Sell Piece</span>
                    </Link>

                    <Link
                        href="/cart"
                        className="relative h-10 px-3.5 rounded-full border border-[#E4E4E4] hover:border-[#161616] bg-white flex items-center gap-2 text-[13px] font-medium text-[#161616] transition-all"
                        aria-label="Shopping Bag"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="hidden lg:inline">Bag</span>
                        {mounted && items.length > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#161616] text-white text-[11px] font-bold flex items-center justify-center">
                                {items.length}
                            </span>
                        )}
                    </Link>

                    {displayUser ? (
                        <Link
                            href="/closet"
                            className="h-10 pl-1.5 pr-3.5 rounded-full border border-[#E4E4E4] hover:border-[#161616] bg-[#FAFAFA] flex items-center gap-2.5 transition-all"
                        >
                            {displayUser.image ? (
                                <img
                                    src={displayUser.image}
                                    alt={displayUser.name}
                                    className="w-7 h-7 rounded-full object-cover border border-black/10"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-[#161616] text-white text-[12px] font-bold flex items-center justify-center">
                                    {displayUser.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="text-left leading-tight hidden lg:block">
                                <p className="text-[12px] font-semibold text-[#161616] truncate max-w-[110px]">
                                    {displayUser.name}
                                </p>
                                <p className="text-[10px] text-[#6F6F6F] truncate max-w-[110px]">
                                    @{displayUser.handle || 'member'}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="h-10 px-4 rounded-full bg-[#161616] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-1.5 transition-all"
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Sign In</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
