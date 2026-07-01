import { getLikedItems } from '@/actions/likes'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, ArrowLeft, Repeat2 } from 'lucide-react'
import { LikedItem } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LikedPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login?callbackUrl=/liked')

    let likedItems: LikedItem[] = []
    try {
        likedItems = await getLikedItems()
    } catch (e) {
        console.error('[LikedPage] Error:', e)
    }

    // Filter out exchanged items
    const availableItems = likedItems.filter(item =>
        item.product && item.product.status === 'ACTIVE'
    )

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div className="closet-page-header">
                    <div>
                        <p className="closet-page-label">YOUR FAVORITES_</p>
                        <h1 className="closet-page-title">LIKED ITEMS</h1>
                    </div>
                    <div className="closet-page-stats">
                        <div className="closet-stat-box">
                            <Heart size={14} style={{ color: '#d11a1a' }} />
                            <span className="closet-stat-value">{availableItems.length}</span>
                            <span className="closet-stat-label">LIKED</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="closet-action-bar">
                    <Link href="/swipe" className="closet-add-btn">
                        <Repeat2 size={16} />
                        BACK TO SWIPING
                    </Link>
                </div>

                {availableItems.length === 0 ? (
                    <div className="closet-empty">
                        <div className="closet-empty-inner">
                            <Heart size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '1.5rem' }} />
                            <h2 className="closet-empty-title">NO LIKED ITEMS YET_</h2>
                            <p className="closet-empty-text">
                                Start swiping to discover clothes you love.
                                Items you swipe right on will appear here.
                            </p>
                            <Link href="/swipe" className="closet-empty-cta">
                                <Repeat2 size={16} />
                                START SWIPING
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="liked-buy-banner">
                            <ShoppingBag size={16} />
                            <span>Can&apos;t find an exchange? You can buy any liked item directly!</span>
                        </div>

                        <div className="closet-grid">
                            {availableItems.map(item => {
                                const product = item.product!
                                const img = product.images?.[0] || '/collage-1.webp'
                                return (
                                    <Link href={`/product/${product.id}`} key={item.id} className="closet-grid-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="closet-grid-card-image">
                                            <Image
                                                src={img}
                                                alt={product.title}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                sizes="(max-width: 768px) 50vw, 280px"
                                            />
                                            <div className="liked-heart-badge">
                                                <Heart size={14} fill="#d11a1a" />
                                            </div>
                                        </div>
                                        <div className="closet-grid-card-info">
                                            <h3 className="closet-grid-card-title">{product.title}</h3>
                                            <div className="closet-grid-card-meta">
                                                <span>{product.size || 'Free Size'}</span>
                                                <span className="meta-dot">·</span>
                                                <span>{product.condition || 'Good'}</span>
                                            </div>
                                            {product.price > 0 && (
                                                <span className="liked-price">₹{product.price}</span>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
