'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/types'
import ProductCard from './ProductCard'
import { Search, FolderOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isDropExpired } from '@/lib/expiry'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'TOPS': ['shirt', 't-shirt', 'tee', 'blouse', 'top', 'polo', 'tank'],
    'BOTTOMS': ['jeans', 'pants', 'trousers', 'shorts', 'skirt', 'chinos', 'cargos', 'joggers', 'sweatpants'],
    'OUTERWEAR': ['jacket', 'coat', 'hoodie', 'sweater', 'sweatshirt', 'cardigan', 'blazer', 'pullover'],
    'FOOTWEAR': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'],
    'DRESSES': ['dress', 'gown', 'maxi', 'midi', 'jumpsuit'],
    'ACCESSORIES': ['bag', 'cap', 'hat', 'belt', 'wallet', 'watch', 'sunglasses', 'jewelry', 'scarf']
}

export default function ShopContent({ products }: { products: Product[] }) {
    const [productsList, setProductsList] = useState<Product[]>(products)
    const [filter, setFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('NEWEST')
    const [searchQuery, setSearchQuery] = useState('')
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const checkExpiry = () => {
            setIsExpired(isDropExpired())
        }
        checkExpiry()
        const interval = setInterval(checkExpiry, 5000)
        return () => clearInterval(interval)
    }, [])

    // Supabase Realtime products table synchronization
    useEffect(() => {
        console.log('[ShopContent] Subscribing to Supabase Realtime product updates...')
        const channel = supabase
            .channel('shop-products-realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('[ShopContent] Realtime product update payload received:', payload.new)
                    setProductsList(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
                }
            )
            .subscribe()

        return () => {
            console.log('[ShopContent] Cleaning up Realtime product subscription.')
            supabase.removeChannel(channel)
        }
    }, [])

    const filtered = productsList.filter(p => {
        const queryTerm = searchQuery.toLowerCase().trim()
        const titleAndDesc = `${p.title} ${p.description || ''}`.toLowerCase()

        // 1. Search Query Filter
        if (queryTerm && !titleAndDesc.includes(queryTerm)) {
            return false
        }

        // 2. Category Filter (Keyword Matching)
        if (filter !== 'ALL') {
            const keywords = CATEGORY_KEYWORDS[filter]
            if (keywords && !keywords.some(kw => titleAndDesc.includes(kw))) {
                return false
            }
        }

        return true
    }).sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return a.price - b.price
        if (sortBy === 'PRICE_DESC') return b.price - a.price
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <div style={{ position: 'relative' }}>
            {isExpired && (
                <div style={{
                    background: 'rgba(209, 26, 26, 0.08)',
                    border: '1px solid rgba(209, 26, 26, 0.3)',
                    padding: '1.5rem 2rem',
                    marginBottom: '3.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontFamily: "var(--font-sans, 'Syne', sans-serif)",
                    textAlign: 'center',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Signal Red Accent Border Left */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', background: '#d11a1a' }} />
                    
                    <span style={{ 
                        fontFamily: "var(--font-mono, monospace)", 
                        color: '#d11a1a', 
                        fontSize: '0.72rem', 
                        fontWeight: 900, 
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase'
                    }}>
                        [SYSTEM NOTIFICATION / DROP PERIOD SECURED_]
                    </span>
                    
                    <h2 style={{ 
                        fontFamily: "'Inter', sans-serif",
                        color: '#ffffff', 
                        fontSize: '1.4rem', 
                        fontWeight: 900, 
                        letterSpacing: '0.05em', 
                        textTransform: 'uppercase',
                        margin: '0.4rem 0'
                    }}>
                        THIS EXCLUSIVE DROP HAS FINISHED
                    </h2>
                    
                    <p style={{ 
                        fontFamily: "'Inter', sans-serif", 
                        color: 'rgba(255, 255, 255, 0.45)', 
                        fontSize: '0.78rem', 
                        fontWeight: 600,
                        maxWidth: '600px',
                        lineHeight: 1.5,
                        margin: 0
                    }}>
                        The collection release window has closed. All 1/1 drops are now archived, and future checkouts are disabled for this drop series.
                    </p>
                </div>
            )}

            {/* Search Top Bar */}
            <div className="shop-search-bar">
                <div className="search-input-wrap">
                    <Search size={16} className="search-icon" style={{ color: '#d11a1a' }} />
                    <input 
                        type="text" 
                        placeholder="SEARCH ARCHIVE / DESIGNERS / KEYWORDS..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Filters & Sorting */}
            <div className="shop-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
                <div className="category-tabs" style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    <button 
                        onClick={() => setFilter('ALL')}
                        className={`tab-btn ${filter === 'ALL' ? 'active-tab' : ''}`}
                    >
                        ALL ARCHIVES
                    </button>
                    {Object.keys(CATEGORY_KEYWORDS).map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`tab-btn ${filter === cat ? 'active-tab' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                
                <div className="shop-sort" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0.6rem 1.2rem', background: '#0a0a0a' }}>
                    <span className="label-caps" style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.1em' }}>SORT BY_</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="shop-sort-select"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <option value="NEWEST" style={{ background: '#0a0a0a' }}>NEWEST RELEASES</option>
                        <option value="PRICE_ASC" style={{ background: '#0a0a0a' }}>PRICE: LOW TO HIGH</option>
                        <option value="PRICE_DESC" style={{ background: '#0a0a0a' }}>PRICE: HIGH TO LOW</option>
                    </select>
                </div>
            </div>

            {/* Results Grid / Empty State */}
            {filtered.length > 0 ? (
                <div className="shop-grid">
                    {filtered.map((product, i) => (
                        <ProductCard key={product.id} product={product} index={i} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FolderOpen size={40} style={{ color: '#d11a1a', marginBottom: '1.5rem', opacity: 0.8 }} />
                    <h3 style={{ fontFamily: "var(--font-sans, 'Syne', sans-serif)", fontWeight: 800, fontSize: '1.2rem', color: '#ffffff', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>NO ARTIFACTS UNLOCKED</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.6, margin: '0 auto 2rem' }}>
                        The query did not match any drops currently secured in the repository.
                    </p>
                    {(searchQuery || filter !== 'ALL') && (
                        <button 
                            onClick={() => { setSearchQuery(''); setFilter('ALL') }}
                            style={{
                                background: '#ffffff',
                                border: 'none',
                                color: '#000000',
                                padding: '0.8rem 2rem',
                                fontSize: '0.68rem',
                                fontWeight: 900,
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            RESET FILTERS
                        </button>
                    )}
                </div>
            )}

            <style jsx>{`
                .shop-search-bar {
                    margin-bottom: 3.5rem;
                }
                .search-input-wrap {
                    display: flex;
                    align-items: center;
                    background: #050505;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 0px; /* Sharp streetwear edges */
                    padding: 1.1rem 1.8rem;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .search-input-wrap:focus-within {
                    border-color: #d11a1a;
                    background: #080808;
                    box-shadow: 0 10px 30px rgba(209, 26, 26, 0.1);
                }
                .search-icon {
                    margin-right: 1.2rem;
                }
                .search-input {
                    flex: 1;
                    border: none;
                    background: none;
                    outline: none;
                    font-size: 0.8rem;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    color: #ffffff;
                }
                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.25);
                }

                .tab-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.5);
                    padding: 0.65rem 1.4rem;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                    border-radius: 0px;
                }

                .tab-btn:hover {
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .active-tab {
                    color: #ffffff;
                    background: #d11a1a;
                    border-color: #d11a1a;
                    box-shadow: 0 4px 12px rgba(209, 26, 26, 0.35);
                }

                .shop-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
                    gap: 4rem 2rem;
                    padding-bottom: 8rem;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 8rem 2rem;
                    text-align: center;
                    background: #020202;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 0px;
                    margin-top: 2rem;
                }

                @media (min-width: 900px) {
                    /* Stagger effect: offset every even child slightly down */
                    .shop-grid > :global(a):nth-child(even) {
                        transform: translateY(2.8rem);
                    }
                }

                @media (max-width: 768px) {
                    .shop-grid {
                        gap: 2.5rem 1.5rem;
                    }
                }
            `}</style>
        </div>
    )
}
