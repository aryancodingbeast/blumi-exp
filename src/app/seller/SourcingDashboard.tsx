import Link from 'next/link'
import Image from 'next/image'
import { Plus, BarChart3, TrendingUp, Package, IndianRupee } from 'lucide-react'
import { Product } from '@/types'
import type { RevenueStats, SourcingDemand } from '@/lib/dashboardStore'

interface SourcingDashboardProps {
    products: Product[]
    demands: SourcingDemand[]
    revenue: RevenueStats
    userName: string
}

function formatInr(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`
}

function statusLabel(status: Product['status']) {
    switch (status) {
        case 'ACTIVE': return 'Live'
        case 'SOLD': return 'Sold'
        case 'EXCHANGED': return 'Exchanged'
        case 'BLOCKED': return 'Blocked'
        default: return status
    }
}

export default function SourcingDashboard({ products, demands, revenue, userName }: SourcingDashboardProps) {
    const activeCount = products.filter(p => p.status === 'ACTIVE').length
    const soldCount = products.filter(p => p.status === 'SOLD').length
    const totalRevenue = revenue.directSales + revenue.affiliateRevenue

    return (
        <div className="sourcing-dashboard">
            <header className="sourcing-dashboard-header">
                <div>
                    <p className="sourcing-dashboard-label">
                        <BarChart3 size={14} />
                        Sourcing Intelligence
                    </p>
                    <h1 className="sourcing-dashboard-title">Your Listings</h1>
                    <p className="sourcing-dashboard-subtitle">
                        Items you&apos;ve listed for sale — visible to the stylist and community archive.
                    </p>
                </div>
                <Link href="/seller/new" className="sourcing-list-btn">
                    <Plus size={16} />
                    List New Item
                </Link>
            </header>

            <div className="sourcing-stats-row">
                <div className="sourcing-stat-card">
                    <Package size={16} className="sourcing-stat-icon" />
                    <div>
                        <span className="sourcing-stat-value">{activeCount}</span>
                        <span className="sourcing-stat-label">Active listings</span>
                    </div>
                </div>
                <div className="sourcing-stat-card">
                    <TrendingUp size={16} className="sourcing-stat-icon" />
                    <div>
                        <span className="sourcing-stat-value">{soldCount}</span>
                        <span className="sourcing-stat-label">Sold</span>
                    </div>
                </div>
                <div className="sourcing-stat-card">
                    <IndianRupee size={16} className="sourcing-stat-icon" />
                    <div>
                        <span className="sourcing-stat-value">{formatInr(totalRevenue)}</span>
                        <span className="sourcing-stat-label">Session revenue</span>
                    </div>
                </div>
                <div className="sourcing-stat-card">
                    <BarChart3 size={16} className="sourcing-stat-icon" />
                    <div>
                        <span className="sourcing-stat-value">{demands.length}</span>
                        <span className="sourcing-stat-label">Demand signals</span>
                    </div>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="sourcing-empty">
                    <h2>No listings yet, {userName.split(' ')[0]}</h2>
                    <p>
                        List a vintage piece via the stylist chat or the listing flow.
                        Once live, it appears here and in the 1-of-1 archive.
                    </p>
                    <div className="sourcing-empty-actions">
                        <Link href="/" className="sourcing-list-btn">
                            <Plus size={16} />
                            List via Stylist Chat
                        </Link>
                        <Link href="/seller/new" className="sourcing-secondary-btn">
                            Use Listing Scanner
                        </Link>
                    </div>
                </div>
            ) : (
                <section className="sourcing-listings-section">
                    <div className="sourcing-section-head">
                        <h2>Your listed items</h2>
                        <span>{products.length} total</span>
                    </div>
                    <div className="sourcing-listings-grid">
                        {products.map(product => {
                            const img = product.images?.[0] || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=80'
                            const isActive = product.status === 'ACTIVE'
                            return (
                                <article key={product.id} className={`sourcing-listing-card ${!isActive ? 'sourcing-listing-card-inactive' : ''}`}>
                                    <div className="sourcing-listing-image">
                                        <Image
                                            src={img}
                                            alt={product.title}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            sizes="(max-width: 768px) 50vw, 280px"
                                        />
                                        <span className={`sourcing-status-badge status-${product.status.toLowerCase()}`}>
                                            {statusLabel(product.status)}
                                        </span>
                                    </div>
                                    <div className="sourcing-listing-info">
                                        <p className="sourcing-listing-brand">{product.brand || 'Blumi Vintage'}</p>
                                        <h3 className="sourcing-listing-title">{product.title}</h3>
                                        <div className="sourcing-listing-meta">
                                            <span>Size {product.size || 'M'}</span>
                                            <span>{product.category || 'Clothing'}</span>
                                        </div>
                                        <div className="sourcing-listing-footer">
                                            <span className="sourcing-listing-price">{formatInr(Number(product.price || 0))}</span>
                                            <span className="sourcing-listing-condition">{product.condition || 'Good'}</span>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>
            )}

            {demands.length > 0 && (
                <section className="sourcing-demands-section">
                    <div className="sourcing-section-head">
                        <h2>Buyer demand signals</h2>
                        <span>What shoppers are asking for</span>
                    </div>
                    <div className="sourcing-demands-list">
                        {demands.slice(0, 8).map((demand, idx) => (
                            <div key={`${demand.item}-${demand.size}-${idx}`} className="sourcing-demand-row">
                                <div>
                                    <p className="sourcing-demand-item">{demand.item}</p>
                                    <p className="sourcing-demand-meta">Size {demand.size} · Last {demand.lastRequest}</p>
                                </div>
                                <span className="sourcing-demand-count">{demand.requests}×</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
