'use client'

import { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon, X, ArrowRight, Loader2 } from 'lucide-react'
import { searchProducts } from '@/actions/products'
import { Product } from '@/types'
import Link from 'next/link'
import gsap from 'gsap'
import Image from 'next/image'

export default function SearchModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            gsap.to(modalRef.current, { 
                opacity: 1, 
                display: 'block', 
                duration: 0.3,
                onComplete: () => inputRef.current?.focus()
            })
            document.body.style.overflow = 'hidden'
        } else {
            gsap.to(modalRef.current, { 
                opacity: 0, 
                display: 'none', 
                duration: 0.3 
            })
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useEffect(() => {
        const debounce = setTimeout(async () => {
            if (query.length > 1) {
                setIsLoading(true)
                try {
                    const data = await searchProducts(query)
                    setResults(data)
                } catch (err) {
                    console.error(err)
                } finally {
                    setIsLoading(false)
                }
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(debounce)
    }, [query])

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-pill glass"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    border: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                }}
            >
                <SearchIcon size={14} />
            </button>

            <div
                ref={modalRef}
                className="search-overlay"
            >
                <div className="search-modal">
                    <div className="search-header">
                        <h2 className="search-title">Search Products</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="search-close-btn"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="search-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type to search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                        {isLoading && (
                            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        )}
                    </div>

                    <div className="search-results">
                        {results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                onClick={() => setIsOpen(false)}
                                className="search-result-item"
                            >
                                <div style={{ width: '60px', height: '60px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--border-black)' }}>
                                    <Image
                                        src={product.images[0] || 'https://via.placeholder.com/60'}
                                        alt={product.title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{product.title}</h3>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>₹{product.price.toLocaleString()}</p>
                                </div>
                                <ArrowRight size={20} opacity={0.3} />
                            </Link>
                        ))}

                        {query.length > 1 && !isLoading && results.length === 0 && (
                            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>No products found for "{query}"</p>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .search-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: none;
                    opacity: 0;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 10vh;
                }

                .search-modal {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: var(--bg-white);
                    border: var(--border-width-thick) solid var(--border-black);
                    border-radius: var(--radius-lg);
                    box-shadow: 8px 8px 0 var(--shadow-hard);
                }

                .search-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .search-title {
                    font-family: var(--font-heading);
                    font-size: 2rem;
                    text-transform: uppercase;
                }

                .search-close-btn {
                    background: none;
                    border: var(--border-width) solid var(--border-black);
                    border-radius: var(--radius-sm);
                    padding: 0.75rem;
                    cursor: pointer;
                    box-shadow: 3px 3px 0 var(--shadow-hard);
                    transition: all 0.15s ease;
                }

                .search-close-btn:hover {
                    background: var(--accent-orange);
                    transform: translate(-2px, -2px);
                    box-shadow: 4px 4px 0 var(--shadow-hard);
                }

                .search-input-wrapper {
                    margin-bottom: 2rem;
                    position: relative;
                }

                .search-input {
                    width: 100%;
                    background: var(--bg-white);
                    border: var(--border-width) solid var(--border-black);
                    border-radius: var(--radius-md);
                    padding: 1.5rem;
                    font-family: var(--font-heading);
                    font-size: 2rem;
                    text-transform: uppercase;
                    box-shadow: 4px 4px 0 var(--shadow-hard);
                }

                .search-input:focus {
                    outline: none;
                    box-shadow: 6px 6px 0 var(--shadow-hard);
                }

                .search-results {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .search-result-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border: var(--border-width) solid var(--border-black);
                    border-radius: var(--radius-md);
                    box-shadow: 3px 3px 0 var(--shadow-hard);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-decoration: none;
                    color: inherit;
                }

                .search-result-item:hover {
                    background: var(--accent-yellow);
                    transform: translate(-2px, -2px);
                    box-shadow: 4px 4px 0 var(--shadow-hard);
                }
            `}</style>
        </>
    )
}
