'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { adminCreateProduct } from '@/actions/products'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Sparkles, ArrowRight, Loader2, Image as ImageIcon, Plus, Check } from 'lucide-react'

export default function AddNewProductPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [passError, setPassError] = useState('')

  // Product Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

  // Slot 1 (Editorial Shot)
  const [imagePreview1, setImagePreview1] = useState<string | null>(null)
  const [imageBase641, setImageBase641] = useState<string | null>(null)
  const [isDragOver1, setIsDragOver1] = useState(false)
  const fileInputRef1 = useRef<HTMLInputElement>(null)

  // Slot 2 (Close-up Detail)
  const [imagePreview2, setImagePreview2] = useState<string | null>(null)
  const [imageBase642, setImageBase642] = useState<string | null>(null)
  const [isDragOver2, setIsDragOver2] = useState(false)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  // Status and Submission States
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [formError, setFormError] = useState('')

  // Enforce body background class on checkout/dashboard flows
  useEffect(() => {
    document.body.classList.add('checkout-flow-active')
    return () => {
      document.body.classList.remove('checkout-flow-active')
    }
  }, [])

  // Passcode verification
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '89078') {
      setIsAuthorized(true)
      setPassError('')
    } else {
      setPassError('ACCESS REFUSED: INVALID AUTHENTICATION PASSCODE.')
    }
  }

  // Premium browser-side canvas compression to preserve DB space and load fast
  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        } else {
          resolve(base64Str)
        }
      }
      img.onerror = () => {
        resolve(base64Str)
      }
    })
  }

  const handleImageUpload = useCallback((file: File, slot: 1 | 2) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) {
      alert('IMAGE EXCEEDS 10MB STACK LIMIT_')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        const optimized = await compressImage(base64)
        if (slot === 1) {
          setImagePreview1(optimized)
          setImageBase641(optimized)
        } else {
          setImagePreview2(optimized)
          setImageBase642(optimized)
        }
      } catch (err) {
        console.error('Image compression error:', err)
        // Fallback to uncompressed if canvas fails
        if (slot === 1) {
          setImagePreview1(base64)
          setImageBase641(base64)
        } else {
          setImagePreview2(base64)
          setImageBase642(base64)
        }
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, slot: 1 | 2) => {
    e.preventDefault()
    if (slot === 1) setIsDragOver1(false)
    else setIsDragOver2(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageUpload(file, slot)
  }, [handleImageUpload])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file, slot)
  }

  const removeImage = (slot: 1 | 2) => {
    if (slot === 1) {
      setImagePreview1(null)
      setImageBase641(null)
      if (fileInputRef1.current) fileInputRef1.current.value = ''
    } else {
      setImagePreview2(null)
      setImageBase642(null)
      if (fileInputRef2.current) fileInputRef2.current.value = ''
    }
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !price) {
      setFormError('PLEASE COMPLETE ALL MANDATORY STATIONS_')
      return
    }

    if (!imageBase641) {
      setFormError('PLEASE UPLOAD A PRIMARY EDITORIAL IMAGE FOR THIS DROP_')
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('TRANSACTION THRESHOLD ERROR: ENTER A VALID NUMERIC VALUE.')
      return
    }

    setLoading(true)
    setFormError('')
    setSuccessMsg('')

    // Collect both images (Editorial is required, detail is optional)
    const imageUrls = [imageBase641]
    if (imageBase642) {
      imageUrls.push(imageBase642)
    }

    try {
      const newProduct = await adminCreateProduct(password, {
        title,
        description,
        price: priceNum,
        imageUrls
      })

      if (newProduct?.id) {
        setSuccessMsg(`[DROP ONLINE] SUCCESSFULLY COMMITTED: "${newProduct.title}"`)
        // Reset inputs
        setTitle('')
        setDescription('')
        setPrice('')
        setImagePreview1(null)
        setImageBase641(null)
        setImagePreview2(null)
        setImageBase642(null)
        if (fileInputRef1.current) fileInputRef1.current.value = ''
        if (fileInputRef2.current) fileInputRef2.current.value = ''
      }
    } catch (err: any) {
      setFormError(err.message || 'DATABASE MUTATION REFUSED. TRY AGAIN.')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------
  // SCREEN 1: Password Security Lockbox
  // ----------------------------------------------------
  if (!isAuthorized) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-cream)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        fontFamily: 'var(--font-sans)'
      }}>
        {/* Soft warm gradient bloom */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(196, 114, 74, 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-white)',
          border: '1px solid var(--border-sand)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2.2rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgba(196, 114, 74, 0.1)',
              border: '1px solid rgba(196, 114, 74, 0.3)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-orange)',
              display: 'inline-flex'
            }}>
              <Lock size={26} />
            </div>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 0.6rem 0'
          }}>LOCKBOX SECURED_</h2>
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '280px',
            margin: '0 auto 2.2rem'
          }}>
            Input your authorized administration passcode sequence to list new active streetwear drops.
          </p>

          <form onSubmit={handleVerifyPasscode} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPassError('')
                }}
                placeholder="••••••"
                style={{
                  background: 'var(--bg-white)',
                  border: passError ? '1px solid var(--accent-orange)' : '1px solid var(--border-sand)',
                  color: 'var(--text-primary)',
                  padding: '1rem 1.2rem',
                  fontSize: '1.1rem',
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  fontFamily: 'var(--font-mono)',
                  width: '100%',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              {passError && (
                <span style={{
                  fontSize: '0.58rem',
                  color: 'var(--accent-orange)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.3rem',
                  display: 'block'
                }}>{passError}</span>
              )}
            </div>

            <button
              type="submit"
              style={{
                background: 'var(--text-primary)',
                color: 'var(--text-light)',
                border: 'none',
                padding: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-subtle)'
              }}
            >
              <span>ACCESS STATIONS</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ----------------------------------------------------
  // SCREEN 2: Editorial Creation Dashboard
  // ----------------------------------------------------
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-cream)',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6rem 1.5rem',
      fontFamily: 'var(--font-sans)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '-5%',
        right: '-5%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(196, 114, 74, 0.12) 0%, transparent 70%)',
        filter: 'blur(50px)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '680px',
        background: 'var(--bg-white)',
        border: '1px solid var(--border-sand)',
        borderRadius: 'var(--radius-md)',
        padding: '4rem 3.5rem',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Editorial Header */}
        <div style={{
          borderBottom: '1px solid var(--border-sand)',
          paddingBottom: '2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-orange)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>BLUMI ADMINISTRATION_</p>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.2rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.05
            }}>DROP CREATOR</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-sand)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 1rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--accent-orange)' }} />
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>LOCKBOX SECURED ✅</span>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div style={{
            background: 'rgba(143, 175, 138, 0.15)',
            border: '1px solid var(--accent-teal)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.1rem 1.4rem',
            marginBottom: '2.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            textTransform: 'uppercase'
          }}>
            <Check size={16} style={{ color: 'var(--accent-teal)' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {formError && (
          <div style={{
            background: 'rgba(196, 114, 74, 0.1)',
            border: '1px solid rgba(196, 114, 74, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.1rem 1.4rem',
            marginBottom: '2.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--accent-orange)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            textTransform: 'uppercase'
          }}>
            <Lock size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              GARMENT TITLE_
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BLUMI TECHNICAL BLANK"
              style={{
                background: '#fff',
                border: '1px solid var(--border-sand)',
                color: 'var(--text-primary)',
                padding: '1rem 1.2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>

          {/* Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              RETAIL VALUE (₹ INR)_
            </label>
            <input
              required
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 5.00"
              style={{
                background: '#fff',
                border: '1px solid var(--border-sand)',
                color: 'var(--text-primary)',
                padding: '1rem 1.2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                borderRadius: 'var(--radius-sm)'
              }}
            />
            <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Values under ₹1.00 will trigger simulated gateways during payment handshakes.
            </span>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              PRODUCT DETAILS & VIBE_
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the materials, fit, size variables, and structural proportions..."
              style={{
                background: '#fff',
                border: '1px solid var(--border-sand)',
                color: 'var(--text-primary)',
                padding: '1.1rem 1.4rem',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                borderRadius: 'var(--radius-sm)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Dual Image Visual Selection Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', borderTop: '1px solid var(--border-sand)', paddingTop: '2rem' }}>
            <label style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              GARMENT IMAGE FILE UPLOADS (MAX 2 PHOTOS)_
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              width: '100%'
            }}>
              {/* Slot 1: Editorial Shot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--accent-orange)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  [REQUIRED] 1. EDITORIAL / MAIN SHOT_
                </span>
                <div
                  className={`seller-upload-zone ${isDragOver1 ? 'seller-upload-zone-active' : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver1(true) }}
                  onDragLeave={() => setIsDragOver1(false)}
                  onDrop={e => handleDrop(e, 1)}
                  onClick={() => fileInputRef1.current?.click()}
                  style={{
                    border: isDragOver1 ? '2px dashed var(--accent-orange)' : '1px dashed var(--border-sand)',
                    background: isDragOver1 ? 'rgba(196, 114, 74, 0.06)' : '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {imagePreview1 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={imagePreview1}
                        alt="Editorial shot preview"
                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', border: '1px solid var(--border-sand)' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(1) }}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'var(--text-primary)',
                          color: 'var(--text-light)',
                          border: '1px solid var(--border-black)',
                          borderRadius: 'var(--radius-sm)',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                      <ImageIcon size={26} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DRAG & DROP SHOT 1_</p>
                      <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>EDITORIAL ANGLE (CLICK TO BROWSE)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef1}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e, 1)}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Slot 2: Close-up Detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  [OPTIONAL] 2. CLOSE-UP / DETAIL VIEW_
                </span>
                <div
                  className={`seller-upload-zone ${isDragOver2 ? 'seller-upload-zone-active' : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver2(true) }}
                  onDragLeave={() => setIsDragOver2(false)}
                  onDrop={e => handleDrop(e, 2)}
                  onClick={() => fileInputRef2.current?.click()}
                  style={{
                    border: isDragOver2 ? '2px dashed var(--accent-orange)' : '1px dashed var(--border-sand)',
                    background: isDragOver2 ? 'rgba(196, 114, 74, 0.06)' : '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minHeight: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {imagePreview2 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={imagePreview2}
                        alt="Detail view preview"
                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', border: '1px solid var(--border-sand)' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(2) }}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'var(--text-primary)',
                          color: 'var(--text-light)',
                          border: '1px solid var(--border-black)',
                          borderRadius: 'var(--radius-sm)',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                      <ImageIcon size={26} style={{ color: 'var(--text-muted)' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DRAG & DROP SHOT 2_</p>
                      <p style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>CLOSE-UP DETAIL (CLICK TO BROWSE)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef2}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileChange(e, 2)}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Warning */}
          <div style={{
            background: 'var(--bg-cream)',
            border: '1px solid var(--border-sand)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.2rem',
            fontSize: '0.58rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginTop: '1rem'
          }}>
            [SYSTEM PARAMETER STAMP: 24-HOUR EXPIRY CONFIGURATION ENFORCED_]<br />
            Once committed, the drop will remain active for exactly <strong>24 hours</strong>, after which it will dynamically change status to archived/expired inside lists and blocks.
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--text-primary)',
              color: 'var(--text-light)',
              border: 'none',
              padding: '1.2rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              marginTop: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>COMMITTING GARMENT...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>COMMIT & PUBLISH ACTIVE DROP</span>
              </>
            )}
          </button>

          {/* Exit Link */}
          <button
            type="button"
            onClick={() => router.push('/shop')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.58rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline'
            }}
          >
            RETURN TO SHOP ARCHIVES
          </button>
        </form>
      </div>
    </div>
  )
}
