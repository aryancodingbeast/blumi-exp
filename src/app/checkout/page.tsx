'use client'

import { initiatePaymentSession } from '@/actions/payments'
import { checkWaitlistEmail } from '@/actions/waitlist'
import { useCart } from '@/components/CartContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapPin, User, ChevronRight } from 'lucide-react'
import { getSession } from 'next-auth/react'
import { isDropExpired } from '@/lib/expiry'
import { supabase } from '@/lib/supabase'

export default function CheckoutPage() {
    const { cart, total, clearCart } = useCart()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [isExpired, setIsExpired] = useState(false)
    const [soldItemsList, setSoldItemsList] = useState<string[]>([])



    // Coupon & Waitlist State
    const [userEmail, setUserEmail] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [couponError, setCouponError] = useState('')
    const [couponSuccess, setCouponSuccess] = useState('')
    const [couponLoading, setCouponLoading] = useState(false)

    useEffect(() => {
        const checkExpiry = () => {
            if (isDropExpired()) {
                setIsExpired(true)
            }
        }
        checkExpiry()
        const interval = setInterval(checkExpiry, 2000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        document.body.classList.add('checkout-flow-active')
        
        // Dynamically load Razorpay checkout script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        
        const checkSession = async () => {
            const session = await getSession()
            if (!session?.user?.id) {
                router.push('/login?callbackUrl=/checkout')
            } else {
                setUserId(session.user.id)
                setUserEmail(session.user.email || '')
            }
        }
        checkSession()
        return () => {
            document.body.classList.remove('checkout-flow-active')
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [router])

    const handleApplyCoupon = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (!couponCode.trim()) return

        setCouponLoading(true)
        setCouponError('')
        setCouponSuccess('')

        const formattedCode = couponCode.trim()

        if (formattedCode.toUpperCase() !== 'BACKAGAIN') {
            setCouponError('INVALID COUPON: Coupon code does not exist.')
            setCouponLoading(false)
            return
        }

        const emailToVerify = userEmail

        if (!emailToVerify) {
            setCouponError('VERIFICATION FAILED: Account email address is required to check waitlist status.')
            setCouponLoading(false)
            return
        }

        try {
            const res = await checkWaitlistEmail(emailToVerify)
            if (res.success && res.isRegistered) {
                setCouponApplied(true)
                setCouponSuccess('10% WAITLIST DISCOUNT APPLIED!_')
            } else {
                setCouponError('VERIFICATION FAILED: Exclusive to registered waitlist members.')
            }
        } catch (err) {
            setCouponError('System handshake failed. Please try again.')
        } finally {
            setCouponLoading(false)
        }
    }

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cart.length === 0) return

        const cleanedPhone = phone.replace(/\D/g, '')
        if (cleanedPhone.length !== 10 || !/^[6-9]/.test(cleanedPhone)) {
            alert('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const session = await getSession()
            if (!session?.user?.id) {
                alert('Session expired. Please log in again.')
                router.push('/login?callbackUrl=/checkout')
                setLoading(false)
                return
            }
            const finalUserId = session.user.id
            const finalUserEmail = session.user.email || ''
            const finalUserName = name || session.user.name || ''

            const orderItems = cart.map(item => ({ productId: item.id, price: item.price, title: item.title }))
            
            const finalTotal = couponApplied ? total * 0.90 : total

            // Initiate Razorpay / secure payment session
            const result = await initiatePaymentSession(
                finalUserId,
                finalUserEmail,
                finalUserName,
                orderItems,
                finalTotal,
                {
                    deliveryOption,
                    address,
                    city,
                    state,
                    pinCode,
                    landmark,
                    phone: cleanedPhone
                }
            )

            if (result?.isSimulated && result?.checkoutUrl) {
                // Redirect to the simulated sandbox gateway
                router.push(result.checkoutUrl)
            } else if (result?.orderId && result?.keyId) {
                if (!(window as any).Razorpay) {
                    alert('Razorpay secure checkout is still initializing. Please wait a moment and try again.')
                    setLoading(false)
                    return
                }

                // Launch the REAL Razorpay modal
                const options = {
                    key: result.keyId,
                    amount: result.amount,
                    currency: result.currency || 'INR',
                    name: 'BLUMI COLLECTIVE',
                    description: 'Secure Streetwear Checkout',
                    order_id: result.orderId,
                    prefill: {
                        name: finalUserName,
                        email: finalUserEmail,
                        contact: cleanedPhone
                    },
                    theme: {
                        color: '#d11a1a' // Branded signal-red
                    },
                    handler: async function (response: any) {
                        setLoading(true)
                        try {
                            const serializedItems = JSON.stringify(orderItems)
                            const successUrl = `/checkout/success?buyerId=${finalUserId}&items=${encodeURIComponent(serializedItems)}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&deliveryOption=${deliveryOption}&address=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&pinCode=${encodeURIComponent(pinCode)}&landmark=${encodeURIComponent(landmark)}&phone=${encodeURIComponent(cleanedPhone)}&name=${encodeURIComponent(finalUserName)}&email=${encodeURIComponent(finalUserEmail)}&total=${finalTotal.toString()}`
                            
                            // Redirect to checkout success page
                            router.push(successUrl)
                        } catch (err) {
                            console.error('Error handling success response:', err)
                            alert('Order verification failed. Please contact support.')
                            setLoading(false)
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false)
                        }
                    }
                }
                
                const rzp = new (window as any).Razorpay(options)
                rzp.open()
            } else {
                alert('Secure checkout session initialization failed.')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to process secure payment routing. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const [deliveryOption, setDeliveryOption] = useState<'CAMPUS' | 'DOORSTEP'>('CAMPUS')
    
    // Doorstep Form State
    // Supabase Realtime cart items sold safeguard
    useEffect(() => {
        if (cart.length === 0) return

        const cartProductIds = cart.map(item => item.id)
        console.log('[CheckoutPage] Subscribing to realtime updates for active cart items:', cartProductIds)
        
        const channel = supabase
            .channel('checkout-cart-realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    if (cartProductIds.includes(payload.new.id) && payload.new.status?.toUpperCase() === 'SOLD') {
                        console.warn('[CheckoutPage] A cart item was checked out by another buyer in real-time:', payload.new.title)
                        setSoldItemsList(prev => prev.includes(payload.new.title) ? prev : [...prev, payload.new.title])
                    }
                }
            )
            .subscribe()

        return () => {
            console.log('[CheckoutPage] Cleaning up realtime cart checkout safeguards.')
            supabase.removeChannel(channel)
        }
    }, [cart])

    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [pinCode, setPinCode] = useState('')
    const [landmark, setLandmark] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')

    if (soldItemsList.length > 0) {
        return (
            <div style={{ padding: '10rem var(--space-page-x) 6rem', minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                <div style={{
                    width: '100%',
                    maxWidth: '540px',
                    background: '#040404',
                    border: '1px solid rgba(209, 26, 26, 0.25)',
                    padding: '4rem 2.5rem',
                    textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
                }}>
                    <span style={{
                        fontFamily: "var(--font-mono, monospace)",
                        color: '#d11a1a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '1rem'
                    }}>
                        [EXCLUSIVE PIECE SECURED / SOLD OUT_]
                    </span>
                    <h1 style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        margin: '0 0 1.2rem 0',
                        letterSpacing: '0.02em'
                    }}>GARMENT ARCHIVED</h1>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.45)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        marginBottom: '3rem'
                    }}>
                        An item in your bag: <strong style={{ color: '#d11a1a' }}>{soldItemsList.join(', ')}</strong> has just been checked out by another buyer! Since our pieces are 1/1 exclusives, checkout is now locked for this item.
                    </p>
                    <button
                        onClick={() => {
                            clearCart()
                            router.push('/shop')
                        }}
                        style={{
                            background: '#ffffff',
                            color: '#000000',
                            border: 'none',
                            padding: '1.1rem 2.2rem',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            borderRadius: '0px',
                            transition: 'opacity 0.2s ease',
                            width: '100%',
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        RETURN TO VAULT
                    </button>
                </div>
            </div>
        )
    }

    if (isExpired) {
        return (
            <div style={{ padding: '10rem var(--space-page-x) 6rem', minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
                <div style={{
                    width: '100%',
                    maxWidth: '540px',
                    background: '#040404',
                    border: '1px solid rgba(209, 26, 26, 0.25)',
                    padding: '4rem 2.5rem',
                    textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
                }}>
                    <span style={{
                        fontFamily: "var(--font-mono, monospace)",
                        color: '#d11a1a',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '1rem'
                    }}>
                        [ACCESS DENIED / DROP PERIOD ARCHIVED_]
                    </span>
                    <h1 style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '2rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        margin: '0 0 1.2rem 0',
                        letterSpacing: '0.02em'
                    }}>CHECKOUT DISABLED</h1>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.45)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        marginBottom: '3rem'
                    }}>
                        The exclusive drop timeline has secured and archived. Checkout operations for all items in this drop series are now disabled. Any items remaining in your bag are archived.
                    </p>
                    <button
                        onClick={() => router.push('/shop')}
                        style={{
                            background: '#ffffff',
                            color: '#000000',
                            border: 'none',
                            padding: '1.1rem 2.2rem',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            borderRadius: '0px',
                            transition: 'opacity 0.2s ease',
                            width: '100%',
                            fontFamily: "'Inter', sans-serif"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        RETURN TO ARCHIVE
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: '10rem var(--space-page-x) 6rem', minHeight: '100vh', backgroundColor: '#000000' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                <div className="checkout-head" style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '2.5rem',
                    marginBottom: '3.5rem',
                    textAlign: 'left'
                }}>
                    <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: '#d11a1a',
                        marginBottom: '0.6rem'
                    }}>FINAL STEP_</p>
                    <h1 style={{
                        fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        lineHeight: 1,
                        margin: 0
                    }}>SHIPPING ROUTE</h1>
                </div>

                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {/* Option Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            color: '#d11a1a',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase'
                        }}>
                            WHERE SHOULD YOUR DRIP LAND?_
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => setDeliveryOption('CAMPUS')}
                                style={{
                                    background: deliveryOption === 'CAMPUS' ? '#d11a1a' : '#030303',
                                    border: deliveryOption === 'CAMPUS' ? '1px solid #d11a1a' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    padding: '1.2rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    borderRadius: '0px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: deliveryOption === 'CAMPUS' ? '0 4px 12px rgba(209, 26, 26, 0.3)' : 'none'
                                }}
                            >
                                DELIVER AT CAMPUS (IGDTUW)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeliveryOption('DOORSTEP')}
                                style={{
                                    background: deliveryOption === 'DOORSTEP' ? '#d11a1a' : '#030303',
                                    border: deliveryOption === 'DOORSTEP' ? '1px solid #d11a1a' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    padding: '1.2rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    borderRadius: '0px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: deliveryOption === 'DOORSTEP' ? '0 4px 12px rgba(209, 26, 26, 0.3)' : 'none'
                                }}
                            >
                                DELIVER AT YOUR DOORSTEP
                            </button>
                        </div>
                    </div>

                    {/* Shipping Address Forms */}
                    {deliveryOption === 'CAMPUS' ? (
                        <div style={{
                            background: '#030303',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '3.5rem 2.5rem',
                            borderRadius: '0px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{
                                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    color: '#ffffff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.8rem'
                                }}>
                                    SECURED CAMPUS DISTRIBUTION_
                                </p>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.8rem',
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    lineHeight: 1.6,
                                    maxWidth: '480px',
                                    margin: '0 auto'
                                }}>
                                    Package will be dispatched directly to the IGDTUW Central Campus Pickup Vault. Please enter your name and contact phone number for campus pickup identification.
                                </p>
                            </div>



                            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        NAME_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="Full Name" 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        PHONE NUMBER_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="+91 XXXXX XXXXX" 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: '#030303',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '3.5rem 2.5rem',
                            borderRadius: '0px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2.5rem'
                        }}>


                            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        NAME_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="Ozelis Market" 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        PHONE NUMBER_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="+91 XXXXX XXXXX" 
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    SHIPPING ADDRESS_
                                </label>
                                <input 
                                    required 
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                    placeholder="123 Fashion Ave, Sector 1" 
                                />
                            </div>

                            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        CITY_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="New Delhi" 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        STATE_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="Delhi" 
                                    />
                                </div>
                            </div>

                            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        PIN CODE_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={pinCode}
                                        onChange={(e) => setPinCode(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="110006" 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        LANDMARK_
                                    </label>
                                    <input 
                                        required 
                                        type="text"
                                        value={landmark}
                                        onChange={(e) => setLandmark(e.target.value)}
                                        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '0px', padding: '1.1rem 1.4rem', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", fontWeight: 600 }} 
                                        placeholder="Near Metro Gate 2" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coupon Code Block */}
                    <div style={{
                        background: '#030303',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '2.5rem 2rem',
                        borderRadius: '0px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <label style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase'
                        }}>
                            HAVE A CAMPUS WAITLIST PROMO CODE?_
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input 
                                type="text"
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); setCouponSuccess('') }}
                                placeholder="ENTER COUPON CODE"
                                disabled={couponApplied || couponLoading}
                                style={{ 
                                    flex: 1,
                                    background: '#0a0a0a', 
                                    border: couponError ? '1px solid #d11a1a' : couponApplied ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)', 
                                    color: '#ffffff', 
                                    borderRadius: '0px', 
                                    padding: '1rem 1.2rem', 
                                    fontSize: '0.85rem', 
                                    fontFamily: "var(--font-mono, monospace)", 
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase'
                                }} 
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={couponApplied || couponLoading || !couponCode.trim()}
                                style={{
                                    background: couponApplied ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                                    border: couponApplied ? '1px solid #10b981' : 'none',
                                    color: couponApplied ? '#10b981' : '#000000',
                                    padding: '0 2rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: (couponApplied || couponLoading || !couponCode.trim()) ? 'not-allowed' : 'pointer',
                                    borderRadius: '0px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {couponLoading ? 'VERIFYING...' : couponApplied ? 'APPLIED' : 'APPLY_'}
                            </button>
                        </div>
                        {couponError && (
                            <p style={{ color: '#d11a1a', fontSize: '0.72rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
                                {couponError.toUpperCase()}
                            </p>
                        )}
                        {couponSuccess && (
                            <p style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
                                {couponSuccess}
                             </p>
                         )}
                     </div>

                     {/* Summary & Submit */}
                     <div style={{
                         background: '#030303',
                         border: '1px solid rgba(255, 255, 255, 0.05)',
                         padding: '3.5rem 2.5rem',
                         borderRadius: '0px',
                         display: 'flex',
                         flexDirection: 'column',
                         gap: '2rem'
                     }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                             <div>
                                 <p style={{
                                     fontFamily: "'Inter', sans-serif",
                                     fontSize: '0.68rem',
                                     fontWeight: 900,
                                     color: 'rgba(255,255,255,0.4)',
                                     letterSpacing: '0.15em',
                                     textTransform: 'uppercase',
                                     marginBottom: '0.5rem'
                                 }}>AMOUNT PAYABLE_</p>
                                 {couponApplied ? (
                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                             <span style={{ textDecoration: 'line-through', opacity: 0.35, fontSize: '1.2rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
                                                 ₹{total.toFixed(2)}
                                             </span>
                                             <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.5rem', fontWeight: 800 }}>
                                                 -10% WAITLIST
                                             </span>
                                         </div>
                                         <p style={{
                                             fontFamily: "var(--font-mono, monospace)",
                                             fontSize: '2.5rem',
                                             fontWeight: 700,
                                             color: '#d11a1a',
                                             lineHeight: 1,
                                             margin: 0
                                         }}>₹{(total * 0.90).toFixed(2)}</p>
                                     </div>
                                 ) : (
                                     <p style={{
                                         fontFamily: "var(--font-mono, monospace)",
                                         fontSize: '2.5rem',
                                         fontWeight: 700,
                                         color: '#d11a1a',
                                         lineHeight: 1,
                                         margin: 0
                                     }}>₹{total.toFixed(2)}</p>
                                 )}
                             </div>
                            <button
                                disabled={loading || cart.length === 0}
                                type="submit"
                                style={{
                                    background: '#d11a1a',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '1.2rem 3rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    cursor: (loading || cart.length === 0) ? 'not-allowed' : 'pointer',
                                    borderRadius: '0px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (loading || cart.length === 0) ? 'none' : '0 6px 20px rgba(209, 26, 26, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.8rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading && cart.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(209, 26, 26, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading && cart.length > 0) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(209, 26, 26, 0.35)';
                                    }
                                }}
                            >
                                <span>{loading ? 'SECURING...' : 'SECURE THE DROP'}</span>
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <style jsx>{`
                @media (max-width: 680px) {
                    .checkout-grid {
                        grid-template-columns: 1fr !important;
                        gap: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    )
}
