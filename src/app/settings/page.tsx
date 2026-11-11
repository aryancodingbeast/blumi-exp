'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    ArrowLeft,
    Bell,
    Check,
    ChevronRight,
    Loader2,
    LogIn,
    LogOut,
    MapPin,
    Package,
    ShieldCheck,
    User,
} from 'lucide-react';
import {
    AuthenticatedMarketplaceUser,
    getCurrentUser,
    updateCurrentUserProfile,
} from '@/actions/marketplace';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthenticatedMarketplaceUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedToast, setSavedToast] = useState(false);

    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [pushNotifs, setPushNotifs] = useState(true);
    const [offerAlerts, setOfferAlerts] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((u) => {
                setUser(u);
                if (u) {
                    setName(u.name || '');
                    setHandle(u.handle || '');
                    setBio(u.bio || '');
                    setPhone(u.phone || '');
                    setLocation(u.location || 'New Delhi');
                    setInstagramUrl(u.instagram_url || '');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSavedToast(false);
        const res = await updateCurrentUserProfile({
            name,
            handle,
            bio,
            phone,
            location,
            instagram_url: instagramUrl,
        });
        if (res.success && res.user) {
            setUser(res.user);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 3000);
        }
        setSaving(false);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
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
                    <h1 className="revclo-page-title">Account Settings</h1>
                </div>

                {user && (
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-3.5 py-1.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[12px] font-semibold inline-flex items-center gap-1.5"
                    >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                )}
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2 size={26} className="animate-spin text-[#532B21]" />
                        <p className="text-[13px]">Loading account settings...</p>
                    </div>
                ) : !user ? (
                    <div className="max-w-[540px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-8 text-center">
                        <User size={32} className="mx-auto mb-3 text-[#532B21]" />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Sign in to manage your account
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Sign in with your account to customize your closet profile, saved addresses, and payout preferences.
                        </p>
                        <Link
                            href="/login?callbackUrl=/settings"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <LogIn size={15} />
                            <span>Sign In</span>
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-desktop-split">
                        {/* Left Column: Account Overview & Navigation */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#161616] text-white flex items-center justify-center text-[22px] font-bold shrink-0">
                                    {user.image ? (
                                        <img
                                            src={user.image}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{user.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[17px] font-bold text-[#161616] truncate">
                                        {user.name}
                                    </h2>
                                    <p className="text-[12px] text-[#5E5E5E] truncate">
                                        {user.email}
                                    </p>
                                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#F7F6F3] border border-[#DCD6CD] text-[11px] font-semibold text-[#532B21]">
                                        @{user.handle}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-[20px] border border-[#DCD6CD] divide-y divide-[#EFEFEF] overflow-hidden">
                                <Link
                                    href="/orders"
                                    className="p-4 flex items-center justify-between hover:bg-[#F7F6F3] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Package size={18} className="text-[#532B21]" />
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#161616]">
                                                Past Orders & Sales
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Track purchases, sold pieces & invoices
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#7C7C7C]" />
                                </Link>

                                <Link
                                    href="/addresses"
                                    className="p-4 flex items-center justify-between hover:bg-[#F7F6F3] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className="text-[#532B21]" />
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#161616]">
                                                Saved Addresses
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Manage delivery & pickup locations
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#7C7C7C]" />
                                </Link>

                                <Link
                                    href="/closet"
                                    className="p-4 flex items-center justify-between hover:bg-[#F7F6F3] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={18} className="text-[#007A00]" />
                                        <div>
                                            <div className="text-[14px] font-semibold text-[#161616]">
                                                Public Closet Profile
                                            </div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                View your live listings & wishlist
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#7C7C7C]" />
                                </Link>
                            </div>
                        </div>

                        {/* Right Column: Live Profile Form */}
                        <form
                            onSubmit={handleSave}
                            className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-bold text-[#161616]">
                                    Edit Closet Profile
                                </h3>
                                {savedToast && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5F6DF] text-[#007A00] text-[11px] font-bold">
                                        <Check size={12} />
                                        Saved to Supabase
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Closet Handle (@)
                                    </label>
                                    <input
                                        type="text"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                        className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+91 98..."
                                        className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        City / Location
                                    </label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="New Delhi, Mumbai, Bengaluru..."
                                        className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                    Instagram Handle or URL
                                </label>
                                <input
                                    type="text"
                                    value={instagramUrl}
                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                    placeholder="https://instagram.com/yourhandle"
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                    Closet Bio
                                </label>
                                <textarea
                                    rows={3}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full p-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616] resize-y"
                                />
                            </div>

                            {/* Notification Toggles */}
                            <div className="pt-2 border-t border-[#EFEFEF] flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Bell size={15} className="text-[#532B21]" />
                                        <span className="text-[13px] font-medium text-[#161616]">
                                            Buyer message & offer notifications
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOfferAlerts((v) => !v)}
                                        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                                            offerAlerts ? 'bg-[#161616]' : 'bg-[#CCCCCC]'
                                        }`}
                                    >
                                        <span
                                            className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                                                offerAlerts ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Bell size={15} className="text-[#532B21]" />
                                        <span className="text-[13px] font-medium text-[#161616]">
                                            Wishlist price-drop alerts
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPushNotifs((v) => !v)}
                                        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                                            pushNotifs ? 'bg-[#161616]' : 'bg-[#CCCCCC]'
                                        }`}
                                    >
                                        <span
                                            className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                                                pushNotifs ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="mt-2 h-11 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-semibold flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <span>Save Profile Changes</span>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
