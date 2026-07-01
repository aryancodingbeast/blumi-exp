import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Repeat2, Heart, ShoppingBag, Shirt } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="premium-dark-theme swap-landing">

            {/* HERO SECTION */}
            <section className="swap-hero">
                {/* Background glow effects */}
                <div className="swap-hero-glow-1" />
                <div className="swap-hero-glow-2" />

                <div className="swap-hero-content">
                    <div className="swap-hero-badge">
                        <Repeat2 size={14} />
                        <span>CLOTHES EXCHANGE PLATFORM</span>
                    </div>

                    <h1 className="swap-hero-title">
                        <span className="swap-hero-line-1">SWAP.</span>
                        <span className="swap-hero-line-2">DON&apos;T SHOP.</span>
                    </h1>

                    <p className="swap-hero-subtitle">
                        List your clothes. Swipe through others. Match and exchange — Tinder-style.
                        No money needed. Just great taste.
                    </p>

                    <div className="swap-hero-actions">
                        <Link href="/closet/add" className="swap-btn-primary">
                            LIST YOUR CLOTHES
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/swipe" className="swap-btn-secondary">
                            START SWIPING
                        </Link>
                    </div>

                    {/* Animated Swap Visual */}
                    <div className="swap-hero-visual">
                        <div className="swap-card-demo swap-card-demo-left">
                            <div className="swap-card-demo-inner">
                                <Image
                                    src="/collage-1.webp"
                                    alt="Your clothes"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                                <div className="swap-card-demo-label">YOUR ITEM</div>
                            </div>
                        </div>
                        <div className="swap-visual-arrows">
                            <Repeat2 size={32} className="swap-visual-repeat" />
                        </div>
                        <div className="swap-card-demo swap-card-demo-right">
                            <div className="swap-card-demo-inner">
                                <Image
                                    src="/collage-4.webp"
                                    alt="Their clothes"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                                <div className="swap-card-demo-label">THEIR ITEM</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="swap-how-section">
                <div className="swap-how-header">
                    <p className="swap-section-label">THE PROCESS_</p>
                    <h2 className="swap-section-title">HOW IT WORKS</h2>
                </div>

                <div className="swap-how-grid">
                    <div className="swap-how-step">
                        <div className="swap-step-number">01</div>
                        <div className="swap-step-icon">
                            <Shirt size={28} />
                        </div>
                        <h3 className="swap-step-title">LIST YOUR CLOTHES</h3>
                        <p className="swap-step-desc">
                            Upload at least 4 photos of each item. Add size, brand, and condition details.
                        </p>
                    </div>

                    <div className="swap-how-connector" />

                    <div className="swap-how-step">
                        <div className="swap-step-number">02</div>
                        <div className="swap-step-icon">
                            <Heart size={28} />
                        </div>
                        <h3 className="swap-step-title">SWIPE & DISCOVER</h3>
                        <p className="swap-step-desc">
                            Pick an item to offer, then swipe through others&apos; listings. Swipe right to like, left to pass.
                        </p>
                    </div>

                    <div className="swap-how-connector" />

                    <div className="swap-how-step">
                        <div className="swap-step-number">03</div>
                        <div className="swap-step-icon">
                            <Repeat2 size={28} />
                        </div>
                        <h3 className="swap-step-title">MATCH & EXCHANGE</h3>
                        <p className="swap-step-desc">
                            When both of you swipe right on each other&apos;s offered items — it&apos;s a match! Confirm and exchange.
                        </p>
                    </div>

                    <div className="swap-how-connector" />

                    <div className="swap-how-step">
                        <div className="swap-step-number">04</div>
                        <div className="swap-step-icon">
                            <ShoppingBag size={28} />
                        </div>
                        <h3 className="swap-step-title">OR JUST BUY</h3>
                        <p className="swap-step-desc">
                            Done swiping? Browse your liked items and buy any directly if you prefer.
                        </p>
                    </div>
                </div>
            </section>

            {/* MATCH LOGIC EXPLAINER */}
            <section className="swap-match-section">
                <div className="swap-match-inner">
                    <p className="swap-section-label">FAIR EXCHANGE_</p>
                    <h2 className="swap-match-headline">
                        A MATCH ONLY HAPPENS WHEN<br />
                        <span className="swap-match-highlight">BOTH SIDES AGREE</span>
                    </h2>
                    <p className="swap-match-explainer">
                        You pick an item to offer → Swipe right on their item → They pick their item to offer → Swipe right on your item → Only then, it&apos;s a match. Both must want what the other has. No exceptions.
                    </p>

                    <div className="swap-match-visual">
                        <div className="swap-match-step-mini">
                            <span className="mini-label">YOU</span>
                            <span className="mini-action">SWIPE RIGHT</span>
                            <ArrowRight size={14} />
                            <span className="mini-target">THEIR ITEM</span>
                        </div>
                        <div className="swap-match-plus">+</div>
                        <div className="swap-match-step-mini">
                            <span className="mini-label">THEY</span>
                            <span className="mini-action">SWIPE RIGHT</span>
                            <ArrowRight size={14} />
                            <span className="mini-target">YOUR ITEM</span>
                        </div>
                        <div className="swap-match-equals">=</div>
                        <div className="swap-match-result">
                            <Repeat2 size={18} />
                            MATCH!
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="swap-cta-section">
                <div className="swap-cta-glow" />
                <h2 className="swap-cta-title">REVCLO</h2>
                <p className="swap-cta-subtitle">YOUR CLOSET IS SOMEONE ELSE&apos;S TREASURE</p>
                <div className="swap-cta-actions">
                    <Link href="/closet/add" className="swap-btn-primary swap-btn-lg">
                        START LISTING
                        <ArrowRight size={18} />
                    </Link>
                    <Link href="/login" className="swap-btn-secondary">
                        SIGN IN WITH GOOGLE
                    </Link>
                </div>
            </section>
        </div>
    )
}
