'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    ExternalLink,
    Globe,
    Info,
    Sparkles,
    X,
} from 'lucide-react';
import { createRevcloListing } from '@/actions/marketplace';
import { REVCLO_ASSETS } from '@/lib/revcloSeedData';
import type { GooglePriceAgentReport } from '@/lib/supabasePriceAgent';
import RevcloProductCard from '@/components/revclo/RevcloProductCard';
import GuidedGarmentScannerModal from '@/components/revclo/GuidedGarmentScannerModal';

const CONDITIONS = [
    {
        id: 'Pristine',
        label: 'Pristine',
        desc: 'Item is in the best condition, with zero signs of wear or flaws.',
        stopIndex: 0,
    },
    {
        id: 'Excellent',
        label: 'Excellent',
        desc: 'Barely worn once or twice. Crisp structure and clean lining.',
        stopIndex: 1,
    },
    {
        id: 'Good',
        label: 'Good',
        desc: 'Gently pre-loved with minor natural patina mentioned in notes.',
        stopIndex: 2,
    },
    {
        id: 'Well-loved',
        label: 'Well-loved',
        desc: 'Visible vintage wear that adds archive character.',
        stopIndex: 3,
    },
] as const;

export default function SellListingPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1 fields (Figma 263:11704)
    const [images, setImages] = useState<string[]>([
        REVCLO_ASSETS.uploadThumb1,
        REVCLO_ASSETS.uploadThumb2,
        REVCLO_ASSETS.uploadThumb3,
    ]);
    const [price, setPrice] = useState<number>(450);
    const [realRetailPrice, setRealRetailPrice] = useState<number>(1299);
    const [realRetailSource, setRealRetailSource] = useState<string>('Google Shopping India');
    const [editingPrice, setEditingPrice] = useState<boolean>(false);
    const [condition, setCondition] = useState<'Pristine' | 'Excellent' | 'Good' | 'Well-loved'>('Pristine');
    const [title, setTitle] = useState<string>('Quilted Leather Archive Shoulder Bag');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [description, setDescription] = useState<string>(
        'Buttery soft quilted cream handbag with brushed gold hardware. Zero scratches, stored in original dustbag.'
    );

    // Real-time Guided Scanner & Supabase Google Price Agent state
    const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);
    const [aiScanning, setAiScanning] = useState<boolean>(false);
    const [agentReport, setAgentReport] = useState<GooglePriceAgentReport | null>(null);
    const [showGoogleSources, setShowGoogleSources] = useState<boolean>(false);

    // Step 2 fields (Figma 263:11852)
    const [category, setCategory] = useState<string>('Accessories');
    const [subCategory, setSubCategory] = useState<string>('Handbags');
    const [brand, setBrand] = useState<string>('QUILTED');
    const [size, setSize] = useState<string>('Large');
    const [department, setDepartment] = useState<'Women' | 'Men'>('Women');
    const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const applyAgentReport = (capturedPhotos: string[], report: GooglePriceAgentReport) => {
        if (capturedPhotos.length > 0) setImages(capturedPhotos);
        setAgentReport(report);
        setPrice(report.recommendedPrice);
        setRealRetailPrice(report.realRetailPrice);
        setRealRetailSource(report.realRetailSource);
        setCondition(report.condition);
        setTitle(report.productTitle);
        setDescription(report.conditionDescription);
        setCategory(report.category);
        setSubCategory(report.subCategory);
        setBrand(report.brand);
        setSize(report.size);
        setDepartment(report.department);
    };

    const runDirectPriceAgent = async (overrideImages?: string[]) => {
        setAiScanning(true);
        try {
            const targetImgs = overrideImages || images;
            const res = await fetch('/api/scanner/price-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: targetImgs,
                    brand,
                    title,
                    condition,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.report) {
                    applyAgentReport(targetImgs, data.report as GooglePriceAgentReport);
                }
            }
        } catch {
            // Keep existing values if offline
        } finally {
            setAiScanning(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const nextImgs = [reader.result as string, ...images.slice(0, 2)];
                setImages(nextImgs);
                runDirectPriceAgent(nextImgs);
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePublish = async () => {
        setSubmitting(true);
        await createRevcloListing({
            name: title,
            brand,
            price,
            size,
            condition,
            category,
            sub_category: subCategory,
            department,
            description,
            images,
            active: isActive,
        });
        setSubmitting(false);
        router.push('/closet');
    };

    const selectedCondObj =
        CONDITIONS.find((c) => c.id === condition) || CONDITIONS[0];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg-canvas)' }}>
            {/* Header matching Figma 263:11704 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => (step > 1 ? setStep((step - 1) as 1 | 2) : router.back())}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">Upload new</span>
                <button
                    type="button"
                    onClick={() => setScannerModalOpen(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 11px',
                        borderRadius: 999,
                        background: 'var(--terracotta-920)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 600,
                    }}
                >
                    <Camera size={12} />
                    <span>Guided Scan</span>
                </button>
            </header>

            {/* 3-Step Progress Bar: Uploads -> Details -> Preview */}
            <div
                style={{
                    padding: '14px 16px 12px',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {[
                        { num: 1, label: 'Uploads' },
                        { num: 2, label: 'Details' },
                        { num: 3, label: 'Preview' },
                    ].map((s) => {
                        const active = step >= s.num;
                        return (
                            <button
                                key={s.num}
                                type="button"
                                onClick={() => setStep(s.num as 1 | 2 | 3)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    textAlign: 'left',
                                }}
                            >
                                <div
                                    style={{
                                        height: 4,
                                        borderRadius: 999,
                                        background: active
                                            ? 'var(--terracotta-800)'
                                            : 'var(--border-sand)',
                                        transition: 'background 0.25s ease',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: step === s.num ? 700 : 500,
                                        color: active
                                            ? 'var(--terracotta-900)'
                                            : 'var(--text-muted)',
                                    }}
                                >
                                    {s.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* AI Recommended Price + Supabase Google Price Agent Banner (Figma 263:11704 + Google Price Intel) */}
            <div
                style={{
                    margin: '14px 16px',
                    borderRadius: 14,
                    background: 'var(--terracotta-950)',
                    color: '#ffffff',
                    border: '1px solid var(--terracotta-800)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            {editingPrice ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: '18px', fontWeight: 700 }}>₹</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        style={{
                                            width: 90,
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            border: '1px solid var(--terracotta-400)',
                                            background: '#ffffff',
                                            color: 'var(--text-ink)',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                        }}
                                    />
                                </div>
                            ) : (
                                <span style={{ fontSize: '21px', fontWeight: 700 }}>
                                    ₹{price.toLocaleString('en-IN')}
                                </span>
                            )}
                            <span style={{ fontSize: '11.5px', color: 'var(--terracotta-200)' }}>
                                Best price for the item
                            </span>
                        </div>

                        {/* Real Retail Price from Supabase Google Price Agent */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 4,
                                fontSize: '11px',
                                color: '#b0c988',
                            }}
                        >
                            <Globe size={12} />
                            <span>
                                Real Price on Google:{' '}
                                <strong>₹{realRetailPrice.toLocaleString('en-IN')}</strong> (
                                {realRetailSource})
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            type="button"
                            onClick={() => runDirectPriceAgent()}
                            disabled={aiScanning}
                            style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fcd34d',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                            title="Run Supabase Google Price Scanner Agent"
                        >
                            <Sparkles size={12} />
                            <span>{aiScanning ? 'Scanning Google...' : 'Scan Price'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setEditingPrice(!editingPrice)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.14)',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}
                        >
                            {editingPrice ? 'Done' : 'Change'}
                        </button>
                    </div>
                </div>

                {/* Expandable Live Google Sources Bar */}
                <div
                    style={{
                        padding: '8px 14px',
                        background: 'rgba(0,0,0,0.25)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setShowGoogleSources(!showGoogleSources)}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: 'var(--terracotta-200)',
                            fontSize: '11px',
                            fontWeight: 600,
                        }}
                    >
                        <span>
                            {agentReport
                                ? `Supabase Agent verified ${agentReport.googleSources.length} Google listings • Range ₹${agentReport.resaleLow.toLocaleString('en-IN')} – ₹${agentReport.resaleHigh.toLocaleString('en-IN')}`
                                : 'Tap "Guided Scan" or "Scan Price" to fetch live Google retail comps'}
                        </span>
                        {showGoogleSources ? (
                            <ChevronUp size={14} />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                    </button>

                    {showGoogleSources && (
                        <div
                            style={{
                                marginTop: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            {(
                                agentReport?.googleSources || [
                                    {
                                        title: `${brand} ${title}`,
                                        price: realRetailPrice,
                                        platform: realRetailSource,
                                        url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${brand} ${title}`)}`,
                                    },
                                ]
                            ).map((src, i) => (
                                <a
                                    key={i}
                                    href={src.url || 'https://www.google.com/shopping'}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '6px 8px',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.08)',
                                        fontSize: '11px',
                                        color: '#ffffff',
                                    }}
                                >
                                    <span
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '68%',
                                        }}
                                    >
                                        {src.platform}: {src.title}
                                    </span>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontWeight: 700,
                                            color: '#fcd34d',
                                        }}
                                    >
                                        ₹{Number(src.price || realRetailPrice).toLocaleString('en-IN')}
                                        <ExternalLink size={10} />
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {step === 1 && (
                /* =========================================================
                   STEP 1: UPLOADS, REAL-TIME GUIDED SCAN & AI CONDITION (Figma 263:11704)
                   ========================================================= */
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Launch Real-Time Guided Photo Scanner CTA */}
                    <button
                        type="button"
                        onClick={() => setScannerModalOpen(true)}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: '#ffffff',
                            border: '1.5px dashed var(--terracotta-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: 'var(--terracotta-50)',
                                    color: 'var(--terracotta-800)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Camera size={18} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                    Real-Time Guided Photo Scanner
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    Step-by-step camera guidance + automatic Google Price scan
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={16} color="var(--terracotta-800)" />
                    </button>

                    {/* 3 Media Upload Slots */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                Captured Photos ({images.length})
                            </span>
                            <label
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--terracotta-800)',
                                    cursor: 'pointer',
                                }}
                            >
                                <Camera size={14} />
                                <span>Upload file</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                            {images.map((img, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1 / 1.15',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        border:
                                            i === 0
                                                ? '2px solid var(--terracotta-800)'
                                                : '1px solid var(--border-card)',
                                        background: 'var(--bg-card)',
                                    }}
                                >
                                    <img
                                        src={img}
                                        alt={`Upload ${i + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            bottom: 6,
                                            left: 6,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '2px 7px',
                                            borderRadius: 999,
                                            background: 'rgba(22,22,22,0.8)',
                                            color: '#ffffff',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: 999,
                                                background: '#22c55e',
                                            }}
                                        />
                                        {i === 0 ? 'Primary' : i === 1 ? 'Back' : 'Tag'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive AI Condition Card with 5-Stop Gradient Bar matching 263:11704 */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid var(--border-card)',
                            padding: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Condition (AI Assessed)
                                </span>
                                <div
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#007a00',
                                        marginTop: 2,
                                    }}
                                >
                                    {selectedCondObj.label}
                                </div>
                            </div>

                            <span className="revclo-pristine-pill" style={{ position: 'static' }}>
                                AI Verified
                            </span>
                        </div>

                        {/* 5-Stop Gradient Indicator Bar */}
                        <div
                            style={{
                                position: 'relative',
                                height: 8,
                                borderRadius: 999,
                                background:
                                    'linear-gradient(90deg, #007a00 0%, #65a30d 35%, #eab308 70%, #dc2626 100%)',
                                margin: '12px 0',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -4,
                                    left: `${selectedCondObj.stopIndex * 30 + 5}%`,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    background: '#ffffff',
                                    border: '3px solid var(--terracotta-920)',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                    transition: 'left 0.25s ease',
                                }}
                            />
                        </div>

                        <p
                            style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                marginBottom: 12,
                            }}
                        >
                            {selectedCondObj.desc}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {CONDITIONS.map((c) => {
                                const active = condition === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCondition(c.id)}
                                        style={{
                                            padding: '6px 4px',
                                            borderRadius: 8,
                                            fontSize: '11px',
                                            fontWeight: active ? 700 : 500,
                                            background: active
                                                ? 'var(--terracotta-920)'
                                                : 'var(--bg-canvas)',
                                            color: active ? '#ffffff' : 'var(--text-secondary)',
                                            border: '1px solid var(--border-sand)',
                                        }}
                                    >
                                        {c.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product Title */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px solid var(--border-sand)',
                            padding: '12px 14px',
                        }}
                    >
                        <label
                            style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                marginBottom: 4,
                            }}
                        >
                            Product Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                border: 'none',
                                outline: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--text-ink)',
                            }}
                        />
                    </div>

                    {/* Status Toggle: Active / Inactive */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px solid var(--border-sand)',
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>Listing Status</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {isActive ? 'Active — Visible in marketplace' : 'Inactive — Hidden draft'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 999,
                                background: isActive ? 'var(--badge-pristine-bg)' : '#e5e2dc',
                                color: isActive ? 'var(--badge-pristine-text)' : 'var(--text-secondary)',
                                border: '1px solid var(--badge-pristine-border)',
                                fontSize: '12px',
                                fontWeight: 700,
                            }}
                        >
                            {isActive ? 'Active' : 'Inactive'}
                        </button>
                    </div>

                    {/* Description */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px solid var(--border-sand)',
                            padding: '12px 14px',
                        }}
                    >
                        <label
                            style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                marginBottom: 6,
                            }}
                        >
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '100%',
                                border: 'none',
                                outline: 'none',
                                fontSize: '13px',
                                lineHeight: 1.45,
                                color: 'var(--text-ink)',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                </div>
            )}

            {step === 2 && (
                /* =========================================================
                   STEP 2: CATEGORY, BRAND & SIZE DETAILS (Figma 263:11852)
                   ========================================================= */
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Category with SUGGESTED Pill */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid var(--border-sand)',
                            padding: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Category</span>
                            <span className="revclo-pristine-pill" style={{ position: 'static' }}>
                                SUGGESTED
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['Accessories', 'Dresses', 'Tops', 'Footwear', 'Jewellery'].map(
                                (cat) => {
                                    const active = category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: 999,
                                                background: active
                                                    ? 'var(--terracotta-920)'
                                                    : 'var(--bg-canvas)',
                                                color: active ? '#ffffff' : 'var(--text-ink)',
                                                border: '1px solid var(--border-sand)',
                                                fontSize: '12.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* Sub-Category */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid var(--border-sand)',
                            padding: '14px',
                        }}
                    >
                        <span
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                marginBottom: 10,
                            }}
                        >
                            Sub-Category
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {[
                                'Handbags',
                                'Glasses & Sunglasses',
                                'Mini Dresses',
                                'Jackets',
                                'Loafers',
                                'Bracelets',
                            ].map((sub) => {
                                const active = subCategory === sub;
                                return (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setSubCategory(sub)}
                                        style={{
                                            padding: '7px 12px',
                                            borderRadius: 999,
                                            background: active
                                                ? 'var(--terracotta-920)'
                                                : 'var(--bg-canvas)',
                                            color: active ? '#ffffff' : 'var(--text-ink)',
                                            border: '1px solid var(--border-sand)',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {sub}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Brand Selector */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid var(--border-sand)',
                            padding: '14px',
                        }}
                    >
                        <span
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                marginBottom: 10,
                            }}
                        >
                            Brand
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['QUILTED', 'Diesel', 'Prada', 'Versace', 'Lethal', 'Zara', 'H&M'].map(
                                (b) => {
                                    const active = brand === b;
                                    return (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setBrand(b)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: 999,
                                                background: active
                                                    ? 'var(--terracotta-920)'
                                                    : 'var(--bg-canvas)',
                                                color: active ? '#ffffff' : 'var(--text-ink)',
                                                border: '1px solid var(--border-sand)',
                                                fontSize: '12.5px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {b}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* Size + Size Guide Modal Trigger */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid var(--border-sand)',
                            padding: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Size</span>
                            <button
                                type="button"
                                onClick={() => setSizeGuideOpen(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--terracotta-800)',
                                }}
                            >
                                <Info size={13} />
                                <span>Size guide</span>
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {['XS', 'S', 'M', 'Large', 'UK9', 'One Size'].map((sz) => {
                                const active = size === sz;
                                return (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setSize(sz)}
                                        style={{
                                            padding: '10px',
                                            borderRadius: 10,
                                            background: active
                                                ? 'var(--terracotta-920)'
                                                : 'var(--bg-canvas)',
                                            color: active ? '#ffffff' : 'var(--text-ink)',
                                            border: '1px solid var(--border-sand)',
                                            fontSize: '12.5px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {sz}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                /* =========================================================
                   STEP 3: PREVIEW & PUBLISH
                   ========================================================= */
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1px solid var(--border-card)',
                            padding: 16,
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: 'var(--terracotta-800)',
                                textTransform: 'uppercase',
                                marginBottom: 12,
                            }}
                        >
                            Marketplace Feed Preview
                        </div>

                        <div style={{ maxWidth: 210, margin: '0 auto' }}>
                            <RevcloProductCard
                                product={{
                                    id: 'preview-item',
                                    seller_id: 'demo',
                                    name: title,
                                    title,
                                    description,
                                    brand,
                                    price,
                                    original_price: realRetailPrice,
                                    images,
                                    size,
                                    condition,
                                    category,
                                    trust_score: agentReport?.trustScore || 96,
                                    status: 'available',
                                    likes_count: 1,
                                    created_at: new Date().toISOString(),
                                }}
                                badgeMode="trust"
                            />
                        </div>

                        <div
                            style={{
                                marginTop: 16,
                                paddingTop: 12,
                                borderTop: '1px solid var(--border-sand)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontSize: '12.5px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Title</span>
                                <span style={{ fontWeight: 600 }}>{title}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Category</span>
                                <span style={{ fontWeight: 600 }}>
                                    {category} • {subCategory}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Real Google Retail Price
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    ₹{realRetailPrice.toLocaleString('en-IN')} ({realRetailSource})
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Condition</span>
                                <span style={{ fontWeight: 600, color: '#007a00' }}>
                                    {condition} ({agentReport?.trustScore || 96} Trust Score)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Bottom CTA Bar */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 460,
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderTop: '1px solid var(--border-sand)',
                    display: 'flex',
                    gap: 10,
                    zIndex: 50,
                }}
            >
                {step < 3 ? (
                    <button
                        type="button"
                        onClick={() => setStep((step + 1) as 2 | 3)}
                        className="revclo-primary-btn"
                        style={{ width: '100%' }}
                    >
                        <span>Continue to {step === 1 ? 'Details' : 'Preview'}</span>
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handlePublish}
                        className="revclo-primary-btn"
                        style={{ width: '100%' }}
                    >
                        <Check size={16} />
                        <span>{submitting ? 'Publishing to Closet...' : 'Publish Listing'}</span>
                    </button>
                )}
            </div>

            {/* Real-Time Guided Garment Scanner + Supabase Google Price Agent Modal */}
            <GuidedGarmentScannerModal
                isOpen={scannerModalOpen}
                onClose={() => setScannerModalOpen(false)}
                initialBrandHint={brand}
                onComplete={(capturedPhotos, report) => {
                    applyAgentReport(capturedPhotos, report);
                    setShowGoogleSources(true);
                }}
            />

            {/* Size Guide Modal */}
            {sizeGuideOpen && (
                <div className="revclo-backdrop" onClick={() => setSizeGuideOpen(false)}>
                    <div
                        className="revclo-sheet"
                        style={{ padding: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 14,
                            }}
                        >
                            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                                RevClo Standard Size Guide
                            </h3>
                            <button type="button" onClick={() => setSizeGuideOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Include accurate flat measurements so buyers can shop with confidence.
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: 8,
                                fontSize: '12px',
                                background: '#ffffff',
                                padding: 12,
                                borderRadius: 10,
                                border: '1px solid var(--border-sand)',
                            }}
                        >
                            <strong>Size</strong>
                            <strong>Bust / Chest</strong>
                            <strong>Waist</strong>
                            <span>XS</span>
                            <span>31 - 32 in</span>
                            <span>24 - 25 in</span>
                            <span>S</span>
                            <span>33 - 34 in</span>
                            <span>26 - 27 in</span>
                            <span>M</span>
                            <span>35 - 36 in</span>
                            <span>28 - 29 in</span>
                            <span>Large</span>
                            <span>37 - 39 in</span>
                            <span>30 - 32 in</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
