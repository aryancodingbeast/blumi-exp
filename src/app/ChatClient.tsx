'use client'

import { useState, useEffect, useId, useRef } from 'react'
import { ArrowRight, ShoppingBag, Sparkles, User, Smile, Plus, Mic, HelpCircle, MessageSquare, History, Settings, ArrowUp, RefreshCw, Check, ArrowLeft, Menu, Compass, Code, BookOpen, Download, X, HelpCircle as HelpIcon, Cpu, Heart, AlertCircle, LogOut, BarChart3, ImagePlus } from 'lucide-react'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/dist/SplitText'

if (typeof window !== 'undefined' && SplitText) {
    gsap.registerPlugin(SplitText)
}

interface ProductItem {
    id: string
    title: string
    description: string
    brand: string
    size: string
    category: string
    condition: string
    price: number
    image: string
    vibe: string
    stylingNotes?: string
    url?: string
    platform?: string
    source?: 'local' | 'external'
}

interface Message {
    id: string
    sender: 'user' | 'stylist'
    text: string
    matchType?: 'local' | 'external'
    items?: ProductItem[]
    followUpChips?: string[]
    isSelling?: boolean
}

const PRESETS = [
    { label: "Wine Bar", prompt: "I'm going on a date tomorrow, he is into art, we're going to a wine bar. I want a corset but nothing too much. Help." },
    { label: "Art Gallery", prompt: "I have an art gallery opening tonight. I want something structured, oversized, and ultra-editorial in sand/beige. Size M." },
    { label: "Indie Festival", prompt: "Indie music festival tomorrow! Looking for a distressed leather jacket vibe, oversized, grunge but bold. Size L." },
    { label: "Brunch Look", prompt: "Going for weekend brunch with friends. I want a Y2K low-rise cargo denim skirt vibe, size S. Keep it casual." },
    { label: "Vintage Blazer", prompt: "Suggest a structured sand vintage wool blazer for a professional casual meeting, size M." }
]

interface SellFormProps {
    onSubmit: (details: {
        title: string
        brand: string
        size: string
        price: number
        condition: string
        category: string
        description: string
        image?: string
    }) => void
    isLoading?: boolean
}

function SellForm({ onSubmit, isLoading }: SellFormProps) {
    const photoInputId = useId()
    const [title, setTitle] = useState('')
    const [brand, setBrand] = useState('')
    const [size, setSize] = useState('M')
    const [price, setPrice] = useState('')
    const [condition, setCondition] = useState('Good')
    const [category, setCategory] = useState('clothing')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState<string | null>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit. Please upload a smaller image.')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !price.trim()) return
        onSubmit({
            title,
            brand: brand || 'Blumi Vintage',
            size,
            price: Number(price),
            condition,
            category,
            description: description || `Listed directly via chat.`,
            image: image || undefined
        })
    }

    return (
        <form onSubmit={handleSubmit} className="sell-chat-form" onClick={(e) => e.stopPropagation()}>
            <div className="form-group">
                <label>Item Name / Title</label>
                <input
                    type="text"
                    placeholder="e.g. Vintage Leather Bomber Jacket"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="sell-input"
                />
            </div>
            <div className="form-row">
                <div className="form-group flex-1">
                    <label>Brand</label>
                    <input
                        type="text"
                        placeholder="e.g. Levi's"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                        className="sell-input"
                    />
                </div>
                <div className="form-group flex-1">
                    <label>Category</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="sell-select"
                    >
                        <option value="clothing">Clothing (General)</option>
                        <option value="jacket">Jacket / Outerwear</option>
                        <option value="top">T-Shirt / Top</option>
                        <option value="bottom">Jeans / Bottoms</option>
                        <option value="shoes">Shoes / Sneakers</option>
                        <option value="dress">Dress</option>
                        <option value="accessory">Accessory</option>
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group flex-1">
                    <label>Size</label>
                    <select
                        value={size}
                        onChange={e => setSize(e.target.value)}
                        className="sell-select"
                    >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                    </select>
                </div>
                <div className="form-group flex-1">
                    <label>Price (₹)</label>
                    <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        required
                        className="sell-input"
                    />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group flex-1">
                    <label>Condition</label>
                    <select
                        value={condition}
                        onChange={e => setCondition(e.target.value)}
                        className="sell-select"
                    >
                        <option value="New">New with tags</option>
                        <option value="Excellent">Excellent (Worn once)</option>
                        <option value="Good">Good (Worn, no flaws)</option>
                        <option value="Fair">Fair (Slight wear)</option>
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea
                    placeholder="Describe any flaws, fit details, etc..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="sell-textarea"
                />
            </div>
            <div className="form-group">
                <label>Product Photo</label>
                <div className={`sell-photo-uploader ${image ? 'has-image' : ''}`}>
                    {image ? (
                        <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image}
                            alt="Product preview"
                            className="sell-photo-preview"
                        />
                        <button
                            type="button"
                            onClick={() => setImage(null)}
                            className="sell-photo-remove"
                            aria-label="Remove product photo"
                        >
                            <X size={15} />
                        </button>
                        <label htmlFor={photoInputId} className="sell-photo-change">
                            Change photo
                        </label>
                        </>
                    ) : (
                        <label htmlFor={photoInputId} className="sell-photo-prompt">
                            <span className="sell-photo-icon"><ImagePlus size={22} /></span>
                            <span className="sell-photo-copy">
                                <strong>Add a clear product photo</strong>
                                <small>Front view works best · JPG, PNG or WEBP · max 5 MB</small>
                            </span>
                            <span className="sell-photo-action">Choose photo</span>
                        </label>
                    )}
                    <input
                        id={photoInputId}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="sell-photo-input"
                    />
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="submit-sell-btn">
                {isLoading ? 'Registering Item...' : 'Confirm & List Item'}
            </button>
        </form>
    )
}

export default function ChatClient({ session }: { session: Session | null }) {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [greeting, setGreeting] = useState('Afternoon')
    const [userMemory, setUserMemory] = useState({
        size: '',
        budget: '',
        vibe: '',
        dislikes: '',
        gender: '',
        history: [] as string[]
    })

    // Sidebar Modals state
    const [activeModal, setActiveModal] = useState<'menu' | 'history' | 'discover' | 'showcase' | 'download' | 'profile' | null>(null)

    // Editing memory states
    const [editSize, setEditSize] = useState('S')
    const [editBudget, setEditBudget] = useState('₹3,000 max')
    const [editVibe, setEditVibe] = useState('edgy/romantic')
    const [editDislikes, setEditDislikes] = useState('hates puff sleeves, yellow fabrics')
    const [editGender, setEditGender] = useState('female')
    const [isSavingMemory, setIsSavingMemory] = useState(false)

    // Purchase Notifications
    const [purchaseNotification, setPurchaseNotification] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)

    const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Aryan'

    // Set greeting based on time of day and real user session name
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting(`Morning, ${firstName}`)
        else if (hour < 17) setGreeting(`Afternoon, ${firstName}`)
        else setGreeting(`Evening, ${firstName}`)
    }, [firstName])

    // Showcase dynamic database load
    const [showcaseItems, setShowcaseItems] = useState<any[]>([])
    const [isLoadingShowcase, setIsLoadingShowcase] = useState(false)

    useEffect(() => {
        if (activeModal === 'showcase') {
            const fetchShowcase = async () => {
                setIsLoadingShowcase(true)
                try {
                    const res = await fetch('/api/stylist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: 'GET_SHOWCASE_SYNC', userMemory: null })
                    })
                    const data = await res.json()
                    if (data.products) {
                        setShowcaseItems(data.products)
                    }
                } catch (e) {
                    console.error('Failed to fetch showcase products', e)
                } finally {
                    setIsLoadingShowcase(false)
                }
            }
            fetchShowcase()
        }
    }, [activeModal])

    // Sync profile editor fields when the profile modal opens
    useEffect(() => {
        if (activeModal === 'profile') {
            setEditSize(userMemory.size || 'S')
            setEditBudget(userMemory.budget || '')
            setEditVibe(userMemory.vibe || '')
            setEditDislikes(userMemory.dislikes || '')
            setEditGender(userMemory.gender || 'female')
        }
    }, [activeModal, userMemory])

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    // Load initial memory stats from stylist API with LocalStorage backup
    const fetchMemory = async () => {
        try {
            let localMem = null
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('blumi_stylist_memory')
                if (saved) {
                    try {
                        localMem = JSON.parse(saved)
                    } catch (err) {
                        console.error(err)
                    }
                }
            }

            const res = await fetch('/api/stylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: 'GET_MEMORY_SYNC', userMemory: localMem })
            })
            const data = await res.json()
            if (data.updatedMemory) {
                const mem = data.updatedMemory
                setUserMemory({
                    size: mem.size,
                    budget: mem.budget,
                    vibe: mem.vibe,
                    dislikes: mem.dislikes,
                    gender: mem.gender || '',
                    history: mem.history || []
                })
                setEditSize(mem.size || 'S')
                setEditBudget(mem.budget || '')
                setEditVibe(mem.vibe || '')
                setEditDislikes(mem.dislikes || '')
                setEditGender(mem.gender || 'female')

                if (typeof window !== 'undefined') {
                    localStorage.setItem('blumi_stylist_memory', JSON.stringify(mem))
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchMemory()
    }, [])

    // Synchronize userMemory to LocalStorage on updates
    useEffect(() => {
        if (typeof window !== 'undefined' && (userMemory.size || userMemory.gender || userMemory.budget)) {
            localStorage.setItem('blumi_stylist_memory', JSON.stringify(userMemory))
        }
    }, [userMemory])

    const handleSendMessage = async (textToSend: string) => {
        if (!textToSend.trim() || isLoading) return

        const userMsgId = Date.now().toString()
        const newMessages = [
            ...messages,
            { id: userMsgId, sender: 'user' as const, text: textToSend }
        ]
        setMessages(newMessages)
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/stylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: textToSend, userMemory, chatHistory: messages })
            })

            const data = await response.json()
            if (response.ok) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        sender: 'stylist',
                        text: data.stylistReply,
                        matchType: data.matchType,
                        items: data.items,
                        followUpChips: data.followUpChips,
                        isSelling: data.isSelling
                    }
                ])
                if (data.updatedMemory) {
                    setUserMemory({
                        size: data.updatedMemory.size,
                        budget: data.updatedMemory.budget,
                        vibe: data.updatedMemory.vibe,
                        dislikes: data.updatedMemory.dislikes,
                        gender: data.updatedMemory.gender || '',
                        history: data.updatedMemory.history || []
                    })
                }
            } else {
                throw new Error(data.error || 'Failed to get styling response')
            }
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'stylist',
                    text: `Oh no! My styling matrix hit a snag: ${err.message || 'connection issue'}. Let's try matching again!`
                }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmSell = async (details: {
        title: string
        brand: string
        size: string
        price: number
        condition: string
        category: string
        description: string
        image?: string
    }) => {
        setIsLoading(true)
        const userMsgId = Date.now().toString()
        setMessages(prev => [
            ...prev,
            {
                id: userMsgId,
                sender: 'user' as const,
                text: `Listing Request: ${details.brand} ${details.title} (Size ${details.size}) for ₹${details.price}`
            }
        ])

        try {
            const response = await fetch('/api/stylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `LIST_ITEM_CONFIRM: title="${details.title}" brand="${details.brand}" size="${details.size}" price=${details.price} condition="${details.condition}" category="${details.category}" description="${details.description}"`,
                    userMemory,
                    chatHistory: messages,
                    image: details.image
                })
            })

            const data = await response.json()
            if (response.ok) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        sender: 'stylist',
                        text: data.stylistReply,
                        matchType: data.matchType,
                        items: data.items,
                        followUpChips: data.followUpChips
                    }
                ])
                setMessages(prev => prev.map(msg => msg.isSelling ? { ...msg, isSelling: false } : msg))
            } else {
                throw new Error(data.error || 'Failed to list item')
            }
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'stylist',
                    text: `Ah, listing registration failed: ${err.message || 'database error'}`
                }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    // Direct purchase — registers real revenue in the sourcing dashboard
    const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
    const buyDirect = (item: ProductItem) => {
        setClaimedIds(prev => new Set(prev).add(item.id))
        setPurchaseNotification(`🎉 Claimed "${item.title}" (${item.size}) for ₹${item.price.toLocaleString('en-IN')}. It's one-of-one — and now it's yours. Arriving before Friday!`)
        setTimeout(() => setPurchaseNotification(null), 5000)
        fetch('/api/stylist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'REGISTER_PURCHASE', item: { price: item.price } })
        }).catch(() => { })
    }

    const handleNewChat = () => {
        setMessages([])
        setInputValue('')
    }

    const handleSaveMemory = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSavingMemory(true)
        try {
            const res = await fetch('/api/stylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'GET_MEMORY_SYNC',
                    userMemory: {
                        size: editSize,
                        budget: editBudget,
                        vibe: editVibe,
                        dislikes: editDislikes,
                        gender: editGender
                    }
                })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.updatedMemory) {
                    const mem = data.updatedMemory
                    setUserMemory({
                        size: mem.size,
                        budget: mem.budget,
                        vibe: mem.vibe,
                        dislikes: mem.dislikes,
                        gender: mem.gender || '',
                        history: mem.history || []
                    })
                }
                setActiveModal(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSavingMemory(false)
        }
    }

    const handleTriggerPrompt = (promptText: string) => {
        setActiveModal(null)
        handleSendMessage(promptText)
    }

    const isNewChat = messages.length === 0

    /* ------------------------------------------------------------------ */
    /* Landing hero entrance: SplitText headline, glow orbs, staggered UI  */
    /* (modeled on EditorialHero / LoginClient patterns)                   */
    /* ------------------------------------------------------------------ */
    useGSAP(() => {
        const container = heroRef.current
        if (!container || !isNewChat) return

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduceMotion) return

        const q = gsap.utils.selector(container)

        // Floating glow orbs behind the centered greeting
        const glows = q('.greeting-glow')
        if (glows.length > 0) {
            gsap.from(glows, { scale: 0.5, opacity: 0, duration: 2.2, stagger: 0.2, ease: 'power2.out' })
            const drift = [
                { x: 40, y: -30, duration: 9 },
                { x: -35, y: 25, duration: 11 },
                { x: 25, y: 35, duration: 13 }
            ]
            glows.forEach((glow, i) => {
                const d = drift[i % drift.length]
                gsap.to(glow, { ...d, repeat: -1, yoyo: true, ease: 'sine.inOut' })
            })
        }

        // SplitText char-level reveal on the greeting headline
        const titleText = container.querySelector('.greeting-title-text')
        let split: SplitText | null = null
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

        if (titleText) {
            try {
                split = new SplitText(titleText as HTMLElement, { type: 'chars' })
                tl.from(split.chars, {
                    yPercent: 110,
                    opacity: 0,
                    rotateX: -50,
                    duration: 0.9,
                    stagger: 0.025
                })
            } catch {
                /* SplitText unavailable — simple rise fallback */
                tl.from(titleText, { y: 24, opacity: 0, duration: 0.8 })
            }
        }

        tl.from(q('.greeting-tagline'), { y: 18, opacity: 0, duration: 0.7 }, '-=0.55')
            .from(q('.floating-input-box'), { y: 30, opacity: 0, scale: 0.985, duration: 0.85 }, '-=0.5')
            .from(q('.preset-pill-btn'), { y: 16, opacity: 0, duration: 0.5, stagger: 0.05 }, '-=0.6')

        return () => {
            tl.kill()
            split?.revert()
            gsap.killTweensOf(glows)
        }
    }, { scope: heroRef, dependencies: [isNewChat, greeting], revertOnUpdate: true })

    return (
        <div className="claude-theme-wrapper" ref={heroRef}>

            {/* Concept 1: full editorial sidebar */}
            <nav className="navigation-rail" aria-label="Stylist navigation">
                <div className="sidebar-brand">
                    <button className="brand-mark" aria-label="About Blumi" title="About Blumi" onClick={() => setActiveModal('menu')}>
                        <Sparkles size={25} strokeWidth={1.35} aria-hidden="true" />
                    </button>
                    <div className="brand-wordmark">AFTERNOON</div>
                    <div className="brand-byline">by Blumi</div>
                </div>

                <div className="rail-top">
                    <button className="sidebar-new-chat" onClick={handleNewChat}>
                        <Sparkles size={17} strokeWidth={1.6} aria-hidden="true" />
                        <span>New Chat</span>
                    </button>
                    <button className="rail-btn active" onClick={() => setActiveModal('history')} title="Chat history">
                        <MessageSquare size={19} strokeWidth={1.55} />
                        <span>Chats</span>
                    </button>
                    <button className="rail-btn" onClick={() => setActiveModal('showcase')} title="Your closet">
                        <BookOpen size={19} strokeWidth={1.55} />
                        <span>Closet</span>
                    </button>
                    <button className="rail-btn" onClick={() => setActiveModal('discover')} title="Lookbook">
                        <Compass size={19} strokeWidth={1.55} />
                        <span>Lookbook</span>
                    </button>
                    <button className="rail-btn" onClick={() => window.location.href = '/liked'} title="Saved looks">
                        <Heart size={19} strokeWidth={1.55} />
                        <span>Saved</span>
                    </button>
                    <button className="rail-btn seller-link" onClick={() => window.location.href = '/seller'} title="Sourcing dashboard">
                        <BarChart3 size={19} strokeWidth={1.55} />
                        <span>Seller studio</span>
                    </button>
                </div>

                <div className="rail-bottom">
                    <button className="sidebar-profile" onClick={() => setActiveModal('profile')} title={`${firstName} — edit memory profile`}>
                        <span className="profile-avatar">{firstName.charAt(0)}</span>
                        <span className="profile-copy">
                            <strong>Hey, stylist</strong>
                            <small>{firstName}&apos;s profile</small>
                        </span>
                        <Settings size={15} strokeWidth={1.5} />
                    </button>
                    <button className="sidebar-download" onClick={() => setActiveModal('download')} title="Download desktop app">
                        <Download size={15} strokeWidth={1.5} />
                        <span>Get the desktop app</span>
                    </button>
                </div>
            </nav>

            {/* Central Chat Studio Workspace */}
            <main className="chat-studio-area">
                {isNewChat ? (
                    /* Initial Centered Greeting View */
                    <div className="centered-greeting-container">
                        <section className="editorial-hero-copy">
                            <div className="hero-kicker"><span /> Your personal styling studio</div>
                            <h1 className="greeting-title">
                                <span>Good</span>
                                <span className="greeting-title-text">{greeting.replace(`, ${firstName}`, '')}</span>
                                <Sparkles className="headline-sparkle" size={34} strokeWidth={1.25} aria-hidden="true" />
                            </h1>

                            <p className="greeting-tagline">
                                ChatGPT tells you what to wear.<br />
                                <em>Blumi puts it in your closet by Friday.</em>
                            </p>

                            <div className="floating-input-box">
                                <textarea
                                    className="styled-textarea"
                                    aria-label="Ask your stylist"
                                    placeholder="How can I help you style today?"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage(inputValue)
                                        }
                                    }}
                                />

                                <div className="input-bottom-actions">
                                    <button className="composer-add" title="Upload references or images" aria-label="Upload references or images">
                                        <Plus size={19} strokeWidth={1.6} />
                                    </button>
                                    <div className="action-group-right">
                                        <div className="selector-pill">
                                            <span>Stylist 3.5 High</span>
                                            <Sparkles size={11} />
                                        </div>
                                        <button className="composer-mic" aria-label="Use voice input">
                                            <Mic size={16} strokeWidth={1.6} />
                                        </button>
                                        <button
                                            className="btn-submit-chat"
                                            aria-label="Send message"
                                            onClick={() => handleSendMessage(inputValue)}
                                            disabled={!inputValue.trim()}
                                        >
                                            <ArrowRight size={18} strokeWidth={1.8} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="preset-pills-row" aria-label="Styling ideas">
                                {PRESETS.slice(0, 4).map((p, idx) => (
                                    <button key={idx} className="preset-pill-btn" onClick={() => handleSendMessage(p.prompt)}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <div className="hero-signoff">
                                <span>Your personal stylist,<br />on demand.</span>
                                <span className="signoff-line" />
                                <Heart size={25} strokeWidth={1.35} />
                            </div>
                        </section>

                        <aside className="editorial-hero-visual" aria-label="A curated cream blazer in the Blumi studio">
                            <div className="wardrobe-arch" />
                            <div className="clothing-rail" aria-hidden="true">
                                <span className="rail-bar" />
                                <span className="rail-leg rail-leg-left" />
                                <span className="rail-leg rail-leg-right" />
                            </div>
                            <div className="garment-card garment-card-main">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&auto=format&fit=crop&q=90" alt="Cream vintage blazer" width="900" height="1125" fetchPriority="high" />
                            </div>
                            <div className="garment-card garment-card-accent">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&auto=format&fit=crop&q=88" alt="Plum statement garment" width="500" height="625" />
                            </div>
                            <div className="studio-table" aria-hidden="true">
                                <span className="studio-vase"><i /><i /><i /></span>
                                <span className="book book-one" />
                                <span className="book book-two" />
                            </div>
                            <div className="visual-note">One-of-one<br />finds, styled<br />around you. <Heart size={16} /></div>
                        </aside>
                    </div>
                ) : (
                    /* Active Chat View */
                    <>
                        <div className="active-thread-container">
                            <div className="thread-inner">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                                        <div className="message-sender">
                                            {msg.sender === 'stylist' ? 'Blumi Stylist' : firstName}
                                        </div>
                                        <div className="message-text">
                                            {msg.text}
                                            {msg.isSelling && (
                                                <SellForm onSubmit={handleConfirmSell} isLoading={isLoading} />
                                            )}
                                        </div>

                                        {/* One-tap quick replies for stylist follow-up questions */}
                                        {msg.sender === 'stylist' && msg.followUpChips && msg.followUpChips.length > 0 && (
                                            <div className="followup-chips-row">
                                                {msg.followUpChips.map((chip, cIdx) => (
                                                    <button
                                                        key={cIdx}
                                                        className="followup-chip"
                                                        onClick={() => handleSendMessage(chip)}
                                                        disabled={isLoading}
                                                    >
                                                        {chip}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Recommendations Grid */}
                                        {msg.items && msg.items.length > 0 && (
                                            <div className="stylist-recs-grid">
                                                {msg.items.map((item) => (
                                                    <div key={item.id} className="stylist-card">
                                                        {item.url ? (
                                                            <span className="card-badge external">Sourced for you</span>
                                                        ) : (
                                                            <span className="card-badge local">1-of-1 Vintage</span>
                                                        )}

                                                        <div className="card-image-box">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={item.image} alt={item.title} className="card-img" style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                                                        </div>

                                                        <div className="card-content">
                                                            <div className="card-brand">{item.brand}</div>
                                                            <div className="card-title" title={item.title}>{item.title}</div>

                                                            <div className="card-meta">
                                                                <span className="card-size">Size {item.size}</span>
                                                                <span className="card-price">₹{item.price.toLocaleString('en-IN')}</span>
                                                            </div>

                                                            {!item.url && (
                                                                <div className="urgency-ribbon">
                                                                    <span className="urgency-dot" />
                                                                    Only one exists — and it&apos;s your size
                                                                </div>
                                                            )}

                                                            {item.stylingNotes && (
                                                                <div className="card-notes">
                                                                    <strong>Styling:</strong> {item.stylingNotes}
                                                                </div>
                                                            )}

                                                            {item.url ? (
                                                                <div className="card-external-notice">
                                                                    External match — not available through Blumi
                                                                </div>
                                                            ) : claimedIds.has(item.id) ? (
                                                                <button className="card-btn buy-direct" disabled style={{ opacity: 0.75, cursor: 'default' }}>
                                                                    <Check size={13} />
                                                                    Claimed — arriving Friday
                                                                </button>
                                                            ) : (
                                                                <button className="card-btn buy-direct" onClick={() => buyDirect(item)}>
                                                                    <ShoppingBag size={13} />
                                                                    Claim Outfit
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="chat-message-row stylist">
                                        <div className="message-sender">Blumi Stylist</div>
                                        <div className="curating-status">
                                            <span className="starburst-icon">✦</span>
                                            Searching the one-of-one archive for you...
                                        </div>
                                        <div className="stylist-recs-grid">
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className="skeleton-card">
                                                    <div className="skeleton-block" style={{ height: '180px' }} />
                                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div className="skeleton-block" style={{ height: '10px', width: '40%', borderRadius: '4px' }} />
                                                        <div className="skeleton-block" style={{ height: '14px', width: '85%', borderRadius: '4px' }} />
                                                        <div className="skeleton-block" style={{ height: '30px', width: '100%', borderRadius: '8px', marginTop: '0.5rem' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Anchored Bottom Input Box */}
                        <div className="anchored-bottom-input">
                            <div className="anchored-bottom-inner">
                                {/* Small client memory status above bottom input bar */}
                                {userMemory.size && (
                                    <div className="stylist-profile-row">
                                        <span>Active Client Memory Profile:</span>
                                        <div>
                                            Size: <span className="profile-info-pill">{userMemory.size}</span> | Vibe: <span className="profile-info-pill">{userMemory.vibe}</span> | Budget: <span className="profile-info-pill">{userMemory.budget}</span> | Gender: <span className="profile-info-pill">{userMemory.gender || 'Not Set'}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="floating-input-box">
                                    <textarea
                                        className="styled-textarea"
                                        placeholder="Reply to your stylist..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage(inputValue)
                                            }
                                        }}
                                    />

                                    <div className="input-bottom-actions">
                                        <div className="action-group-left">
                                            <button className="rail-btn" style={{ width: '28px', height: '28px' }} title="Upload references / images">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <div className="action-group-right">
                                            <div className="selector-pill">
                                                <span>Stylist 3.5 High</span>
                                                <Sparkles size={10} style={{ color: 'var(--accent-yellow)' }} />
                                            </div>
                                            <button className="rail-btn" style={{ width: '28px', height: '28px' }}>
                                                <Mic size={14} />
                                            </button>
                                            <button
                                                className="btn-submit-chat"
                                                onClick={() => handleSendMessage(inputValue)}
                                                disabled={!inputValue.trim() || isLoading}
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* MODALS OVERLAYS */}
            {activeModal === 'menu' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <Sparkles size={18} style={{ color: 'var(--accent-yellow)' }} />
                            BLUMI Stylist Studio
                        </h2>
                        <div className="modal-desc" style={{ color: '#fff', fontWeight: 500 }}>
                            "AI tells you what to wear. Blumi puts it in your closet by Friday."
                        </div>
                        <p className="modal-desc">
                            Blumi is the personal stylist brand of the AI era. Instead of endless scrolling through storefront grids and matching filters, we own the decision process from chat to checkout.
                        </p>
                        <p className="modal-desc" style={{ borderLeft: '2px solid var(--accent-orange)', paddingLeft: '1rem', fontStyle: 'italic' }}>
                            We search our community one-of-one vintage database first. If we do not have it, we fallback directly to Amazon or Flipkart and earn affiliate refer-commissions.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="card-btn buy-direct" onClick={() => setActiveModal(null)} style={{ flex: 1 }}>
                                Start Curating
                            </button>
                            <button className="card-btn buy-external" onClick={() => signOut({ callbackUrl: '/login' })} style={{ flex: 1, display: 'flex', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.08)', color: '#8a8a88' }}>
                                <LogOut size={13} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'history' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <History size={18} style={{ color: 'var(--accent-yellow)' }} />
                            Styling Occasion History
                        </h2>
                        <div className="modal-desc">
                            Click to reload previous conversation styling requests from memory:
                        </div>
                        <div className="modal-item-list">
                            {userMemory.history && userMemory.history.length > 0 ? (
                                userMemory.history.map((promptText, idx) => {
                                    const displayPrompt = promptText.startsWith('Styled for: "')
                                        ? promptText.replace('Styled for: "', '').slice(0, -1)
                                        : promptText
                                    return (
                                        <div key={idx} className="modal-list-item" onClick={() => handleTriggerPrompt(displayPrompt)}>
                                            <div>
                                                <div className="modal-list-item-title">{displayPrompt}</div>
                                                <div className="modal-list-item-desc">Reload styling suggestion thread</div>
                                            </div>
                                            <ArrowRight size={14} style={{ color: '#8a8a88' }} />
                                        </div>
                                    )
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8a8a88', fontSize: '0.85rem' }}>
                                    No styling history in this session yet.<br />Start chatting to save styling moments.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'discover' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <Compass size={18} style={{ color: 'var(--accent-yellow)' }} />
                            Trending Looks & Curation
                        </h2>
                        <div className="modal-desc">
                            Discover curations based on trending Gen Z sustainable outfit lookbooks:
                        </div>
                        <div className="modal-item-list">
                            <div className="modal-list-item" onClick={() => handleTriggerPrompt("Style me a Romantic Edge corset outfit.")}>
                                <div>
                                    <div className="modal-list-item-title">Romantic Edge Vibe</div>
                                    <div className="modal-list-item-desc">Black satin lace-up corset paired with raw indigo cargo skirts.</div>
                                </div>
                                <Sparkles size={14} style={{ color: 'var(--accent-yellow)' }} />
                            </div>
                            <div className="modal-list-item" onClick={() => handleTriggerPrompt("Style me an Editorial sand suit look.")}>
                                <div>
                                    <div className="modal-list-item-title">Structured Sand Vibe</div>
                                    <div className="modal-list-item-desc">Single-breasted beige wool blazer styled over a knit halter top.</div>
                                </div>
                                <Sparkles size={14} style={{ color: 'var(--accent-yellow)' }} />
                            </div>
                            <div className="modal-list-item" onClick={() => handleTriggerPrompt("Style me a Cozy Y2K cargo skirt look.")}>
                                <div>
                                    <div className="modal-list-item-title">Cozy Y2K Brunch</div>
                                    <div className="modal-list-item-desc">Lettuce-hem mesh long-sleeves paired with distressed utility skirts.</div>
                                </div>
                                <Sparkles size={14} style={{ color: 'var(--accent-yellow)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'showcase' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <BookOpen size={18} style={{ color: 'var(--accent-yellow)' }} />
                            1-of-1 Vintage Archive
                        </h2>
                        <div className="modal-desc">
                            Select one of our newly sourced, unique vintage items in the warehouse to style:
                        </div>
                        <div className="showcase-grid-mini">
                            {isLoadingShowcase ? (
                                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem', color: '#8a8a88' }}>
                                    Syncing active listings...
                                </div>
                            ) : showcaseItems && showcaseItems.length > 0 ? (
                                showcaseItems.map((item, idx) => {
                                    const firstImage = (item.images && item.images.length > 0)
                                        ? item.images[0]
                                        : 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=80'
                                    const promptText = `Tell me more about the ${item.title} in size ${item.size || 'M'} and how to style it.`
                                    return (
                                        <div key={idx} className="showcase-card-mini" onClick={() => handleTriggerPrompt(promptText)}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={firstImage} alt={item.title} className="showcase-img-mini" />
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginTop: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8a8a88', marginTop: '0.2rem' }}>
                                                <span>Size {item.size || 'M'}</span>
                                                <span style={{ color: 'var(--accent-orange)' }}>₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem', color: '#8a8a88', fontSize: '0.85rem' }}>
                                    No community listings available yet.<br />Start listing items in the seller panel to showcase them here!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'download' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <Download size={18} style={{ color: 'var(--accent-yellow)' }} />
                            Download Desktop Client
                        </h2>
                        <p className="modal-desc">
                            The Blumi Native Desktop experience features automated outfit calendar scheduling and off-line client memory sync.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter email to join waitlist"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button className="card-btn buy-direct" onClick={() => {
                            alert("Thank you! You have been added to the desktop waitlist.");
                            setActiveModal(null);
                        }}>
                            Request Installer Link
                        </button>
                    </div>
                </div>
            )}

            {activeModal === 'profile' && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                            <X size={18} />
                        </button>
                        <h2 className="modal-title">
                            <User size={18} style={{ color: 'var(--accent-yellow)' }} />
                            Stylist Memory Profile
                        </h2>
                        <form onSubmit={handleSaveMemory}>
                            <div className="form-group">
                                <label className="form-label">Styling Gender Vibe</label>
                                <select
                                    className="form-input"
                                    value={editGender}
                                    onChange={(e) => setEditGender(e.target.value)}
                                    style={{ background: '#2b2b2b' }}
                                >
                                    <option value="female">Female Styling</option>
                                    <option value="male">Male Styling</option>
                                    <option value="unisex">Unisex / Neutral</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Size Selection</label>
                                <select
                                    className="form-input"
                                    value={editSize}
                                    onChange={(e) => setEditSize(e.target.value)}
                                    style={{ background: '#2b2b2b' }}
                                >
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget range limit</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editBudget}
                                    onChange={(e) => setEditBudget(e.target.value)}
                                    placeholder="e.g. ₹3,000 max"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Preferred Aesthetic Vibe</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editVibe}
                                    onChange={(e) => setEditVibe(e.target.value)}
                                    placeholder="e.g. edgy/romantic"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Avoid / Dislikes</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editDislikes}
                                    onChange={(e) => setEditDislikes(e.target.value)}
                                    placeholder="e.g. hates puff sleeves"
                                />
                            </div>
                            <button type="submit" className="card-btn buy-direct" disabled={isSavingMemory}>
                                {isSavingMemory ? 'Syncing...' : 'Save & Sync Memory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Simulated Notification Toast */}
            {purchaseNotification && (
                <div className="toast-panel">
                    <div className="toast-text">
                        <strong>Update:</strong> {purchaseNotification}
                    </div>
                </div>
            )}
        </div>
    )
}
