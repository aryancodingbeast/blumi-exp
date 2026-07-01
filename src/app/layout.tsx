import HeaderWrapper from '@/components/HeaderWrapper'
import Header from '@/components/Header'
import { CartProvider } from '@/components/CartContext'
import SmoothScrollManager from '@/components/SmoothScrollManager'
import GSAPProvider from '@/components/GSAPProvider'
import CartDrawer from '@/components/CartDrawer'
import { Playfair_Display, Outfit, Caveat, JetBrains_Mono } from 'next/font/google'
import { Suspense } from 'react'
import '@/styles/globals.css'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '600', '700'] })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', weight: ['300', '400', '500', '600'] })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['400'] })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const dynamic = 'force-dynamic'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${outfit.variable} ${playfair.variable} ${caveat.variable} ${jetbrains.variable}`}>
            <body className="paper-noise">
                <CartProvider>
                    <GSAPProvider>
                        <Suspense fallback={<Header session={null} />}>
                            <HeaderWrapper />
                        </Suspense>
                        <CartDrawer />
                        <SmoothScrollManager>
                            <main style={{ minHeight: '80vh' }}>{children}</main>
                        </SmoothScrollManager>
                    </GSAPProvider>

                    <footer className="site-footer comic-footer">
                        <div className="footer-inner">
                            <div>
                                <p className="footer-brand">REVCLO</p>
                                <p className="label-caps" style={{ opacity: 0.6 }}>(c) 2026 REVCLO COLLECTIVE</p>
                            </div>

                            <div className="footer-columns">
                                <div>
                                    <p className="label-caps footer-title">Connect</p>
                                    <div className="footer-links">
                                        <a 
                                            href="https://instagram.com/revclo.igdtu" 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="label-caps footer-link" 
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            Instagram
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <p className="label-caps footer-title">Legal</p>
                                    <div className="footer-links">
                                        <span className="label-caps footer-link">Privacy</span>
                                        <span className="label-caps footer-link">Terms</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </CartProvider>
            </body>
        </html>
    )
}

