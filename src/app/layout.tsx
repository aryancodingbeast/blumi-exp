import HeaderWrapper from '@/components/HeaderWrapper'
import Header from '@/components/Header'
import { CartProvider } from '@/components/CartContext'
import SmoothScrollManager from '@/components/SmoothScrollManager'
import GSAPProvider from '@/components/GSAPProvider'
import CartDrawer from '@/components/CartDrawer'
import { DM_Sans, Fredoka, JetBrains_Mono, Bangers } from 'next/font/google'
import { Suspense } from 'react'
import '@/styles/globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '700'] })
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700'] })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const bangers = Bangers({ subsets: ['latin'], variable: '--font-heading', weight: '400' })

export const dynamic = 'force-dynamic'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${dmSans.variable} ${fredoka.variable} ${jetbrains.variable} ${bangers.variable}`}>
            <body className="paper-noise premium-dark-theme">
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

