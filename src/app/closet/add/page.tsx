'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createProduct } from '@/actions/products'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Image as ImageIcon, Plus, Check, X } from 'lucide-react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']
const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']
const CONDITIONS = ['New with Tags', 'Like New', 'Good', 'Fair']

export default function AddClosetItemPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [brand, setBrand] = useState('')
    const [size, setSize] = useState('M')
    const [category, setCategory] = useState('Tops')
    const [condition, setCondition] = useState('Good')
    const [price, setPrice] = useState('')

    // 4 image slots
    const [images, setImages] = useState<(string | null)[]>([null, null, null, null])
    const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [formError, setFormError] = useState('')

    useEffect(() => {
        document.body.classList.add('checkout-flow-active')
        return () => document.body.classList.remove('checkout-flow-active')
    }, [])

    const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.src = base64Str
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                if (width > height) {
                    if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
                } else {
                    if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight }
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.82))
                } else resolve(base64Str)
            }
            img.onerror = () => resolve(base64Str)
        })
    }

    const handleImageUpload = useCallback((file: File, slot: number) => {
        if (!file.type.startsWith('image/')) return
        if (file.size > 10 * 1024 * 1024) {
            alert('Image exceeds 10MB limit')
            return
        }
        const reader = new FileReader()
        reader.onload = async (e) => {
            const base64 = e.target?.result as string
            try {
                const optimized = await compressImage(base64)
                setImages(prev => {
                    const next = [...prev]
                    next[slot] = optimized
                    return next
                })
            } catch {
                setImages(prev => {
                    const next = [...prev]
                    next[slot] = base64
                    return next
                })
            }
        }
        reader.readAsDataURL(file)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, slot: number) => {
        e.preventDefault()
        setDragOverSlot(null)
        const file = e.dataTransfer.files?.[0]
        if (file) handleImageUpload(file, slot)
    }, [handleImageUpload])

    const removeImage = (slot: number) => {
        setImages(prev => {
            const next = [...prev]
            next[slot] = null
            return next
        })
        if (fileInputRefs.current[slot]) fileInputRefs.current[slot]!.value = ''
    }

    const filledImages = images.filter(Boolean).length

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !description) {
            setFormError('Please fill in title and description.')
            return
        }
        if (filledImages < 4) {
            setFormError(`Please upload at least 4 images. You have ${filledImages}.`)
            return
        }

        setLoading(true)
        setFormError('')
        setSuccessMsg('')

        try {
            const formData = new FormData()
            formData.set('title', title)
            formData.set('description', description)
            formData.set('price', price || '0')
            formData.set('images', JSON.stringify(images.filter(Boolean)))
            formData.set('size', size)
            formData.set('category', category)
            formData.set('condition', condition)
            formData.set('brand', brand)

            const newProduct = await createProduct(formData)

            if (newProduct?.id) {
                setSuccessMsg(`Listed: "${newProduct.title}" — now available for exchange!`)
                setTimeout(() => router.push('/closet'), 1500)
            }
        } catch (err: any) {
            setFormError(err.message || 'Failed to list item. Try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="premium-dark-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem', paddingBottom: '4rem' }}>
            <div style={{ width: '100%', maxWidth: '720px' }}>
                {/* Header */}
                <div className="closet-add-header">
                    <button onClick={() => router.push('/closet')} className="closet-add-back">
                        <ArrowLeft size={16} />
                        BACK TO CLOSET
                    </button>
                    <div>
                        <p className="closet-add-label">NEW LISTING_</p>
                        <h1 className="closet-add-title">LIST YOUR CLOTHES</h1>
                    </div>
                </div>

                {/* Feedback */}
                {successMsg && (
                    <div className="closet-add-success">
                        <Check size={16} />
                        <span>{successMsg}</span>
                    </div>
                )}
                {formError && (
                    <div className="closet-add-error">
                        <X size={16} />
                        <span>{formError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="closet-add-form">
                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">TITLE_</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Vintage Levi's Denim Jacket"
                            className="form-input"
                        />
                    </div>

                    {/* Brand */}
                    <div className="form-group">
                        <label className="form-label">BRAND_</label>
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g. Levi's, Nike, Zara"
                            className="form-input"
                        />
                    </div>

                    {/* Size, Category, Condition Row */}
                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label">SIZE_</label>
                            <select value={size} onChange={(e) => setSize(e.target.value)} className="form-select">
                                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">CATEGORY_</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">CONDITION_</label>
                            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="form-select">
                                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">DESCRIPTION_</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the item — materials, fit, any defects, why you're swapping it..."
                            className="form-textarea"
                        />
                    </div>

                    {/* Optional Price (for buy fallback) */}
                    <div className="form-group">
                        <label className="form-label">PRICE (OPTIONAL — FOR DIRECT PURCHASE)_</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                            placeholder="₹ Leave blank for exchange-only"
                            className="form-input"
                        />
                        <span className="form-hint">If set, users who liked this item can buy it after swiping.</span>
                    </div>

                    {/* 4 Image Slots */}
                    <div className="form-group">
                        <label className="form-label">
                            PHOTOS (MINIMUM 4 REQUIRED)_ <span className="form-counter">{filledImages}/4</span>
                        </label>
                        <div className="image-slots-grid">
                            {[0, 1, 2, 3].map(slot => (
                                <div
                                    key={slot}
                                    className={`image-slot ${images[slot] ? 'image-slot-filled' : ''} ${dragOverSlot === slot ? 'image-slot-dragover' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot) }}
                                    onDragLeave={() => setDragOverSlot(null)}
                                    onDrop={(e) => handleDrop(e, slot)}
                                    onClick={() => !images[slot] && fileInputRefs.current[slot]?.click()}
                                >
                                    {images[slot] ? (
                                        <div className="image-slot-preview">
                                            <img src={images[slot]!} alt={`Photo ${slot + 1}`} />
                                            <button
                                                type="button"
                                                className="image-slot-remove"
                                                onClick={(e) => { e.stopPropagation(); removeImage(slot) }}
                                            >
                                                <X size={12} />
                                            </button>
                                            <span className="image-slot-number">{slot + 1}</span>
                                        </div>
                                    ) : (
                                        <div className="image-slot-empty">
                                            <ImageIcon size={24} />
                                            <span className="image-slot-label">
                                                {slot === 0 ? 'MAIN SHOT' : slot === 1 ? 'BACK VIEW' : slot === 2 ? 'DETAIL' : 'FULL VIEW'}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        ref={el => { fileInputRefs.current[slot] = el }}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(file, slot)
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="closet-add-submit"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                LISTING ITEM...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                LIST FOR EXCHANGE
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
