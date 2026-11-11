'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Edit3,
    ExternalLink,
    Globe,
    Loader2,
    Plus,
    Ruler,
    Search,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import {
    AuthenticatedMarketplaceUser,
    createRevcloListing,
    getCurrentUser,
} from '@/actions/marketplace';
import {
    REVCLO_BRANDS_CATALOG,
    REVCLO_CATEGORIES_CATALOG,
    REVCLO_SIZE_GUIDE,
    REVCLO_SIZE_OPTIONS,
} from '@/lib/revcloSeedData';
import GuidedGarmentScannerModal from '@/components/revclo/GuidedGarmentScannerModal';
import type { GooglePriceAgentReport } from '@/lib/supabasePriceAgent';

type ConditionOption = 'Pristine' | 'Excellent' | 'Good' | 'Well-loved';
const CONDITIONS: ConditionOption[] = [
    'Pristine',
    'Excellent',
    'Good',
    'Well-loved',
];

const CONDITION_DESCRIPTIONS: Record<ConditionOption, string> = {
    Pristine: 'Flawless archive condition. Unworn or worn once with zero visible wear.',
    Excellent: 'Lightly worn with crisp fabric structure and no stains or pulls.',
    Good: 'Gently pre-loved with minor natural wear consistent with age.',
    'Well-loved': 'Visible vintage character or patina priced fairly for quick resale.',
};

type ActivePickerSheet = 'category' | 'subCategory' | 'brand' | 'sizeGuide' | null;

export default function SellFlowPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sizeScrollRef = useRef<HTMLDivElement>(null);

    const [currentUser, setCurrentUser] = useState<AuthenticatedMarketplaceUser | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Media & AI state — starts EMPTY (matching Figma 263:11620)
    const [images, setImages] = useState<string[]>([]);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [agentScanning, setAgentScanning] = useState(false);
    const [agentReport, setAgentReport] = useState<GooglePriceAgentReport | null>(null);

    // Step 1 fields
    const [condition, setCondition] = useState<ConditionOption>('Pristine');
    const [title, setTitle] = useState('');
    const [activeStatus, setActiveStatus] = useState(true);
    const [description, setDescription] = useState('');

    // Step 2 fields
    const [department, setDepartment] = useState<'Women' | 'Men'>('Women');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [size, setSize] = useState('S');

    // Step 2 Bottom Sheet / Modal state (Figma 263:9672, 263:10861, 263:11852)
    const [activeSheet, setActiveSheet] = useState<ActivePickerSheet>(null);
    const [sheetSearch, setSheetSearch] = useState('');

    // Step 3 fields (Figma 263:13903 - 263:15757)
    const [price, setPrice] = useState<number>(0);
    const [realRetailPrice, setRealRetailPrice] = useState<number>(0);
    const [editingPrice, setEditingPrice] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        getCurrentUser()
            .then((u) => setCurrentUser(u))
            .catch(() => {});
    }, []);

    const conditionIndex = CONDITIONS.indexOf(condition);

    const runPriceAgent = async (
        nextImages: string[],
        hints?: {
            brandHint?: string;
            titleHint?: string;
            conditionHint?: ConditionOption;
        }
    ) => {
        if (nextImages.length === 0) return;
        setAgentScanning(true);
        setErrorMessage(null);
        try {
            const res = await fetch('/api/scanner/price-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: nextImages,
                    userBrandHint: hints?.brandHint || brand || undefined,
                    userTitleHint: hints?.titleHint || title || undefined,
                    userConditionHint: hints?.conditionHint || condition,
                }),
            });
            const data = await res.json();
            if (data?.success && data?.report) {
                const report: GooglePriceAgentReport = data.report;
                setAgentReport(report);
                setCondition(report.condition);
                if (!title.trim()) setTitle(report.productTitle);
                if (!brand.trim()) setBrand(report.brand);
                if (!category.trim()) setCategory(report.category || 'Tops');
                if (!subCategory.trim()) setSubCategory(report.subCategory || 'Blouses & Shirts');
                setDepartment(report.department || 'Women');
                if (report.size) setSize(report.size);
                setPrice(report.recommendedPrice);
                setRealRetailPrice(report.realRetailPrice);
                if (!description.trim()) {
                    setDescription(report.conditionDescription);
                }
            }
        } catch {
            // fallback if offline
        } finally {
            setAgentScanning(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const readers = Array.from(files).map(
            (file) =>
                new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.readAsDataURL(file);
                })
        );

        Promise.all(readers).then((newUrls) => {
            const valid = newUrls.filter(Boolean);
            const combined = [...images, ...valid].slice(0, 6);
            setImages(combined);
            runPriceAgent(combined);
        });
    };

    const handleGuidedScannerComplete = (result: {
        capturedImages: string[];
        report: GooglePriceAgentReport;
    }) => {
        setImages(result.capturedImages);
        setAgentReport(result.report);
        setCondition(result.report.condition);
        setTitle(result.report.productTitle);
        setBrand(result.report.brand);
        setCategory(result.report.category || 'Tops');
        setSubCategory(result.report.subCategory || 'Blouses & Shirts');
        setDepartment(result.report.department);
        setSize(result.report.size);
        setPrice(result.report.recommendedPrice);
        setRealRetailPrice(result.report.realRetailPrice);
        setDescription(result.report.conditionDescription);
        setScannerOpen(false);
    };

    const removeImage = (idx: number) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleStepContinue = () => {
        setErrorMessage(null);
        if (step === 1) {
            if (images.length === 0) {
                setErrorMessage('Please scan or upload at least 1 photo of your garment to continue.');
                return;
            }
            if (!title.trim()) {
                setErrorMessage('Please enter a product title.');
                return;
            }
            if (!category) setCategory(agentReport?.category || 'Tops');
            if (!subCategory) {
                const defaultSub =
                    REVCLO_CATEGORIES_CATALOG[category || 'Tops']?.subCategories?.[0] ||
                    'Blouses & Shirts';
                setSubCategory(agentReport?.subCategory || defaultSub);
            }
            if (!brand) setBrand(agentReport?.brand || 'Zara');
            if (!price) setPrice(agentReport?.recommendedPrice || 499);
            setStep(2);
        } else if (step === 2) {
            if (!category || !brand || !size) {
                setErrorMessage('Please select a Category, Brand, and Size.');
                return;
            }
            setStep(3);
        }
    };

    const handlePublish = async () => {
        setErrorMessage(null);
        if (!currentUser) {
            router.push('/login?callbackUrl=/sell');
            return;
        }
        if (images.length === 0) {
            setErrorMessage('Please upload at least one photo.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await createRevcloListing({
                name: title.trim() || 'Curated Archive Garment',
                brand: brand.trim() || 'RevClo Archive',
                price: Number(price) || 399,
                original_price: realRetailPrice || Math.round((Number(price) || 399) * 1.8),
                size: size || 'M',
                condition,
                category: category || 'Tops',
                sub_category: subCategory || 'Blouses & Shirts',
                department,
                description:
                    description.trim() ||
                    `${brand} ${title} in ${condition.toLowerCase()} condition.`,
                images,
                active: activeStatus,
                color: agentReport?.color,
                material: agentReport?.fabric,
            });

            if (!res.success) {
                setErrorMessage(res.error || 'Could not publish listing.');
                setSubmitting(false);
                return;
            }

            if (res.product?.id) {
                router.push(`/product/${res.product.id}`);
            } else {
                router.push('/closet');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to publish listing.');
            setSubmitting(false);
        }
    };

    const availableCategories = useMemo(
        () => Object.keys(REVCLO_CATEGORIES_CATALOG),
        []
    );

    const availableSubCategories = useMemo(() => {
        const catKey =
            availableCategories.find(
                (c) => c.toLowerCase() === category.toLowerCase()
            ) || 'Tops';
        return REVCLO_CATEGORIES_CATALOG[catKey]?.subCategories || [];
    }, [category, availableCategories]);

    const filteredSheetCategories = useMemo(() => {
        const q = sheetSearch.trim().toLowerCase();
        if (!q) return availableCategories;
        return availableCategories.filter((c) => c.toLowerCase().includes(q));
    }, [availableCategories, sheetSearch]);

    const filteredSheetSubCategories = useMemo(() => {
        const q = sheetSearch.trim().toLowerCase();
        if (!q) return availableSubCategories;
        return availableSubCategories.filter((s) => s.toLowerCase().includes(q));
    }, [availableSubCategories, sheetSearch]);

    const filteredSheetBrands = useMemo(() => {
        const q = sheetSearch.trim().toLowerCase();
        const list = [...REVCLO_BRANDS_CATALOG];
        if (agentReport?.brand && !list.includes(agentReport.brand)) {
            list.unshift(agentReport.brand);
        }
        if (!q) return list;
        const matches = list.filter((b) => b.toLowerCase().includes(q));
        if (matches.length === 0 && sheetSearch.trim()) {
            return [sheetSearch.trim()];
        }
        return matches;
    }, [sheetSearch, agentReport]);

    const openPicker = (sheet: ActivePickerSheet) => {
        setSheetSearch('');
        setActiveSheet(sheet);
    };

    const scrollSizes = (dir: 'left' | 'right') => {
        if (!sizeScrollRef.current) return;
        sizeScrollRef.current.scrollBy({
            left: dir === 'left' ? -160 : 160,
            behavior: 'smooth',
        });
    };

    return (
        <>
            <GuidedGarmentScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onComplete={(capturedImages, report) =>
                    handleGuidedScannerComplete({ capturedImages, report })
                }
            />

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            {/* Top Subheader */}
            <header className="revclo-page-header">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : router.back()
                        }
                        className="revclo-icon-btn"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <div>
                        <h1 className="revclo-page-title">
                            {step === 1
                                ? 'Add Media & Details'
                                : step === 2
                                  ? 'Category, Brand & Size'
                                  : 'Review & Final Price'}
                        </h1>
                        <p className="text-[11px] text-[#7C7C7C] hidden sm:block">
                            3-Step AI Guided Listing • Real-Time Google Price Discovery
                        </p>
                    </div>
                </div>

                {/* Step Progress Indicator */}
                <div className="flex items-center gap-2">
                    {([1, 2, 3] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => {
                                if (s < step || images.length > 0) setStep(s);
                            }}
                            className={`h-8 px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                                step === s
                                    ? 'bg-[#161616] text-white'
                                    : step > s
                                      ? 'bg-[#E5F6DF] text-[#007A00] border border-[#B0C988]'
                                      : 'bg-white text-[#7C7C7C] border border-[#DCD6CD]'
                            }`}
                        >
                            {step > s ? <Check size={12} /> : <span>{s}</span>}
                            <span className="hidden md:inline">
                                {s === 1 ? 'Media' : s === 2 ? 'Attributes' : 'Price & Publish'}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {errorMessage && (
                    <div className="mb-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-[13px] font-medium flex items-center justify-between">
                        <span>{errorMessage}</span>
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="text-[#B91C1C]"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {!currentUser && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-3">
                        <div className="text-[12px] text-[#92400E]">
                            <strong>Heads up:</strong> You can scan your garment and get a live Google price valuation right now. Sign in before clicking Publish in Step 3.
                        </div>
                        <Link
                            href="/login?callbackUrl=/sell"
                            className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#161616] text-white text-[12px] font-semibold"
                        >
                            Sign In
                        </Link>
                    </div>
                )}

                <div className="revclo-desktop-split">
                    {/* LEFT COLUMN ON DESKTOP: Live Interactive Preview & Google Market Valuation */}
                    <div className="hidden lg:flex flex-col gap-5 sticky top-24">
                        <div className="bg-white rounded-[20px] border border-[#DCD6CD] p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C7C7C]">
                                    LIVE LISTING PREVIEW
                                </span>
                                <span className="px-2.5 py-1 rounded-full bg-[#F2FEDF] text-[#007A00] border border-[#B0C988] text-[11px] font-semibold">
                                    {condition}
                                </span>
                            </div>

                            <div className="aspect-[4/5] w-full rounded-[16px] overflow-hidden bg-[#F7F6F3] border border-[#E6E3DD] flex items-center justify-center relative mb-4">
                                {images[0] ? (
                                    <img
                                        src={images[0]}
                                        alt={title || 'Preview'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-6 text-[#8C8C8C]">
                                        <Camera size={36} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-[13px] font-medium">
                                            Scan or upload garment photos to preview your listing card
                                        </p>
                                    </div>
                                )}
                                {agentReport?.trustScore && (
                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#361C15] text-white text-[11px] font-bold">
                                        {agentReport.trustScore}% AI Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase text-[#7C7C7C]">
                                        {brand || 'BRAND'} • Size {size || 'S'}
                                    </p>
                                    <h3 className="text-[17px] font-bold text-[#161616] mt-0.5">
                                        {title || 'Untitled Archive Piece'}
                                    </h3>
                                    <p className="text-[12px] text-[#5E5E5E] mt-1 line-clamp-2">
                                        {description || 'Add photos or description to preview details.'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-[20px] font-extrabold text-[#161616]">
                                        ₹{(price || 0).toLocaleString('en-IN')}
                                    </div>
                                    {realRetailPrice > 0 && (
                                        <div className="text-[11px] text-[#8C8C8C] line-through">
                                            MRP ₹{realRetailPrice.toLocaleString('en-IN')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {agentReport && (
                            <div className="bg-white rounded-[20px] border border-[#C7DDF4] p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F62FE]">
                                        <Globe size={14} />
                                        Supabase Google Price Agent
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#007A00] bg-[#E5F6DF] px-2 py-0.5 rounded-full">
                                        Live Market Verified
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#434343] mb-3">
                                    Real Retail Price on Google:{' '}
                                    <strong>
                                        ₹{agentReport.realRetailPrice.toLocaleString('en-IN')}
                                    </strong>{' '}
                                    • Optimal Resale Range: ₹
                                    {agentReport.resaleLow.toLocaleString('en-IN')} – ₹
                                    {agentReport.resaleHigh.toLocaleString('en-IN')}
                                </p>
                                <div className="flex flex-col gap-1.5">
                                    {agentReport.googleSources.slice(0, 3).map((src, idx) => (
                                        <a
                                            key={idx}
                                            href={src.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-2 rounded-lg bg-[#F5F9FF] hover:bg-[#EBF3FF] text-[11px] text-[#161616] transition-colors"
                                        >
                                            <span className="truncate max-w-[240px]">
                                                <strong>{src.platform}:</strong> {src.title}
                                            </span>
                                            <span className="font-bold text-[#0F62FE] shrink-0 ml-2 flex items-center gap-1">
                                                ₹{(src.price || 0).toLocaleString('en-IN')}
                                                <ExternalLink size={10} />
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN (AND MAIN MOBILE FLOW): 3-Step Figma Wizard */}
                    <div className="flex flex-col gap-3">
                        {/* ==================== STEP 1: MEDIA, AI PRICE BANNER, CONDITION & DETAILS ==================== */}
                        {step === 1 && (
                            <>
                                {/* Add Media Card (Figma 263:11620 Empty vs 263:11704 Uploaded) */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6]">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <h2 className="text-[14px] font-semibold text-[#161616]">
                                                Add Media
                                            </h2>
                                            <p className="text-[12px] text-[#6F6F6F]">
                                                Add photos briefly showing the product
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setScannerOpen(true)}
                                            className="px-3 py-1.5 rounded-full bg-[#161616] hover:bg-[#292929] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 shrink-0"
                                        >
                                            <Camera size={13} className="text-[#78A9FF]" />
                                            Guided AI Scan
                                        </button>
                                    </div>

                                    {images.length === 0 ? (
                                        /* Empty Media Dropzone matching Figma 263:11620 */
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setScannerOpen(true)}
                                                className="h-[132px] rounded-[12px] border-2 border-dashed border-[#4589FF] bg-[#F5F9FF] hover:bg-[#EBF3FF] flex flex-col items-center justify-center gap-1.5 p-3 transition-all"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-[#4589FF] text-white flex items-center justify-center">
                                                    <Camera size={18} />
                                                </div>
                                                <span className="text-[12px] font-semibold text-[#161616]">
                                                    Real-Time Guided Camera
                                                </span>
                                                <span className="text-[11px] text-[#525252]">
                                                    Front • Back • Label • Google Price
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-[132px] rounded-[12px] border border-dashed border-[#C6C6C6] bg-[#FAFAFA] hover:bg-[#F2F2F2] flex flex-col items-center justify-center gap-1.5 p-3 transition-all"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-[#ECECEC] text-[#161616] flex items-center justify-center">
                                                    <Upload size={17} />
                                                </div>
                                                <span className="text-[12px] font-semibold text-[#161616]">
                                                    Upload from Device
                                                </span>
                                                <span className="text-[11px] text-[#6F6F6F]">
                                                    Select up to 6 photos (JPG, PNG)
                                                </span>
                                            </button>
                                        </div>
                                    ) : (
                                        /* Uploaded Media Strip matching Figma 263:11704 */
                                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-[86px] h-[86px] rounded-[10px] border border-dashed border-[#A8A8A8] bg-[#F8F8F8] shrink-0 flex flex-col items-center justify-center gap-1 text-[#525252]"
                                            >
                                                <Plus size={18} />
                                                <span className="text-[10px] font-medium">
                                                    Add More
                                                </span>
                                            </button>

                                            {images.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-[86px] h-[86px] rounded-[10px] overflow-hidden border border-[#DCD6CD] shrink-0 bg-[#F4F4F4]"
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Upload ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        aria-label="Remove image"
                                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Blue AI Suggested Price Banner (Figma 263:11620 Empty vs 263:11704 Uploaded) */}
                                <section className="rounded-[14px] p-3.5 bg-gradient-to-r from-[#EBF4FF] via-[#F2F8FF] to-[#E5F0FF] border border-[#B8D4F8]">
                                    {agentScanning ? (
                                        <div className="flex items-center gap-2.5 text-[#0F62FE] text-[13px] font-semibold">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>
                                                Supabase Google Price Agent scanning live Indian retail & resale prices...
                                            </span>
                                        </div>
                                    ) : images.length === 0 ? (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-[12px] font-medium text-[#1E3A8A]">
                                                <Sparkles size={15} className="text-[#0F62FE] shrink-0" />
                                                <span>
                                                    Upload media to get best price suggested for your piece
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setScannerOpen(true)}
                                                className="text-[11px] font-bold text-[#0F62FE] underline shrink-0"
                                            >
                                                Scan Now
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[20px] font-extrabold text-[#161616]">
                                                    ₹{(price || 499).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[12px] font-medium text-[#525252]">
                                                    Best price for the item
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {realRetailPrice > 0 && (
                                                    <span className="px-2.5 py-1 rounded-full bg-white/90 border border-[#B8D4F8] text-[11px] font-semibold text-[#0F62FE]">
                                                        Google MRP: ₹{realRetailPrice.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => runPriceAgent(images)}
                                                    className="px-2.5 py-1 rounded-full bg-[#161616] text-white text-[11px] font-semibold inline-flex items-center gap-1"
                                                >
                                                    <Sparkles size={11} />
                                                    Re-scan
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* 5-Stop Condition Selector Card (Figma 263:11704) */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[14px] font-semibold text-[#161616]">
                                            Condition
                                        </span>
                                        <span className="text-[11px] text-[#6F6F6F]">
                                            {images.length > 0
                                                ? `Based on ${images.length} photo${images.length > 1 ? 's' : ''} analyzed`
                                                : 'Select garment condition'}
                                        </span>
                                    </div>

                                    <div className="mt-3 mb-2">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-[#E5F6DF] text-[#007A00] border border-[#B0C988] text-[12px] font-bold">
                                            {condition}
                                        </span>
                                    </div>

                                    <p className="text-[12px] text-[#525252] leading-relaxed mb-4">
                                        {CONDITION_DESCRIPTIONS[condition]}
                                    </p>

                                    {/* Interactive Segmented Slider Track */}
                                    <div className="relative pt-1 pb-2">
                                        <div className="h-1.5 rounded-full bg-[#E5E5E5] relative">
                                            <div
                                                className="position absolute left-0 top-0 bottom-0 rounded-full bg-[#4589FF] transition-all"
                                                style={{
                                                    width: `${((conditionIndex + 1) / CONDITIONS.length) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5 mt-3">
                                            {CONDITIONS.map((c) => {
                                                const active = condition === c;
                                                return (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setCondition(c)}
                                                        className={`py-2 px-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                                            active
                                                                ? 'bg-[#161616] text-white border-[#161616]'
                                                                : 'bg-[#F8F8F8] text-[#525252] border-[#E0E0E0] hover:border-[#161616]'
                                                        }`}
                                                    >
                                                        {c}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* Product Title & Active Toggle (Figma 263:11620 & 263:11704) */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6] flex flex-col gap-3.5">
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6F6F6F] mb-1">
                                            Product Title
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter Product Title"
                                            className="w-full text-[14px] font-semibold text-[#161616] placeholder:text-[#A8A8A8] pb-2 border-b border-[#E6E6E6] focus:border-[#161616] outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            <div className="text-[11px] text-[#6F6F6F]">
                                                Product Status
                                            </div>
                                            <div className="text-[13px] font-semibold text-[#161616]">
                                                {activeStatus ? 'Active' : 'Draft / Hidden'}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={activeStatus}
                                            onClick={() => setActiveStatus((s) => !s)}
                                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                                                activeStatus ? 'bg-[#161616]' : 'bg-[#C6C6C6]'
                                            }`}
                                        >
                                            <span
                                                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                                                    activeStatus ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </section>

                                {/* Product Description (Figma 263:11620 & 263:11704) */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6]">
                                    <label className="block text-[11px] font-medium text-[#6F6F6F] mb-1.5">
                                        Product Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Enter Product Description (fabric, fit, measurements, flaws if any)..."
                                        className="w-full text-[13px] text-[#161616] placeholder:text-[#A8A8A8] leading-relaxed outline-none resize-y"
                                    />
                                </section>
                            </>
                        )}

                        {/* ==================== STEP 2: CATEGORY, SUB-CATEGORY, BRAND & SIZE (Figma 263:12180 & 263:12644) ==================== */}
                        {step === 2 && (
                            <>
                                {/* Compact Media Strip + Blue Price Banner */}
                                <section className="bg-white rounded-[16px] p-3.5 border border-[#E6E6E6] flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-14 h-14 rounded-lg border border-dashed border-[#A8A8A8] flex items-center justify-center shrink-0 text-[#525252]"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            alt=""
                                            className="w-14 h-14 rounded-lg object-cover border border-[#E0E0E0] shrink-0"
                                        />
                                    ))}
                                </section>

                                <section className="rounded-[14px] p-3.5 bg-gradient-to-r from-[#EBF4FF] to-[#E5F0FF] border border-[#B8D4F8] flex items-center justify-between">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[18px] font-extrabold text-[#161616]">
                                            ₹{(price || 499).toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[12px] text-[#525252]">
                                            Best price for the item
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#0F62FE]">
                                        AI Matched
                                    </span>
                                </section>

                                {/* Category Row -> Opens Searchable Category Picker Sheet (Figma 263:11852) */}
                                <button
                                    type="button"
                                    onClick={() => openPicker('category')}
                                    className="w-full bg-white rounded-[16px] p-4 border border-[#E6E6E6] hover:border-[#161616] flex items-center justify-between text-left transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[#6F6F6F]">
                                                Category
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                SUGGESTED
                                            </span>
                                        </div>
                                        <div className="text-[14px] font-semibold text-[#161616] mt-0.5">
                                            {department} &bull; {category || 'Select Category'}
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-[#525252]" />
                                </button>

                                {/* Sub-Category Row -> Opens Searchable Sub-Category Picker Sheet (Figma 263:10861) */}
                                <button
                                    type="button"
                                    onClick={() => openPicker('subCategory')}
                                    className="w-full bg-white rounded-[16px] p-4 border border-[#E6E6E6] hover:border-[#161616] flex items-center justify-between text-left transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[#6F6F6F]">
                                                Sub-category
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                SUGGESTED
                                            </span>
                                        </div>
                                        <div className="text-[14px] font-semibold text-[#161616] mt-0.5">
                                            {subCategory || 'Select Sub-Category'}
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-[#525252]" />
                                </button>

                                {/* Brand Row -> Opens Searchable Brand Picker Sheet (Figma 263:9672) */}
                                <button
                                    type="button"
                                    onClick={() => openPicker('brand')}
                                    className="w-full bg-white rounded-[16px] p-4 border border-[#E6E6E6] hover:border-[#161616] flex items-center justify-between text-left transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[#6F6F6F]">
                                                Brand
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                SUGGESTED
                                            </span>
                                        </div>
                                        <div className="text-[14px] font-semibold text-[#161616] mt-0.5">
                                            {brand || 'Select Brand'}
                                        </div>
                                    </div>
                                    <ChevronDown size={16} className="text-[#525252]" />
                                </button>

                                {/* Horizontal Size Selector + Size Guide (Figma 263:12180 & 263:12644) */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-[11px] text-[#6F6F6F] block">
                                                Select Size
                                            </span>
                                            <span className="text-[14px] font-semibold text-[#161616]">
                                                Size: {size}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openPicker('sizeGuide')}
                                            className="text-[12px] font-semibold text-[#161616] underline inline-flex items-center gap-1"
                                        >
                                            <Ruler size={13} />
                                            Size Guide
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => scrollSizes('left')}
                                            className="w-8 h-9 rounded-lg border border-[#E0E0E0] flex items-center justify-center shrink-0 text-[#525252] hover:border-[#161616]"
                                            aria-label="Scroll sizes left"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>

                                        <div
                                            ref={sizeScrollRef}
                                            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1"
                                        >
                                            {REVCLO_SIZE_OPTIONS.map((sz) => {
                                                const selected = size === sz;
                                                return (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => setSize(sz)}
                                                        className={`h-9 px-3.5 rounded-lg text-[12px] font-semibold shrink-0 border transition-all ${
                                                            selected
                                                                ? 'bg-[#161616] text-white border-[#161616]'
                                                                : 'bg-[#F8F8F8] text-[#393939] border-[#E0E0E0] hover:border-[#161616]'
                                                        }`}
                                                    >
                                                        {sz}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => scrollSizes('right')}
                                            className="w-8 h-9 rounded-lg border border-[#E0E0E0] flex items-center justify-center shrink-0 text-[#525252] hover:border-[#161616]"
                                            aria-label="Scroll sizes right"
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* ==================== STEP 3: INLINE PRICE EDITING & FULL SUMMARY (Figma 263:13903 - 263:15757) ==================== */}
                        {step === 3 && (
                            <>
                                {/* Editable Price Banner (Figma 263:13903 & 263:14431) */}
                                <section className="rounded-[16px] p-4 bg-gradient-to-r from-[#EBF4FF] via-[#F0F7FF] to-[#E0EEFF] border-2 border-[#4589FF]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F62FE]">
                                            YOUR LISTING PRICE (TAP TO EDIT)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setEditingPrice((e) => !e)}
                                            className="text-[12px] font-semibold text-[#0F62FE] inline-flex items-center gap-1"
                                        >
                                            <Edit3 size={13} />
                                            {editingPrice ? 'Done' : 'Edit Price'}
                                        </button>
                                    </div>

                                    <div className="flex items-baseline gap-2.5 mt-1">
                                        <span className="text-[24px] font-extrabold text-[#161616]">
                                            ₹
                                        </span>
                                        <input
                                            type="number"
                                            min={50}
                                            max={500000}
                                            value={price || ''}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            onFocus={() => setEditingPrice(true)}
                                            onBlur={() => setEditingPrice(false)}
                                            className="w-[140px] bg-white px-3 py-1 rounded-lg border border-[#4589FF] text-[22px] font-extrabold text-[#161616] outline-none"
                                        />
                                        <span className="text-[12px] font-medium text-[#525252]">
                                            Best price for the item
                                        </span>
                                    </div>

                                    {realRetailPrice > 0 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-[#B8D4F8]/60 flex items-center justify-between text-[12px] text-[#1E3A8A]">
                                            <span>
                                                Google Retail Reference:{' '}
                                                <strong>
                                                    ₹{realRetailPrice.toLocaleString('en-IN')}
                                                </strong>
                                            </span>
                                            <span>
                                                Buyer saves{' '}
                                                <strong>
                                                    {Math.max(
                                                        5,
                                                        Math.round(
                                                            ((realRetailPrice - price) /
                                                                realRetailPrice) *
                                                                100
                                                        )
                                                    )}
                                                    %
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </section>

                                {/* Full Read-Only Summary Cards with Quick Edit Links */}
                                <section className="bg-white rounded-[16px] p-4 border border-[#E6E6E6] flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2.5">
                                        <div>
                                            <span className="text-[11px] text-[#6F6F6F] block">
                                                Product Title
                                            </span>
                                            <span className="text-[14px] font-semibold text-[#161616]">
                                                {title}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="text-[12px] font-semibold text-[#0F62FE]"
                                        >
                                            Edit
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 border-b border-[#F0F0F0] pb-2.5">
                                        <div>
                                            <span className="text-[11px] text-[#6F6F6F] block">
                                                Category
                                            </span>
                                            <span className="text-[13px] font-semibold text-[#161616]">
                                                {department} &bull; {category} ({subCategory})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[#6F6F6F] block">
                                                Brand & Size
                                            </span>
                                            <span className="text-[13px] font-semibold text-[#161616]">
                                                {brand} &bull; Size {size}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-[#6F6F6F] block">
                                                Condition & Visibility
                                            </span>
                                            <span className="text-[13px] font-semibold text-[#007A00]">
                                                {condition} &bull;{' '}
                                                {activeStatus ? 'Active on Feed' : 'Hidden Draft'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="text-[12px] font-semibold text-[#0F62FE]"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* Bottom Action Buttons (Figma 263:11620, 263:12644, 263:13903) */}
                        <div className="mt-3 flex items-center gap-3 pb-8">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                                    className="flex-1 h-12 rounded-[12px] bg-[#E8E8E8] hover:bg-[#DCDCDC] text-[#161616] text-[14px] font-semibold transition-all"
                                >
                                    Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleStepContinue}
                                    className="flex-[2] h-12 rounded-[12px] bg-[#161616] hover:bg-black text-white text-[14px] font-semibold transition-all"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handlePublish}
                                    className="flex-[2] h-12 rounded-[12px] bg-[#161616] hover:bg-black disabled:opacity-60 text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Publishing to RevClo...</span>
                                        </>
                                    ) : (
                                        <span>Done & Publish Listing</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ==================== STEP 2 SEARCHABLE PICKER MODALS / BOTTOM SHEETS (Figma 263:9672, 263:10861, 263:11852) ==================== */}
            {activeSheet && (
                <div
                    className="revclo-backdrop"
                    onClick={() => setActiveSheet(null)}
                >
                    <div
                        className="revclo-sheet p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 rounded-full bg-[#CCCCCC] mx-auto mb-3 md:hidden" />

                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[16px] font-bold text-[#161616]">
                                {activeSheet === 'category'
                                    ? 'Select Category'
                                    : activeSheet === 'subCategory'
                                      ? 'Select Sub-Category'
                                      : activeSheet === 'brand'
                                        ? 'Select Brand'
                                        : 'RevClo Size Guide'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveSheet(null)}
                                className="w-8 h-8 rounded-full bg-[#F2F2F2] flex items-center justify-center"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {activeSheet === 'sizeGuide' ? (
                            <div className="overflow-y-auto max-h-[60vh]">
                                <p className="text-[12px] text-[#5E5E5E] mb-3">
                                    Standard Indian & UK body measurements (in inches) for secondhand garment grading:
                                </p>
                                <table className="w-full text-left border-collapse text-[12px]">
                                    <thead>
                                        <tr className="border-b border-[#DCD6CD] text-[#6F6F6F]">
                                            <th className="py-2 font-semibold">Size</th>
                                            <th className="py-2 font-semibold">UK</th>
                                            <th className="py-2 font-semibold">Bust / Chest</th>
                                            <th className="py-2 font-semibold">Waist</th>
                                            <th className="py-2 font-semibold">Hip</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {REVCLO_SIZE_GUIDE.map((row) => (
                                            <tr
                                                key={row.size}
                                                onClick={() => {
                                                    setSize(row.size);
                                                    setActiveSheet(null);
                                                }}
                                                className="border-b border-[#EFEFEF] hover:bg-[#F7F6F3] cursor-pointer"
                                            >
                                                <td className="py-2.5 font-bold text-[#161616]">
                                                    {row.size}
                                                </td>
                                                <td className="py-2.5">{row.uk}</td>
                                                <td className="py-2.5">{row.bust}</td>
                                                <td className="py-2.5">{row.waist}</td>
                                                <td className="py-2.5">{row.hip}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <>
                                {/* Search Input inside Sheet (Figma 263:9672 / 263:10861 / 263:11852) */}
                                <div className="relative mb-3">
                                    <Search
                                        size={15}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C7C7C]"
                                    />
                                    <input
                                        type="text"
                                        value={sheetSearch}
                                        onChange={(e) => setSheetSearch(e.target.value)}
                                        placeholder={
                                            activeSheet === 'category'
                                                ? 'Search Category'
                                                : activeSheet === 'subCategory'
                                                  ? 'Search Sub-Category'
                                                  : 'Search or type any Brand...'
                                        }
                                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                    />
                                </div>

                                {/* Department Toggle inside Category Sheet (Figma 263:11852 WOMEN | MEN) */}
                                {activeSheet === 'category' && (
                                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#ECECEC] mb-3">
                                        {(['Women', 'Men'] as const).map((dept) => (
                                            <button
                                                key={dept}
                                                type="button"
                                                onClick={() => setDepartment(dept)}
                                                className={`py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${
                                                    department === dept
                                                        ? 'bg-white text-[#161616] shadow-sm'
                                                        : 'text-[#6F6F6F]'
                                                }`}
                                            >
                                                {dept}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Radio List */}
                                <div className="overflow-y-auto max-h-[50vh] divide-y divide-[#EFEFEF]">
                                    {activeSheet === 'category' &&
                                        filteredSheetCategories.map((cat) => {
                                            const selected = category === cat;
                                            const isSuggested =
                                                agentReport?.category?.toLowerCase() ===
                                                cat.toLowerCase();
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(cat);
                                                        const firstSub =
                                                            REVCLO_CATEGORIES_CATALOG[cat]
                                                                ?.subCategories?.[0] || '';
                                                        setSubCategory(firstSub);
                                                        setActiveSheet(null);
                                                    }}
                                                    className="w-full py-3 px-1 flex items-center justify-between text-left hover:bg-[#F8F8F8]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-medium text-[#161616]">
                                                            {cat}
                                                        </span>
                                                        {isSuggested && (
                                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                                SUGGESTED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                            selected
                                                                ? 'border-[#161616] bg-[#161616]'
                                                                : 'border-[#A8A8A8]'
                                                        }`}
                                                    >
                                                        {selected && (
                                                            <span className="w-2 h-2 rounded-full bg-white" />
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}

                                    {activeSheet === 'subCategory' &&
                                        filteredSheetSubCategories.map((sub) => {
                                            const selected = subCategory === sub;
                                            const isSuggested =
                                                agentReport?.subCategory?.toLowerCase() ===
                                                sub.toLowerCase();
                                            return (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    onClick={() => {
                                                        setSubCategory(sub);
                                                        setActiveSheet(null);
                                                    }}
                                                    className="w-full py-3 px-1 flex items-center justify-between text-left hover:bg-[#F8F8F8]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-medium text-[#161616]">
                                                            {sub}
                                                        </span>
                                                        {isSuggested && (
                                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                                SUGGESTED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                            selected
                                                                ? 'border-[#161616] bg-[#161616]'
                                                                : 'border-[#A8A8A8]'
                                                        }`}
                                                    >
                                                        {selected && (
                                                            <span className="w-2 h-2 rounded-full bg-white" />
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}

                                    {activeSheet === 'brand' &&
                                        filteredSheetBrands.map((b) => {
                                            const selected = brand === b;
                                            const isSuggested =
                                                agentReport?.brand?.toLowerCase() ===
                                                b.toLowerCase();
                                            return (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => {
                                                        setBrand(b);
                                                        setActiveSheet(null);
                                                    }}
                                                    className="w-full py-3 px-1 flex items-center justify-between text-left hover:bg-[#F8F8F8]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-medium text-[#161616]">
                                                            {b}
                                                        </span>
                                                        {isSuggested && (
                                                            <span className="px-2 py-0.5 rounded bg-[#E5F6DF] text-[#007A00] text-[9px] font-bold uppercase">
                                                                SUGGESTED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                            selected
                                                                ? 'border-[#161616] bg-[#161616]'
                                                                : 'border-[#A8A8A8]'
                                                        }`}
                                                    >
                                                        {selected && (
                                                            <span className="w-2 h-2 rounded-full bg-white" />
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
