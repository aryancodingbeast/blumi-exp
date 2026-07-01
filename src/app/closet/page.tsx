import { getUserProducts } from '@/actions/products'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Repeat2, ArrowRight } from 'lucide-react'
import { Product } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClosetPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login?callbackUrl=/closet')

    let products: Product[] = []
    try {
        products = await getUserProducts(session.user.id)
    } catch (e) {
        console.error('[ClosetPage] Error:', e)
    }

    const activeCount = products.filter(p => p.status === 'ACTIVE').length
    const exchangedCount = products.filter(p => p.status === 'EXCHANGED').length

    return (
        <div className="premium-dark-page">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div className="closet-page-header">
                    <div>
                        <p className="closet-page-label">YOUR COLLECTION_</p>
                        <h1 className="closet-page-title">MY CLOSET</h1>
                    </div>
                    <div className="closet-page-stats">
                        <div className="closet-stat-box">
                            <span className="closet-stat-value">{activeCount}</span>
                            <span className="closet-stat-label">ACTIVE</span>
                        </div>
                        <div className="closet-stat-box">
                            <span className="closet-stat-value">{exchangedCount}</span>
                            <span className="closet-stat-label">EXCHANGED</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="closet-action-bar">
                    <Link href="/closet/add" className="closet-add-btn">
                        <Plus size={16} />
                        LIST NEW ITEM
                    </Link>
                    {activeCount > 0 && (
                        <Link href="/swipe" className="closet-swipe-btn">
                            <Repeat2 size={16} />
                            START SWIPING
                            <ArrowRight size={14} />
                        </Link>
                    )}
                </div>

                {/* Items Grid */}
                {products.length === 0 ? (
                    <div className="closet-empty">
                        <div className="closet-empty-inner">
                            <h2 className="closet-empty-title">YOUR CLOSET IS EMPTY_</h2>
                            <p className="closet-empty-text">
                                List your clothes to start exchanging with others.
                                You need at least one item to begin swiping.
                            </p>
                            <Link href="/closet/add" className="closet-empty-cta">
                                <Plus size={16} />
                                ADD YOUR FIRST ITEM
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="closet-grid">
                        {products.map(product => {
                            const img = product.images?.[0] || '/collage-1.webp'
                            const isExchanged = product.status === 'EXCHANGED'
                            return (
                                <div key={product.id} className={`closet-grid-card ${isExchanged ? 'closet-grid-card-exchanged' : ''}`}>
                                    <div className="closet-grid-card-image">
                                        <Image
                                            src={img}
                                            alt={product.title}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            sizes="(max-width: 768px) 50vw, 280px"
                                        />
                                        {isExchanged && (
                                            <div className="closet-grid-badge">
                                                <Repeat2 size={12} />
                                                EXCHANGED
                                            </div>
                                        )}
                                        <div className="closet-grid-photo-count">
                                            {product.images?.length || 0} photos
                                        </div>
                                    </div>
                                    <div className="closet-grid-card-info">
                                        <h3 className="closet-grid-card-title">{product.title}</h3>
                                        <div className="closet-grid-card-meta">
                                            <span>{product.size || 'Free Size'}</span>
                                            <span className="meta-dot">·</span>
                                            <span>{product.category || 'Tops'}</span>
                                            {product.brand && (
                                                <>
                                                    <span className="meta-dot">·</span>
                                                    <span>{product.brand}</span>
                                                </>
                                            )}
                                        </div>
                                        <span className={`closet-condition-badge condition-${(product.condition || 'Good').toLowerCase().replace(/ /g, '-')}`}>
                                            {product.condition || 'Good'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
