'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Briefcase,
    Home,
    MapPin,
    Navigation,
    Plus,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { SavedAddress } from '@/types';
import {
    addSavedAddress,
    deleteSavedAddress,
    getSavedAddresses,
} from '@/actions/marketplace';
import { SEED_ADDRESSES } from '@/lib/revcloSeedData';

export default function AddressesPage() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<SavedAddress[]>(SEED_ADDRESSES);
    const [sheetOpen, setSheetOpen] = useState<boolean>(false);

    // Add New Address Sheet state (Figma 197:5873)
    const [area, setArea] = useState<string>('Lajpat Nagar');
    const [line1, setLine1] = useState<string>('');
    const [landmark, setLandmark] = useState<string>('');
    const [receiverName, setReceiverName] = useState<string>('Ishan');
    const [receiverPhone, setReceiverPhone] = useState<string>('+91 98112 45890');
    const [label, setLabel] = useState<'Home' | 'Studio / Work' | 'Friends & Family'>('Home');

    useEffect(() => {
        getSavedAddresses().then((res) => {
            if (res && res.length > 0) setAddresses(res);
        });
    }, []);

    const handleCreateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!line1.trim()) return;
        const updated = await addSavedAddress({
            label,
            receiver_name: receiverName,
            receiver_phone: receiverPhone,
            address_line1: line1,
            landmark,
            area,
        });
        setAddresses([...updated]);
        setLine1('');
        setLandmark('');
        setSheetOpen(false);
    };

    const handleDelete = async (id: string) => {
        const updated = await deleteSavedAddress(id);
        setAddresses([...updated]);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
            {/* Top Bar matching Figma 180:3665 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">My Addresses</span>
                <div style={{ width: 36 }} />
            </header>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Add Address Trigger Button matching 180:3665 */}
                <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1.5px dashed var(--terracotta-800)',
                        color: 'var(--terracotta-900)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        fontWeight: 600,
                    }}
                >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} />
                        <span>Add Address</span>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Doorstep pickup & delivery
                    </span>
                </button>

                <div>
                    <h2
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            marginBottom: 10,
                        }}
                    >
                        Saved Addresses
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {addresses.map((addr) => (
                            <div
                                key={addr.id}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 14,
                                    border: '1px solid var(--border-card)',
                                    padding: '14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 10,
                                            background: 'var(--terracotta-50)',
                                            color: 'var(--terracotta-800)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {addr.label === 'Home' ? (
                                            <Home size={18} />
                                        ) : (
                                            <Briefcase size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                                {addr.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '2px 7px',
                                                    borderRadius: 999,
                                                    background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-sand)',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                {addr.distance_km} km
                                            </span>
                                        </div>

                                        <p
                                            style={{
                                                fontSize: '12.5px',
                                                color: 'var(--text-secondary)',
                                                marginTop: 4,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {addr.receiver_name}, {addr.address_line1}
                                            {addr.address_line2 ? `, ${addr.address_line2}` : ''},{' '}
                                            {addr.city} - {addr.pincode}
                                        </p>
                                        <div
                                            style={{
                                                fontSize: '11.5px',
                                                color: 'var(--text-muted)',
                                                marginTop: 4,
                                            }}
                                        >
                                            Phone: {addr.receiver_phone}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(addr.id)}
                                    aria-label="Delete address"
                                    style={{ color: 'var(--text-muted)', padding: 4 }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add New Address Slide-Up Sheet matching Figma 197:5873 */}
            {sheetOpen && (
                <div className="revclo-backdrop" onClick={() => setSheetOpen(false)}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20, maxHeight: '88vh', overflowY: 'auto' }}
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
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Add new address</h3>
                            <button type="button" onClick={() => setSheetOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Location Pin Banner: Lajpat Nagar • 14 KM */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: 'var(--terracotta-50)',
                                border: '1px solid var(--terracotta-200)',
                                marginBottom: 14,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <MapPin size={18} color="var(--terracotta-800)" />
                                <div>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
                                        {area}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        New Delhi • 14 KM away
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setArea(
                                        area === 'Lajpat Nagar' ? 'Yamuna Vihar' : 'Lajpat Nagar'
                                    )
                                }
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    color: 'var(--terracotta-800)',
                                }}
                            >
                                <Navigation size={12} />
                                <span>Change</span>
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateAddress}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 4,
                                    }}
                                >
                                    Delivery details (House / Flat / Floor) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={line1}
                                    onChange={(e) => setLine1(e.target.value)}
                                    placeholder="e.g. B5/30 Second Floor"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-sand)',
                                        fontSize: '13px',
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 4,
                                    }}
                                >
                                    Nearby Landmark (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={landmark}
                                    onChange={(e) => setLandmark(e.target.value)}
                                    placeholder="e.g. Near Central Market Metro"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid var(--border-sand)',
                                        fontSize: '13px',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Receiver Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid var(--border-sand)',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={receiverPhone}
                                        onChange={(e) => setReceiverPhone(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid var(--border-sand)',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Save address as */}
                            <div>
                                <span
                                    style={{
                                        display: 'block',
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 6,
                                    }}
                                >
                                    Save address as
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {(
                                        [
                                            { id: 'Home', icon: Home },
                                            { id: 'Studio / Work', icon: Briefcase },
                                            { id: 'Friends & Family', icon: Users },
                                        ] as const
                                    ).map((opt) => {
                                        const Icon = opt.icon;
                                        const active = label === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setLabel(opt.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 6px',
                                                    borderRadius: 10,
                                                    background: active
                                                        ? 'var(--terracotta-920)'
                                                        : '#ffffff',
                                                    color: active ? '#ffffff' : 'var(--text-ink)',
                                                    border: '1px solid var(--border-sand)',
                                                    fontSize: '11.5px',
                                                    fontWeight: 600,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 5,
                                                }}
                                            >
                                                <Icon size={13} />
                                                <span>{opt.id}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="revclo-primary-btn"
                                style={{ marginTop: 6 }}
                            >
                                Save Address
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
