'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Briefcase,
    Home,
    Loader2,
    LogIn,
    MapPin,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { SavedAddress } from '@/types';
import {
    AuthenticatedMarketplaceUser,
    addSavedAddress,
    deleteSavedAddress,
    getCurrentUser,
    getSavedAddresses,
} from '@/actions/marketplace';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function SavedAddressesPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] =
        useState<AuthenticatedMarketplaceUser | null>(null);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [label, setLabel] = useState<SavedAddress['label']>('Home');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [line1, setLine1] = useState('');
    const [landmark, setLandmark] = useState('');
    const [area, setArea] = useState('');
    const [city, setCity] = useState('New Delhi');
    const [pincode, setPincode] = useState('');
    const [isDefault, setIsDefault] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getCurrentUser(), getSavedAddresses()])
            .then(([user, list]) => {
                if (!active) return;
                setCurrentUser(user);
                setAddresses(list);
                if (user) {
                    setReceiverName(user.name || '');
                    setReceiverPhone(user.phone || '');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!line1.trim() || !pincode.trim()) return;
        setSubmitting(true);
        try {
            const added = await addSavedAddress({
                label,
                receiver_name: receiverName.trim() || currentUser?.name || 'Member',
                receiver_phone: receiverPhone.trim(),
                address_line1: line1.trim(),
                landmark: landmark.trim() || undefined,
                area: area.trim() || city.trim(),
                city: city.trim(),
                pincode: pincode.trim(),
                is_default: isDefault,
            });
            if (added) {
                setAddresses((prev) => {
                    const updated = added.is_default
                        ? prev.map((a) => ({ ...a, is_default: false }))
                        : [...prev];
                    return [added, ...updated];
                });
                setLine1('');
                setLandmark('');
                setArea('');
                setPincode('');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        await deleteSavedAddress(id);
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
                    <h1 className="revclo-page-title">Saved Addresses</h1>
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">Loading addresses...</p>
                    </div>
                ) : !currentUser ? (
                    <div className="max-w-[540px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-8 text-center">
                        <MapPin
                            size={32}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Sign in to manage addresses
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Save your home, studio, or campus address for 1-tap checkout and courier pickups.
                        </p>
                        <Link
                            href="/login?callbackUrl=/addresses"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <LogIn size={15} />
                            <span>Sign In</span>
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-desktop-split">
                        {/* Left Column: Saved Addresses List (Figma 326:12393) */}
                        <div className="flex flex-col gap-3.5">
                            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#7C7C7C]">
                                Saved Locations ({addresses.length})
                            </h2>

                            {addresses.length === 0 ? (
                                <div className="bg-white rounded-[18px] border border-[#DCD6CD] p-8 text-center text-[13px] text-[#5E5E5E]">
                                    No saved addresses yet. Add your delivery address using the form.
                                </div>
                            ) : (
                                addresses.map((addr) => {
                                    const Icon =
                                        addr.label === 'Home'
                                            ? Home
                                            : addr.label === 'Studio / Work'
                                              ? Briefcase
                                              : Users;
                                    return (
                                        <div
                                            key={addr.id}
                                            className="bg-white rounded-[18px] border border-[#DCD6CD] p-4 flex items-start justify-between gap-3"
                                        >
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#F7F6F3] border border-[#DCD6CD] flex items-center justify-center text-[#532B21] shrink-0">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[15px] font-bold text-[#161616]">
                                                            {addr.label}
                                                        </span>
                                                        {addr.is_default && (
                                                            <span className="px-2 py-0.5 rounded-full bg-[#E5F6DF] text-[#007A00] text-[10px] font-bold">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[13px] text-[#434343] mt-1">
                                                        {addr.address_line1}
                                                        {addr.landmark
                                                            ? `, ${addr.landmark}`
                                                            : ''}
                                                    </p>
                                                    <p className="text-[12px] text-[#6F6F6F]">
                                                        {addr.area}, {addr.city}{' '}
                                                        - {addr.pincode}
                                                    </p>
                                                    <p className="text-[11px] text-[#7C7C7C] mt-1.5">
                                                        Receiver:{' '}
                                                        <strong>
                                                            {addr.receiver_name}
                                                        </strong>{' '}
                                                        {addr.receiver_phone
                                                            ? `(${addr.receiver_phone})`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(addr.id)
                                                }
                                                className="w-8 h-8 rounded-lg hover:bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0"
                                                aria-label="Delete address"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Column: Add New Address Form */}
                        <form
                            onSubmit={handleAddAddress}
                            className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6 flex flex-col gap-3.5"
                        >
                            <h3 className="text-[16px] font-bold text-[#161616] flex items-center gap-2">
                                <Plus size={16} />
                                <span>Add New Address</span>
                            </h3>

                            <div className="flex gap-2">
                                {(
                                    [
                                        'Home',
                                        'Studio / Work',
                                        'Friends & Family',
                                    ] as const
                                ).map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setLabel(l)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border ${
                                            label === l
                                                ? 'bg-[#161616] text-white border-[#161616]'
                                                : 'bg-[#F7F6F3] text-[#434343] border-[#DCD6CD]'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Receiver Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={receiverName}
                                        onChange={(e) =>
                                            setReceiverName(e.target.value)
                                        }
                                        className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={receiverPhone}
                                        onChange={(e) =>
                                            setReceiverPhone(e.target.value)
                                        }
                                        placeholder="+91 98..."
                                        className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                    House / Flat / Street Line
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={line1}
                                    onChange={(e) => setLine1(e.target.value)}
                                    placeholder="House No., Building, Street..."
                                    className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Area / Locality
                                    </label>
                                    <input
                                        type="text"
                                        value={area}
                                        onChange={(e) =>
                                            setArea(e.target.value)
                                        }
                                        placeholder="Bandra / Hauz Khas"
                                        className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={city}
                                        onChange={(e) =>
                                            setCity(e.target.value)
                                        }
                                        className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5E5E5E] mb-1">
                                        Pincode
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={pincode}
                                        onChange={(e) =>
                                            setPincode(e.target.value)
                                        }
                                        placeholder="110001"
                                        className="w-full h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-[12px] text-[#434343] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDefault}
                                    onChange={(e) =>
                                        setIsDefault(e.target.checked)
                                    }
                                />
                                <span>Set as default delivery address</span>
                            </label>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-1 h-11 rounded-xl bg-[#161616] hover:bg-black text-white text-[13px] font-semibold flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <span>Save Address to Account</span>
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
