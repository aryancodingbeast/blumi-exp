import { getProductById, getRelatedProducts } from '@/actions/products'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import AddToCartButton from '@/components/AddToCartButton'
import { Shield, Truck, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { auth } from '@/lib/auth'
import { checkWaitlistEmail } from '@/actions/waitlist'
import ProductImageGallery from '@/components/ProductImageGallery'

export default async function ProductPage({ 
    params,
    searchParams
}: { 
    params: { id: string },
    searchParams?: { [key: string]: string | string[] | undefined }
}) {
    // 1. Fetch product data and session in parallel (removes 1st-stage sequential block)
    const [product, session] = await Promise.all([
        getProductById(params.id),
        auth()
    ])

    if (!product) notFound()

    const userEmail = session?.user?.email || ''
    const userRole = session?.user?.role || ''

    // 2. Fetch related items and check waitlist status in parallel (removes 2nd-stage sequential block)
    const [related, check] = await Promise.all([
        getRelatedProducts(product.id),
        userEmail ? checkWaitlistEmail(userEmail) : Promise.resolve({ success: true, isRegistered: false })
    ])
    
    // Check waitlist status
    let onWaitlist = false
    if (check && check.success && check.isRegistered) {
        onWaitlist = true
    }

    // Bypass drop lock for admin/seller testing or local development
    const isBypass = userRole === 'SELLER' || userRole === 'ADMIN' || process.env.NODE_ENV === 'development' || searchParams?.bypass === 'true'

    // Drop time gates removed - immediately accessible to everyone

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                {/* Breadcrumbs / Back */}
                <Link href="/shop" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '3.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <ArrowLeft size={14} style={{ color: '#d11a1a' }} /> RETURN TO COLLECTION
                </Link>

                <div className="product-layout-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: '5rem',
                    alignItems: 'start'
                }}>
                    {/* Visual Section - Dynamic Interactive Gallery */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <ProductImageGallery images={product.images} title={product.title} />
                        {product.status?.toUpperCase() === 'SOLD' && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(3px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                pointerEvents: 'none'
                            }}>
                                <span style={{
                                    border: '3px solid #d11a1a',
                                    color: '#d11a1a',
                                    padding: '1rem 2.5rem',
                                    fontWeight: 900,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '2rem',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    transform: 'rotate(-8deg)',
                                    boxShadow: '0 0 40px rgba(209,26,26,0.3)',
                                    background: '#020202'
                                }}>
                                    SOLD OUT
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Details Section - Sticky */}
                    <div style={{ position: 'sticky', top: '10rem' }}>
                        <div style={{ marginBottom: '3.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.8rem' }}>
                                <span style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.58rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.15em',
                                    color: product.status?.toUpperCase() === 'SOLD' ? '#d11a1a' : '#ffffff',
                                    background: product.status?.toUpperCase() === 'SOLD' ? 'rgba(209, 26, 26, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                                    border: product.status?.toUpperCase() === 'SOLD' ? '1px solid rgba(209, 26, 26, 0.25)' : '1px solid rgba(255, 255, 255, 0.15)',
                                    padding: '0.35rem 0.8rem',
                                    textTransform: 'uppercase'
                                }}>
                                    {product.status?.toUpperCase() === 'SOLD' ? 'SOLD OUT' : `${product.status} EDITION`}
                                </span>
                                <div style={{ display: 'flex', gap: '0.2rem', color: '#d11a1a' }}>
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill="currentColor" stroke="none" />)}
                                </div>
                            </div>

                            <h1 style={{
                                fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                color: '#ffffff',
                                lineHeight: 1.05,
                                letterSpacing: '-0.02em',
                                marginBottom: '1.2rem'
                            }}>{product.title}</h1>

                            <p style={{
                                fontFamily: "var(--font-mono, monospace)",
                                fontSize: '2.4rem',
                                fontWeight: 700,
                                color: '#d11a1a',
                                marginBottom: '2.5rem',
                                letterSpacing: '-0.04em'
                            }}>₹{product.price}</p>

                            <div style={{ marginBottom: '3rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2rem' }}>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.62rem',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.8rem'
                                }}>PRODUCT VIBE_</p>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.95rem',
                                    lineHeight: '1.8',
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }}>
                                    {product.description || 'A definitive streetwear essential, meticulously designed for dynamic visual impact and high-fashion comfort. This unique drop represents the pinnacle of circular design, blending raw brutalist proportions with custom fabric finishes.'}
                                </p>
                            </div>

                            <div style={{
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                paddingTop: '2rem',
                                paddingBottom: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.1em'
                                }}>
                                    AVAILABLE SIZE
                                </span>
                                <span style={{
                                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                    fontSize: '1rem',
                                    fontWeight: 800,
                                    color: '#ffffff',
                                    border: '1px solid #ffffff',
                                    padding: '0.3rem 0.8rem'
                                }}>
                                    {product.description?.match(/\b(XS|S|M|L|XL|XXL)\b/i)?.[1]?.toUpperCase() || 'M'}
                                </span>
                            </div>

                            <AddToCartButton product={product} />
                        </div>

                        {/* Meta Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2.5rem' }}>
                            <div style={{ padding: '1.8rem', background: '#030303', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Truck size={18} style={{ color: '#d11a1a', marginBottom: '1rem' }} />
                                <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: '0.4rem' }}>Priority Shipping</p>
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>2-4 business days global priority tracking.</p>
                            </div>
                            <div style={{ padding: '1.8rem', background: '#030303', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <Shield size={18} style={{ color: '#d11a1a', marginBottom: '1rem' }} />
                                <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: '0.4rem' }}>Verified Source</p>
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>100% authenticity guaranteed by BLUMI.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {related.length > 0 && (
                    <div style={{ marginTop: '12rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4.5rem' }}>
                            <div>
                                <p style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    color: '#d11a1a',
                                    marginBottom: '0.6rem'
                                }}>
                                    RECOMMENDATIONS_
                                </p>
                                <h2 style={{
                                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                                    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    color: '#ffffff',
                                    lineHeight: 1,
                                    margin: 0
                                }}>
                                    YOU MIGHT ALSO LIKE
                                </h2>
                            </div>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                            gap: '4rem 2rem'
                        }}>
                            {related.map((p, i) => (
                                <ProductCard key={p.id} product={p} index={i} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
