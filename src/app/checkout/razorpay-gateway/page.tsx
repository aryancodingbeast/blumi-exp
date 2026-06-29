'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShieldCheck, CreditCard, Lock, ArrowRight, Loader2, KeyRound, Check, AlertTriangle } from 'lucide-react'
import { getSession } from 'next-auth/react'

export default function RazorpayGatewayPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // URL Search Parameters
  const buyerId = searchParams.get('buyerId') || ''
  const email = searchParams.get('email') || ''
  const name = searchParams.get('name') || ''
  const items = searchParams.get('items') || '[]'
  const total = parseFloat(searchParams.get('total') || '0')
  const phone = searchParams.get('phone') || ''
  const deliveryOption = searchParams.get('deliveryOption') || 'CAMPUS'
  const address = searchParams.get('address') || ''
  const city = searchParams.get('city') || ''
  const state = searchParams.get('state') || ''
  const pinCode = searchParams.get('pinCode') || ''
  const landmark = searchParams.get('landmark') || ''

  // Screen steps: 'DETAILS' | 'OTP' | 'PROCESSING'
  const [step, setStep] = useState<'DETAILS' | 'OTP' | 'PROCESSING'>('DETAILS')
  const [payMethod, setPayMethod] = useState<'CARD' | 'UPI'>('CARD')
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  
  // UPI Input
  const [upiId, setUpiId] = useState('')
  
  // OTP Inputs
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  
  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Simulated console logs during processing
  const [logs, setLogs] = useState<string[]>([])
  const [logIndex, setLogIndex] = useState(0)

  // Enforce body background and layout class on checkout
  useEffect(() => {
    document.body.classList.add('checkout-flow-active')
    
    const verifySession = async () => {
      const session = await getSession()
      if (!session?.user?.id) {
        router.push('/login?callbackUrl=/checkout')
      }
    }
    verifySession()

    return () => {
      document.body.classList.remove('checkout-flow-active')
    }
  }, [router])

  // Input Formatting Functions
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length > 0) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
    if (formErrors.cardNumber) {
      setFormErrors(prev => ({ ...prev, cardNumber: '' }))
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value))
    if (formErrors.expiry) {
      setFormErrors(prev => ({ ...prev, expiry: '' }))
    }
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3)
    setCvc(val)
    if (formErrors.cvc) {
      setFormErrors(prev => ({ ...prev, cvc: '' }))
    }
  }

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value)
    if (formErrors.upiId) {
      setFormErrors(prev => ({ ...prev, upiId: '' }))
    }
  }

  const validateDetailsForm = () => {
    const errors: Record<string, string> = {}
    if (payMethod === 'CARD') {
      const cleanCard = cardNumber.replace(/\s/g, '')
      if (cleanCard.length < 16) {
        errors.cardNumber = 'Card number must be 16 digits'
      }
      if (expiry.length < 5 || !expiry.includes('/')) {
        errors.expiry = 'Use MM/YY format'
      } else {
        const [monthStr, yearStr] = expiry.split('/')
        const month = parseInt(monthStr, 10)
        if (month < 1 || month > 12) {
          errors.expiry = 'Invalid month'
        }
      }
      if (cvc.length < 3) {
        errors.cvc = 'CVV must be 3 digits'
      }
    } else {
      if (!upiId.includes('@') || upiId.length < 3) {
        errors.upiId = 'Invalid UPI ID format'
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateDetailsForm()) return
    
    // Jump directly to Secure OTP Verification
    setStep('OTP')
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // REQUIRE CORRECT OTP CODE '123456' FOR TEST ENVIRONMENT SAFETY
    if (otpCode !== '123456') {
      setOtpError("TRANSACTION REFUSED: INCORRECT OTP. USE '123456' TO AUTHORIZE MOCK.")
      return
    }
    
    // Transition to simulated payment ledger console logs
    setStep('PROCESSING')
    setLogs([
      'INITIATING TRANSACTION HANDSHAKE...',
      'ESTABLISHING ENCRYPTED SECURE CHANNEL...',
      'ROUTING TRANSACTION TO RAZORPAY GATEWAY LEDGER...',
      'VERIFYING BUYER ACCOUNT CREDIT VIABILITY...',
      'RECONCILING TRANSACTION TOKEN LEDGERS...',
      'ACQUIRING GARMENT ALLOCATION IN SUPABASE...',
      'PRODUCT DB UPDATE: SOLD STATUS LOCKED...',
      'LEDGER CLEARED: SUCCESSFUL CAPTURE APPROVED!'
    ])
  }

  useEffect(() => {
    if (step === 'PROCESSING' && logIndex < logs.length) {
      const interval = setTimeout(() => {
        setLogIndex(prev => prev + 1)
      }, 550)
      return () => clearTimeout(interval)
    } else if (step === 'PROCESSING' && logIndex === logs.length) {
      // Redirect to final success router handler
      const timeout = setTimeout(() => {
        const simulatedPaymentId = `pay_simulated_${Date.now().toString().slice(-6)}`
        const simulatedOrderId = `order_simulated_${Date.now().toString().slice(-6)}`
        const successUrl = `/checkout/success?buyerId=${buyerId}&items=${encodeURIComponent(items)}&razorpay_payment_id=${simulatedPaymentId}&razorpay_order_id=${simulatedOrderId}&deliveryOption=${deliveryOption}&address=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&pinCode=${encodeURIComponent(pinCode)}&landmark=${encodeURIComponent(landmark)}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&total=${total}`
        router.push(successUrl)
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [step, logIndex, logs, buyerId, items, router, deliveryOption, address, city, state, pinCode, landmark, phone, name, email, total])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background signal-red radiant nebula */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255, 0, 0, 0.12) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#040404',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '0px',
        boxShadow: '0 40px 100px rgba(0, 0, 0, 0.95)',
        position: 'relative',
        zIndex: 10,
        padding: '3rem 2.5rem'
      }}>
        {/* Prominent Red Warning Banner explaining why simulated portal loaded */}
        <div style={{
          background: 'rgba(209, 26, 26, 0.08)',
          border: '1px solid rgba(209, 26, 26, 0.25)',
          padding: '1rem 1.2rem',
          marginBottom: '2rem',
          textAlign: 'left',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={18} style={{ color: '#d11a1a', flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans, 'Syne', sans-serif)",
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 0.25rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Razorpay API Offline (403)</h4>
            <p style={{
              fontSize: '0.58rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: 1.4,
              margin: 0
            }}>
              Your Razorpay API key is missing or unauthorized. Running in **Development Simulation Sandbox**. Please check your key credentials in `.env` to bypass.
            </p>
          </div>
        </div>

        {/* Terminal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
              <span style={{
                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: '#ffffff'
              }}>REVCLO</span>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.62rem',
                fontWeight: 900,
                color: '#ff0000',
                letterSpacing: '0.1em',
                background: 'rgba(255, 0, 0, 0.1)',
                padding: '0.15rem 0.5rem',
                borderRadius: '0px'
              }}>SECURE × RAZORPAY</span>
            </div>
            <p style={{ fontSize: '0.58rem', fontFamily: "var(--font-mono, monospace)", color: 'rgba(255, 255, 255, 0.35)', margin: 0, letterSpacing: '0.05em' }}>
              SECURED_TRANSACTION_ID // TEST_ENVIRONMENT_
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.45)' }}>
            <ShieldCheck size={16} style={{ color: '#ff0000' }} />
            <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PCI-DSS ✅</span>
          </div>
        </div>

        {/* Order Details Stack */}
        <div style={{ background: '#080808', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1.5rem 1.8rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CUSTOMER_</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff' }}>{name || 'REVCLO BUYER'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>EMAIL_</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>TOTAL AMOUNT DUE_</p>
              <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '1.85rem', fontWeight: 700, color: '#ff0000', margin: 0, lineHeight: 1 }}>₹{total.toFixed(2)}</p>
            </div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.55rem', fontFamily: "var(--font-mono, monospace)", color: '#ffffff', background: '#111', padding: '0.3rem 0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              INR CURRENCY
            </div>
          </div>
        </div>

        {/* STEP 1: PAYMENT METHOD AND CORE DETAILS FORM */}
        {step === 'DETAILS' && (
          <>
            {/* Method Toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setPayMethod('CARD')}
                style={{
                  background: payMethod === 'CARD' ? 'rgba(255, 0, 0, 0.08)' : 'transparent',
                  border: payMethod === 'CARD' ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)',
                  color: payMethod === 'CARD' ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  padding: '0.95rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <CreditCard size={14} />
                CREDIT / DEBIT
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('UPI')}
                style={{
                  background: payMethod === 'UPI' ? 'rgba(255, 0, 0, 0.08)' : 'transparent',
                  border: payMethod === 'UPI' ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)',
                  color: payMethod === 'UPI' ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  padding: '0.95rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <Lock size={14} />
                UPI TRANSFER
              </button>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {payMethod === 'CARD' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      CARD NUMBER_
                    </label>
                    <input 
                      required
                      type="text" 
                      value={cardNumber} 
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      style={{ 
                        background: '#0a0a0a', 
                        border: formErrors.cardNumber ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)', 
                        color: '#ffffff', 
                        padding: '0.95rem 1.2rem', 
                        fontSize: '0.8rem', 
                        fontFamily: "var(--font-mono, monospace)", 
                        borderRadius: '0px' 
                      }} 
                    />
                    {formErrors.cardNumber && (
                      <span style={{ fontSize: '0.58rem', color: '#ff0000', fontFamily: "var(--font-mono, monospace)" }}>{formErrors.cardNumber}</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        EXPIRY_
                      </label>
                      <input 
                        required
                        type="text" 
                        value={expiry} 
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        style={{ 
                          background: '#0a0a0a', 
                          border: formErrors.expiry ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)', 
                          color: '#ffffff', 
                          padding: '0.95rem 1.2rem', 
                          fontSize: '0.8rem', 
                          fontFamily: "var(--font-mono, monospace)", 
                          borderRadius: '0px', 
                          textAlign: 'center' 
                        }} 
                      />
                      {formErrors.expiry && (
                        <span style={{ fontSize: '0.58rem', color: '#ff0000', fontFamily: "var(--font-mono, monospace)" }}>{formErrors.expiry}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        CVV_
                      </label>
                      <input 
                        required
                        type="password" 
                        value={cvc} 
                        onChange={handleCvcChange}
                        placeholder="•••"
                        maxLength={3}
                        style={{ 
                          background: '#0a0a0a', 
                          border: formErrors.cvc ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)', 
                          color: '#ffffff', 
                          padding: '0.95rem 1.2rem', 
                          fontSize: '0.8rem', 
                          fontFamily: "var(--font-mono, monospace)", 
                          borderRadius: '0px', 
                          textAlign: 'center' 
                        }} 
                      />
                      {formErrors.cvc && (
                        <span style={{ fontSize: '0.58rem', color: '#ff0000', fontFamily: "var(--font-mono, monospace)" }}>{formErrors.cvc}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    ENTER YOUR UPI ID_
                  </label>
                  <input 
                    required
                    type="text" 
                    value={upiId} 
                    onChange={handleUpiChange}
                    placeholder="e.g. buyer@upi"
                    style={{ 
                      background: '#0a0a0a', 
                      border: formErrors.upiId ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)', 
                      color: '#ffffff', 
                      padding: '0.95rem 1.2rem', 
                      fontSize: '0.8rem', 
                      fontFamily: "var(--font-mono, monospace)", 
                      borderRadius: '0px' 
                    }} 
                  />
                  {formErrors.upiId ? (
                    <span style={{ fontSize: '0.58rem', color: '#ff0000', fontFamily: "var(--font-mono, monospace)" }}>{formErrors.upiId}</span>
                  ) : (
                    <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: "var(--font-mono, monospace)" }}>
                      A secure UPI request notification will be sent to your UPI client app.
                    </span>
                  )}
                </div>
              )}

              {/* Action Trigger */}
              <button
                type="submit"
                style={{
                  background: '#ff0000',
                  color: '#ffffff',
                  border: 'none',
                  padding: '1.1rem',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  boxShadow: '0 6px 20px rgba(255, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  marginTop: '1rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>AUTHORIZE PAYMENT TRANSACTION_</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </>
        )}

        {/* STEP 2: HIGH-FIDELITY SECURE OTP VERIFICATION SCREEN */}
        {step === 'OTP' && (
          <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', textAlign: 'center' }}>
            <div style={{ display: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'rgba(255, 0, 0, 0.08)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '0px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff0000'
              }}>
                <KeyRound size={28} />
              </div>
            </div>
            
            <div>
              <h3 style={{
                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                fontSize: '1.15rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#ffffff',
                margin: '0 0 0.5rem 0'
              }}>
                SECURE SECURITY SHIELD_
              </h3>
              <p style={{
                fontSize: '0.68rem',
                color: 'rgba(255, 255, 255, 0.45)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: '340px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                Enter the secure 6-digit transaction passcode sent to the billing phone {phone ? `(${phone.slice(0, 4)}•••${phone.slice(-3)})` : 'on your profile'} to authorize this charge.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                required
                type="text" 
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ''))
                  setOtpError('')
                }}
                placeholder="ENTER 6-DIGIT OTP"
                style={{ 
                  background: '#0a0a0a', 
                  border: otpError ? '1px solid #ff0000' : '1px solid rgba(255,255,255,0.08)', 
                  color: '#ffffff', 
                  padding: '1rem 1.4rem', 
                  fontSize: '1rem', 
                  fontFamily: "var(--font-mono, monospace)", 
                  borderRadius: '0px',
                  textAlign: 'center',
                  letterSpacing: '0.4em',
                  width: '100%',
                  maxWidth: '240px'
                }} 
              />
              {otpError ? (
                <span style={{ fontSize: '0.58rem', color: '#ff0000', fontFamily: "var(--font-mono, monospace)", marginTop: '0.3rem' }}>{otpError}</span>
              ) : (
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontFamily: "var(--font-mono, monospace)", marginTop: '0.3rem' }}>
                  USE CODE <strong style={{ color: '#ff0000' }}>123456</strong> FOR DEVELOPMENT AUTHORIZATION.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                type="submit"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '0px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>CONFIRM & SUBMIT TRANSACTION</span>
                <Check size={14} />
              </button>

              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                CANCEL & GO BACK
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DYNAMIC SECURE TRANSACTION LEDGER PROCESSING */}
        {step === 'PROCESSING' && (
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#ff0000' }} />
              <div>
                <h3 style={{
                  fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                  fontSize: '1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  margin: '0 0 0.2rem 0'
                }}>
                  AUTHORIZING CHARGE...
                </h3>
                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Securing Razorpay Payments token authentication allocation ledger.
                </p>
              </div>
            </div>

            {/* Monospace ledger console */}
            <div style={{
              background: '#020202',
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '1.5rem',
              fontFamily: "var(--font-mono, monospace)",
              fontSize: '0.58rem',
              color: '#ff0000',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minHeight: '160px',
              textAlign: 'left'
            }}>
              {logs.slice(0, logIndex).map((log, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  opacity: i === logIndex - 1 ? 1 : 0.45,
                  transition: 'opacity 0.2s ease'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
              {logIndex < logs.length && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>&gt;</span>
                  <span className="animate-pulse" style={{ color: '#ffffff' }}>_</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '2rem', marginBottom: 0 }}>
          This is a secure gateway transaction routed through Razorpay Payments (Next.js client interface). Standard lookbook terms apply.
        </p>
      </div>
    </div>
  )
}
