'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    LogIn,
    MapPin,
    Plus,
    ShieldCheck,
    Smartphone,
    Wallet,
} from 'lucide-react';
import { SavedAddress } from '@/types';
import {
    AuthenticatedMarketplaceUser,
    addSavedAddress,
    getCurrentUser,
    getSavedAddresses,
    placeMarketplaceOrder,
} from '@/actions/marketplace';
import { useCart } from '@/components/CartContext';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, clearCart } = useCart();

    const [currentUser, setCurrentUser] =
        useState<AuthenticatedMarketplaceUser | null>(null);
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>(
        'UPI'
    );
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

    // Inline quick address creator if user has 0 saved addresses
    const [quickLine1, setQuickLine1] = useState('');
    const [quickCity, setQuickCity] = useState('New Delhi');
    const [quickPincode, setQuickPincode] = useState('');
    const [quickPhone, setQuickPhone] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getCurrentUser(), getSavedAddresses()])
            .then(([user, list]) => {
                if (!active) return;
                setCurrentUser(user);
                setAddresses(list);
                if (list[0]) setSelectedAddressId(list[0].id);
                if (user?.phone) setQuickPhone(user.phone);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const gst = Math.round(totalPrice * 0.05);
    const shipping = totalPrice >= 999 || totalPrice === 0 ? 0 : 49;
    const grandTotal = totalPrice + gst + shipping;

    const handlePlaceOrder = async () => {
        setError(null);
        if (!currentUser) {
            router.push('/login?callbackUrl=/checkout');
            return;
        }
        if (items.length === 0) {
            setError('Your bag is empty.');
            return;
        }

        setPlacing(true);
        try {
            let finalAddressId = selectedAddressId;
            if (!finalAddressId && quickLine1.trim() && quickPincode.trim()) {
                const created = await addSavedAddress({
                    label: 'Home',
                    receiver_name: currentUser.name,
                    receiver_phone: quickPhone.trim(),
                    address_line1: quickLine1.trim(),
                    area: quickCity.trim(),
                    city: quickCity.trim(),
                    pincode: quickPincode.trim(),
                    is_default: true,
                });
                if (created) finalAddressId = created.id;
            }

            const res = await placeMarketplaceOrder({
                items: items.map((i) => ({
                    productId: i.product.id,
                    price: i.product.price,
                    title: i.product.title,
                })),
                totalAmount: grandTotal,
                addressId: finalAddressId,
                paymentMethod,
            });

            if (!res.success) {
                setError(res.error || 'Could not place order.');
                setPlacing(false);
                return;
            }

            clearCart();
            setOrderSuccessId(res.orderId || 'ORD-VERIFIED');
            setPlacing(false);
        } catch (err: any) {
            setError(err?.message || 'Checkout failed.');
            setPlacing(false);
        }
    };

    if (orderSuccessId) {
        return (
            <div className="max-w-[540px] mx-auto my-12 bg-white rounded-[24px] border border-[#DCD6CD] p-8 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#E5F6DF] text-[#007A00] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h1 className="text-[22px] font-extrabold text-[#161616]">
                    Order Confirmed!
                </h1>
                <p className="text-[13px] text-[#5E5E5E] mt-1.5">
                    Your order <strong>#{orderSuccessId.slice(0, 8).toUpperCase()}</strong> has been recorded in Supabase and the seller has been notified to dispatch via Delhivery.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/orders"
                        className="px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                    >
                        View in Past Orders
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 rounded-full bg-[#F7F6F3] border border-[#DCD6CD] text-[#161616] text-[13px] font-semibold"
                    >
                        Continue Exploring
                    </Link>
                </div>
            </div>
        );
    }

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
                    <h1 className="revclo-page-title">Secure Checkout</h1>
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">Preparing checkout...</p>
                    </div>
                ) : !currentUser ? (
                    <div className="max-w-[540px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-8 text-center">
                        <ShieldCheck
                            size={32}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Sign in to complete checkout
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Your bag is saved. Sign in with your account to confirm your delivery address and place your order.
                        </p>
                        <Link
                            href="/login?callbackUrl=/checkout"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <LogIn size={15} />
                            <span>Sign In to Checkout</span>
                        </Link>
                    </div>
                ) : (
                    <div className="revclo-desktop-split">
                        {/* Left Column: Delivery Address & Payment Method */}
                        <div className="flex flex-col gap-5">
                            {error && (
                                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[13px] font-medium">
                                    {error}
                                </div>
                            )}

                            <section className="bg-white rounded-[20px] border border-[#DCD6CD] p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-[15px] font-bold text-[#161616] flex items-center gap-2">
                                        <MapPin
                                            size={16}
                                            className="text-[#532B21]"
                                        />
                                        <span>Delivery Address</span>
                                    </h2>
                                    <Link
                                        href="/addresses"
                                        className="text-[12px] font-semibold text-[#532B21] inline-flex items-center gap-1"
                                    >
                                        <Plus size={13} />
                                        Manage
                                    </Link>
                                </div>

                                {addresses.length > 0 ? (
                                    <div className="flex flex-col gap-2.5">
                                        {addresses.map((addr) => {
                                            const selected =
                                                selectedAddressId === addr.id;
                                            return (
                                                <button
                                                    key={addr.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedAddressId(
                                                            addr.id
                                                        )
                                                    }
                                                    className={`p-3.5 rounded-xl border text-left transition-all ${
                                                        selected
                                                            ? 'border-[#532B21] bg-[#FBF9F6]'
                                                            : 'border-[#E6E3DD] bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[13px] font-bold text-[#161616]">
                                                            {addr.label} &bull;{' '}
                                                            {addr.receiver_name}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-[#007A00]">
                                                            {selected
                                                                ? 'Selected'
                                                                : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-[#5E5E5E] mt-1">
                                                        {addr.address_line1},{' '}
                                                        {addr.city} -{' '}
                                                        {addr.pincode}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <input
                                            type="text"
                                            value={quickLine1}
                                            onChange={(e) =>
                                                setQuickLine1(e.target.value)
                                            }
                                            placeholder="House / Flat / Street Address..."
                                            className="w-full h-10 px-3.5 rounded-xl border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                        />
                                        <div className="grid grid-cols-3 gap-2.5">
                                            <input
                                                type="text"
                                                value={quickCity}
                                                onChange={(e) =>
                                                    setQuickCity(e.target.value)
                                                }
                                                placeholder="City"
                                                className="h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={quickPincode}
                                                onChange={(e) =>
                                                    setQuickPincode(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Pincode"
                                                className="h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none"
                                            />
                                            <input
                                                type="tel"
                                                value={quickPhone}
                                                onChange={(e) =>
                                                    setQuickPhone(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Phone"
                                                className="h-10 px-3 rounded-xl border border-[#DCD6CD] text-[13px] outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Payment Method */}
                            <section className="bg-white rounded-[20px] border border-[#DCD6CD] p-5">
                                <h2 className="text-[15px] font-bold text-[#161616] mb-3">
                                    Payment Method
                                </h2>
                                <div className="flex flex-col gap-2.5">
                                    {(
                                        [
                                            {
                                                id: 'UPI',
                                                title: 'UPI (GPay, PhonePe, Paytm)',
                                                sub: 'Instant verification with zero gateway fee',
                                                icon: Smartphone,
                                            },
                                            {
                                                id: 'CARD',
                                                title: 'Credit / Debit Card',
                                                sub: 'Visa, Mastercard, RuPay',
                                                icon: CreditCard,
                                            },
                                            {
                                                id: 'COD',
                                                title: 'Pay on Delivery',
                                                sub: 'Available for verified pincodes',
                                                icon: Wallet,
                                            },
                                        ] as const
                                    ).map((pm) => {
                                        const Icon = pm.icon;
                                        const active = paymentMethod === pm.id;
                                        return (
                                            <button
                                                key={pm.id}
                                                type="button"
                                                onClick={() =>
                                                    setPaymentMethod(pm.id)
                                                }
                                                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                                                    active
                                                        ? 'border-[#161616] bg-[#F7F6F3]'
                                                        : 'border-[#E6E3DD] bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        size={18}
                                                        className="text-[#532B21]"
                                                    />
                                                    <div>
                                                        <div className="text-[13px] font-bold text-[#161616]">
                                                            {pm.title}
                                                        </div>
                                                        <div className="text-[11px] text-[#6F6F6F]">
                                                            {pm.sub}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        active
                                                            ? 'border-[#161616] bg-[#161616]'
                                                            : 'border-[#A8A8A8]'
                                                    }`}
                                                >
                                                    {active && (
                                                        <span className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Order Summary & Place Order */}
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 md:p-6 flex flex-col gap-4 sticky top-24">
                            <h2 className="text-[16px] font-bold text-[#161616]">
                                Bill Summary ({items.length} item
                                {items.length > 1 ? 's' : ''})
                            </h2>

                            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                                {items.map(({ product }) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between text-[12px]"
                                    >
                                        <span className="truncate max-w-[200px] font-medium text-[#161616]">
                                            {product.title} ({product.size})
                                        </span>
                                        <span className="font-bold">
                                            ₹
                                            {product.price.toLocaleString(
                                                'en-IN'
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 text-[13px] border-t border-b border-[#EFEFEF] py-3">
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>Item Total</span>
                                    <span>
                                        ₹{totalPrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>GST & Escrow Protection</span>
                                    <span>₹{gst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-[#5E5E5E]">
                                    <span>Shipping</span>
                                    <span className="font-semibold text-[#007A00]">
                                        {shipping === 0
                                            ? 'FREE'
                                            : `₹${shipping}`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[18px] font-extrabold text-[#161616]">
                                <span>Total Payable</span>
                                <span>
                                    ₹{grandTotal.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <button
                                type="button"
                                disabled={placing || items.length === 0}
                                onClick={handlePlaceOrder}
                                className="h-12 rounded-xl bg-[#161616] hover:bg-black disabled:opacity-50 text-white text-[14px] font-semibold flex items-center justify-center gap-2"
                            >
                                {placing ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        <span>Placing Order...</span>
                                    </>
                                ) : (
                                    <span>
                                        Pay & Place Order • ₹
                                        {grandTotal.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
