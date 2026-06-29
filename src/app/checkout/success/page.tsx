'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { placeOrder } from '@/actions/orders'
import { syncOrderToShiprocket } from '@/actions/shiprocket'
import { registerCampusOrder } from '@/actions/campusOrders'
import { useCart } from '@/components/CartContext'
import { CheckCircle2, ArrowRight, Loader2, Copy, Check } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [awbCode, setAwbCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const buyerId = searchParams.get('buyerId') || ''
  const itemsStr = searchParams.get('items') || '[]'

  useEffect(() => {
    document.body.classList.add('checkout-flow-active')
    const processOrderRegistration = async () => {
      if (!buyerId || !itemsStr) {
        setLoading(false)
        return
      }

      try {
        const items = JSON.parse(itemsStr)
        if (items.length > 0) {
          const totalParam = searchParams.get('total')
          const totalAmount = totalParam ? parseFloat(totalParam) : items.reduce((acc: number, item: any) => acc + (item.price || 0), 0)

          // Register the secure order inside database
          const order = await placeOrder(buyerId, items.map((i: any) => ({
            productId: i.productId,
            price: i.price,
            title: i.title
          })), totalAmount)
          setOrderId(order.id)
          
          const name = searchParams.get('name') || ''
          const phone = searchParams.get('phone') || ''
          const deliveryOption = searchParams.get('deliveryOption') || 'CAMPUS'
          const address = searchParams.get('address') || ''
          const city = searchParams.get('city') || ''
          const state = searchParams.get('state') || ''
          const pinCode = searchParams.get('pinCode') || ''
          const landmark = searchParams.get('landmark') || ''
          const email = searchParams.get('email') || 'buyer@revclo.com'

          // Sync with Shiprocket shipping engine only if deliveryOption is DOORSTEP (skip for campus pickups)
          if (deliveryOption !== 'CAMPUS') {
            try {
              console.log('Syncing order parameters with Shiprocket dynamic logistics...')
              const shiprocketResult = await syncOrderToShiprocket(
                order.id,
                buyerId,
                totalAmount,
                {
                  name,
                  email,
                  phone,
                  deliveryOption,
                  address,
                  city,
                  state,
                  pinCode,
                  landmark
                },
                items.map((i: any) => ({
                  productId: i.productId,
                  price: i.price,
                  title: i.title
                }))
              )
              if (shiprocketResult?.success && shiprocketResult.awbCode) {
                setAwbCode(shiprocketResult.awbCode)
              }
            } catch (shiprocketErr) {
              console.error('Shiprocket sync error:', shiprocketErr)
            }
          }

          // Register in campus orders if selected deliveryOption is CAMPUS
          if (deliveryOption === 'CAMPUS') {
            try {
              console.log('[success] Registering secure campus order verification ledger...')
              await registerCampusOrder({
                orderId: order.id,
                buyerId: buyerId,
                name: name,
                phone: phone,
                email: email,
                totalAmount: totalAmount,
                items: items.map((i: any) => ({ productId: i.productId, price: i.price, title: i.title }))
              })
            } catch (campusErr) {
              console.error('[success] Failed to register campus order:', campusErr)
            }
          }

          // Empty the shopping bag
          clearCart()
        }
      } catch (err) {
        console.error('Error finalising payment transaction registration:', err)
      } finally {
        setLoading(false)
      }
    }

    processOrderRegistration()

    return () => {
      document.body.classList.remove('checkout-flow-active')
    }
  }, [buyerId, itemsStr, searchParams])

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
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#040404',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '0px',
        padding: '3.5rem 2.5rem',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.95)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 0' }}>
            <Loader2 size={44} className="animate-spin" style={{ color: '#ff0000' }} />
            <div>
              <h2 style={{ fontFamily: "var(--font-sans, 'Syne', sans-serif)", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                SECURING YOUR FIT...
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Writing payment ledger confirmation details to secure drop...
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle2 size={54} style={{ color: '#ff0000', marginBottom: '1.8rem' }} />
            
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.62rem',
              fontWeight: 900,
              color: '#ff0000',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}>TRANSACTION SUCCESSFUL_</p>
            
            <h1 style={{
              fontFamily: "var(--font-sans, 'Syne', sans-serif)",
              fontSize: '2rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#ffffff',
              lineHeight: 1.1,
              margin: '0 0 1.2rem 0',
              letterSpacing: '0.02em'
            }}>DRIP SECURED</h1>
            
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
              maxWidth: '380px',
              margin: '0 auto 2.5rem'
            }}>
              Your payment via Razorpay has been fully authenticated. The physical garments are locked and marked as sold for checkout validation.
            </p>

            {orderId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginBottom: '2.5rem' }}>
                <div style={{
                  background: '#080808',
                  border: '1px solid rgba(255,255,255,0.04)',
                  padding: '1rem 1.4rem',
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: '0.64rem',
                  color: 'rgba(255,255,255,0.65)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>ORDER_ID</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>{orderId.substring(0, 8)}...</span>
                </div>

                {awbCode && (
                  <div style={{
                    background: '#080808',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '1.2rem 1.4rem',
                    textAlign: 'left',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: '0.58rem',
                        fontWeight: 900,
                        color: '#d11a1a',
                        letterSpacing: '0.1em'
                      }}>[SHIPMENT STATUS: PROCESSED_]</span>
                      <span style={{
                        fontSize: '0.55rem',
                        color: 'rgba(255, 255, 255, 0.35)',
                        fontFamily: "var(--font-mono, monospace)"
                      }}>VIA SHIPROCKET</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.15rem 0', fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AWB TRACKING NUMBER_</p>
                        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{awbCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(awbCode)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        style={{
                          background: copied ? 'rgba(209, 26, 26, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: copied ? '1px solid #d11a1a' : '1px solid rgba(255,255,255,0.08)',
                          color: copied ? '#d11a1a' : '#ffffff',
                          padding: '0.45rem 0.8rem',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          borderRadius: '0px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontFamily: "var(--font-mono, monospace)",
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {copied ? (
                          <>
                            <Check size={10} style={{ color: '#d11a1a' }} />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>COPY AWB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/orders')}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '1rem 2.2rem',
                fontSize: '0.78rem',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '0px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                transition: 'all 0.3s ease',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <span>ENTER YOUR CLOSET</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
