import { getProducts } from '@/actions/products'
import Link from 'next/link'
import ParallaxImage from '@/components/ParallaxImage'
import CustomLoader from '@/components/CustomLoader'
import dynamic from 'next/dynamic'

const GlobePulse = dynamic(
  () => import('@/components/ui/cobe-globe-pulse').then(mod => mod.GlobePulse),
  { ssr: false }
)
import { Instagram } from 'lucide-react'
import { Product } from '@/types'
import Image from 'next/image'

export default async function LandingPage() {
  let allProducts: Product[] = []
  try {
    allProducts = await getProducts()
  } catch (err) {
    console.error('[LandingPage] Failed to fetch products from Supabase:', err)
  }
  const featuredProducts = allProducts
    ? allProducts.filter(p => {
        if (p.title.includes('TEST')) return false
        if (p.price < 10) return false
        const img = p.images?.[0] || ''
        if (img.startsWith('/collage')) return false
        return true
      }).slice(0, 6)
    : []

  interface DisplayProduct {
    id: string
    name: string
    titleLine1: string
    titleLine2: string
    price: number
    image: string
    type: 'model' | 'packshot'
    status?: string
  }

  // Exact streetwear assets matching the reference mockup
  const fallbackProducts: DisplayProduct[] = [
    {
      id: '1',
      name: 'EDITORIAL.01 NEWS PRINT',
      titleLine1: 'EDITORIAL.01',
      titleLine2: 'NEWS PRINT',
      price: 240,
      image: '/collage-4.webp',
      type: 'model'
    },
    {
      id: '2',
      name: 'EDITORIAL.02 SATIN BUSTIER',
      titleLine1: 'EDITORIAL.02',
      titleLine2: 'SATIN BUSTIER',
      price: 290,
      image: '/collage-2.webp',
      type: 'packshot'
    },
    {
      id: '3',
      name: 'METALLIC COMPRESSION CROSS',
      titleLine1: 'METALLIC COMPRESSION',
      titleLine2: 'CROSS',
      price: 180,
      image: '/collage-3.webp',
      type: 'model'
    },
    {
      id: '4',
      name: 'ASYMMETRIC CROCHET HALTER',
      titleLine1: 'ASYMMETRIC',
      titleLine2: 'CROCHET HALTER',
      price: 480,
      image: '/collage-1.webp',
      type: 'model'
    },
    {
      id: '5',
      name: 'STREETWEAR STRIPED TUBE',
      titleLine1: 'STREETWEAR',
      titleLine2: 'STRIPED TUBE',
      price: 350,
      image: '/collage-5.webp',
      type: 'model'
    },
    {
      id: '6',
      name: 'EDITORIAL.06 SEQUIN SLIP',
      titleLine1: 'EDITORIAL.06',
      titleLine2: 'SEQUIN SLIP',
      price: 320,
      image: '/collage-6.webp',
      type: 'packshot'
    }
  ]

  const displayProducts: DisplayProduct[] = featuredProducts.length >= 6
    ? featuredProducts.map((p, idx) => {
        const fallback = fallbackProducts[idx];
        return {
          id: p.id,
          name: p.title,
          titleLine1: p.title.split(' ').slice(0, 2).join(' ').toUpperCase(),
          titleLine2: p.title.split(' ').slice(2).join(' ').toUpperCase() || 'PIECE',
          price: p.price,
          image: fallback.image,
          type: fallback.type,
          status: p.status
        };
      })
    : fallbackProducts.map(p => ({ ...p, status: 'ACTIVE' }));

  return (
    <div className="premium-dark-theme page-streetwear-root">
      <CustomLoader />

      {/* SECTION 1: HERO VIEWPORT - 3 STARK COLUMNS */}
      <section className="streetwear-hero">
        <div className="hero-left-col">
          <div className="drop-identifier-group">
            <h1 className="huge-drop-number">SYS_001_</h1>
            <span className="vertical-collection-label">COLLECTION</span>
          </div>
          <div className="active-drop-pill">
            ACTIVE DROP
          </div>
        </div>

        {/* Center Jumpsuit Model visual */}
        <div className="hero-center-col">
          <div className="hero-model-full-wrap">
            <Image 
              src="/hero-streetwear.webp" 
              alt="Streetwear Jumpsuit Model" 
              className="hero-model-full-image"
              width={1200}
              height={1800}
              priority
              quality={75}
            />
          </div>
        </div>

        {/* Right Asymmetric Display Headline */}
        <div className="hero-right-col">
          <div className="headline-typographic-stack">
            <div className="headline-line horizontal-headline">
              <span className="white-sans">CURATED.</span>
              <span className="red-serif">LIMITED.</span>
              <span className="white-sans">TIMELESS_</span>
            </div>
          </div>
        </div>
      </section>

      {/* WEBGL FLOATING CENTERPIECE CONTAINER */}
      <div className="three-floating-torus-wrapper">
        <GlobePulse className="three-canister-container" />
      </div>

      {/* SECTION 2: ASYMMETRIC COLLECTION GRID (MOSAIC COLLAGE) */}
      <section className="streetwear-grid-container">
        <div className="streetwear-mosaic-collage">
          {displayProducts.slice(0, 6).map((product, idx) => {
            const mosaicClasses = [
              "mosaic-card-0", // Card 0: span 6, row span 2
              "mosaic-card-1", // Card 1: span 3, row span 1
              "mosaic-card-2", // Card 2: span 3, row span 2
              "mosaic-card-3", // Card 3: span 3, row span 1
              "mosaic-card-4", // Card 4: span 4, row span 2
              "mosaic-card-5"  // Card 5: span 8, row span 2
            ];

            const aspectRatios = [
              "1.2",
              "1.1",
              "0.55",
              "1.1",
              "0.75",
              "1.5"
            ];

            return (
              <div key={product.id} className={`mosaic-item ${mosaicClasses[idx]}`}>
                <Link href={`/product/${product.id}`} prefetch={false} className="streetwear-card" style={{ display: 'block', height: '100%' }}>
                  <div className={`card-image-wrap ${idx % 2 === 0 ? 'model-wrap' : 'packshot-wrap'}`} style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <ParallaxImage 
                      src={product.image} 
                      alt={product.name} 
                      aspectRatio={aspectRatios[idx]}
                      drift={idx % 2 === 0 ? -20 : -10}
                    />
                    {product.status?.toUpperCase() === 'SOLD' && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3
                      }}>
                        <span style={{
                            border: '2px solid #d11a1a',
                            color: '#d11a1a',
                            padding: '0.5rem 1.2rem',
                            fontWeight: 900,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '1rem',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            transform: 'rotate(-8deg)'
                        }}>
                            SOLD OUT
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: STRAW-RED AND OBSIDIAN LIQUID FOOTER */}
      <section className="streetwear-footer-section">
        {/* Real organic blob shape and intense red ambient glow */}
        <div className="streetwear-liquid-aurora-glow"></div>
        
        <div className="footer-title-overlay">
          <h2 className="streetwear-massive-logo">REVCLO</h2>
        </div>

        <Link href="/shop" prefetch={false} className="btn-streetwear-vault">
          ENTER VAULT
        </Link>

        {/* Minimal spaced footer links */}
        <div className="streetwear-flat-links">
          <span className="link-item">REVCLO</span>
          <span className="link-item">CONNECT</span>
          <span className="link-item">LEGAL</span>
        </div>
      </section>

    </div>
  )
}
