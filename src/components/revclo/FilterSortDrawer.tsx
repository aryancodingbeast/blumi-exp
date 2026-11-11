'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { MarketplaceFilterState } from '@/types';

interface FilterSortDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: MarketplaceFilterState;
    onApply: (filters: MarketplaceFilterState) => void;
    onClear: () => void;
}

const FILTER_TABS = [
    'Sort by',
    'Department',
    'Category',
    'Size',
    'Brand',
    'Price',
    'Color',
    'Material',
] as const;

type FilterTab = (typeof FILTER_TABS)[number];

const PRICE_RANGES = [
    { id: 'under_199', label: '< ₹199', min: 0, max: 199 },
    { id: '199_499', label: '₹199 - ₹499', min: 199, max: 499 },
    { id: '699_999', label: '₹699 - ₹999', min: 699, max: 999 },
    { id: '999_4999', label: '₹999 - ₹4999', min: 999, max: 4999 },
    { id: 'above_5000', label: '₹5,000+', min: 5000, max: 100000 },
];

export default function FilterSortDrawer({
    isOpen,
    onClose,
    initialFilters,
    onApply,
    onClear,
}: FilterSortDrawerProps) {
    const [activeTab, setActiveTab] = useState<FilterTab>('Price');
    const [draft, setDraft] = useState<MarketplaceFilterState>(initialFilters);
    const [customMin, setCustomMin] = useState<string>(
        initialFilters.minPrice ? String(initialFilters.minPrice) : ''
    );
    const [customMax, setCustomMax] = useState<string>(
        initialFilters.maxPrice ? String(initialFilters.maxPrice) : ''
    );

    if (!isOpen) return null;

    const toggleArrayValue = (key: 'brands' | 'sizes' | 'colors' | 'materials' | 'priceRanges', val: string) => {
        const current = draft[key] || [];
        const exists = current.includes(val);
        const updated = exists ? current.filter((v) => v !== val) : [...current, val];
        setDraft({ ...draft, [key]: updated });
    };

    const handlePriceRangeToggle = (rangeId: string, min: number, max: number) => {
        const current = draft.priceRanges || [];
        const exists = current.includes(rangeId);
        const updated = exists ? current.filter((r) => r !== rangeId) : [...current, rangeId];
        setDraft({
            ...draft,
            priceRanges: updated,
            minPrice: exists ? undefined : min,
            maxPrice: exists ? undefined : max,
        });
    };

    const handleApplyClick = () => {
        const finalDraft: MarketplaceFilterState = {
            ...draft,
            minPrice: customMin ? Number(customMin) : draft.minPrice,
            maxPrice: customMax ? Number(customMax) : draft.maxPrice,
        };
        onApply(finalDraft);
        onClose();
    };

    const handleClearAll = () => {
        setDraft({
            department: 'All',
            category: 'All',
            brands: [],
            sizes: [],
            priceRanges: [],
            colors: [],
            materials: [],
            sortBy: 'trending',
        });
        setCustomMin('');
        setCustomMax('');
        onClear();
    };

    return (
        <div className="revclo-backdrop" onClick={onClose}>
            <div
                className="revclo-sheet"
                style={{ height: '78vh', maxHeight: '640px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header matching Figma 86:4587 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--border-sand)',
                    }}
                >
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-ink)' }}>
                        Sort and Filter
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Filter Sheet"
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Split 2-column layout matching 86:4587 */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Sidebar Tabs */}
                    <div
                        style={{
                            width: '132px',
                            background: '#ebe8e2',
                            borderRight: '1px solid var(--border-sand)',
                            overflowY: 'auto',
                        }}
                    >
                        {FILTER_TABS.map((tab) => {
                            const isSelected = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '14px 14px',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 600 : 500,
                                        color: isSelected
                                            ? 'var(--terracotta-900)'
                                            : 'var(--text-secondary)',
                                        background: isSelected ? 'var(--bg-canvas)' : 'transparent',
                                        borderLeft: isSelected
                                            ? '3px solid var(--terracotta-800)'
                                            : '3px solid transparent',
                                        borderBottom: '1px solid rgba(220,214,205,0.5)',
                                    }}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Content Pane */}
                    <div
                        style={{
                            flex: 1,
                            padding: '18px',
                            overflowY: 'auto',
                            background: 'var(--bg-canvas)',
                        }}
                    >
                        {activeTab === 'Sort by' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { id: 'trending', label: 'Trending / Popular' },
                                    { id: 'trust_score', label: 'Highest AI Trust Score' },
                                    { id: 'price_asc', label: 'Price: Low to High' },
                                    { id: 'price_desc', label: 'Price: High to Low' },
                                    { id: 'newest', label: 'Newest Arrivals' },
                                ].map((opt) => {
                                    const active = (draft.sortBy || 'trending') === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() =>
                                                setDraft({
                                                    ...draft,
                                                    sortBy: opt.id as MarketplaceFilterState['sortBy'],
                                                })
                                            }
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                borderRadius: 10,
                                                background: active ? '#ffffff' : 'var(--bg-card)',
                                                border: active
                                                    ? '1.5px solid var(--terracotta-800)'
                                                    : '1px solid var(--border-sand)',
                                                fontSize: '13px',
                                                fontWeight: active ? 600 : 500,
                                            }}
                                        >
                                            <span>{opt.label}</span>
                                            {active && <Check size={15} color="var(--terracotta-800)" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Department' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(['All', 'Women', 'Men', 'Kids'] as const).map((dept) => {
                                    const active = (draft.department || 'All') === dept;
                                    return (
                                        <button
                                            key={dept}
                                            type="button"
                                            onClick={() => setDraft({ ...draft, department: dept })}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                borderRadius: 10,
                                                background: active ? '#ffffff' : 'var(--bg-card)',
                                                border: active
                                                    ? '1.5px solid var(--terracotta-800)'
                                                    : '1px solid var(--border-sand)',
                                                fontSize: '13px',
                                                fontWeight: active ? 600 : 500,
                                            }}
                                        >
                                            <span>{dept}</span>
                                            {active && <Check size={15} color="var(--terracotta-800)" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Category' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    'All',
                                    'Accessories',
                                    'Glasses & Sunglasses',
                                    'Dresses',
                                    'Tops',
                                    'Footwear',
                                    'Jewellery',
                                ].map((cat) => {
                                    const active = (draft.category || 'All') === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setDraft({ ...draft, category: cat })}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '11px 14px',
                                                borderRadius: 10,
                                                background: active ? '#ffffff' : 'var(--bg-card)',
                                                border: active
                                                    ? '1.5px solid var(--terracotta-800)'
                                                    : '1px solid var(--border-sand)',
                                                fontSize: '13px',
                                                fontWeight: active ? 600 : 500,
                                            }}
                                        >
                                            <span>{cat}</span>
                                            {active && <Check size={15} color="var(--terracotta-800)" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Size' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {['XS', 'S', 'M', 'Large', 'Medium', 'UK9', 'One Size'].map((sz) => {
                                    const checked = (draft.sizes || []).includes(sz);
                                    return (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() => toggleArrayValue('sizes', sz)}
                                            style={{
                                                padding: '11px 12px',
                                                borderRadius: 10,
                                                background: checked
                                                    ? 'var(--terracotta-920)'
                                                    : '#ffffff',
                                                color: checked ? '#ffffff' : 'var(--text-ink)',
                                                border: '1px solid var(--border-sand)',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {sz}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Brand' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['QUILTED', 'Diesel', 'Prada', 'Versace', 'Lethal'].map((br) => {
                                    const checked = (draft.brands || []).includes(br);
                                    return (
                                        <button
                                            key={br}
                                            type="button"
                                            onClick={() => toggleArrayValue('brands', br)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '11px 14px',
                                                borderRadius: 10,
                                                background: '#ffffff',
                                                border: checked
                                                    ? '1.5px solid var(--terracotta-800)'
                                                    : '1px solid var(--border-sand)',
                                                fontSize: '13px',
                                                fontWeight: checked ? 600 : 500,
                                            }}
                                        >
                                            <span>{br}</span>
                                            <span
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 4,
                                                    border: '1.5px solid var(--terracotta-800)',
                                                    background: checked
                                                        ? 'var(--terracotta-800)'
                                                        : 'transparent',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                }}
                                            >
                                                {checked && <Check size={12} />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Price' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {PRICE_RANGES.map((range) => {
                                        const checked = (draft.priceRanges || []).includes(range.id);
                                        return (
                                            <button
                                                key={range.id}
                                                type="button"
                                                onClick={() =>
                                                    handlePriceRangeToggle(
                                                        range.id,
                                                        range.min,
                                                        range.max
                                                    )
                                                }
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    padding: '10px 12px',
                                                    borderRadius: 10,
                                                    background: '#ffffff',
                                                    border: checked
                                                        ? '1.5px solid var(--terracotta-800)'
                                                        : '1px solid var(--border-sand)',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: 4,
                                                        border: '1.5px solid var(--terracotta-800)',
                                                        background: checked
                                                            ? 'var(--terracotta-800)'
                                                            : 'transparent',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                    }}
                                                >
                                                    {checked && <Check size={12} />}
                                                </span>
                                                <span style={{ fontWeight: checked ? 600 : 400 }}>
                                                    {range.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        marginTop: 6,
                                        paddingTop: 14,
                                        borderTop: '1px solid var(--border-sand)',
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            marginBottom: 10,
                                        }}
                                    >
                                        Custom Price Range
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div
                                            style={{
                                                flex: 1,
                                                background: '#ffffff',
                                                border: '1px solid var(--border-sand)',
                                                borderRadius: 8,
                                                padding: '8px 10px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'block',
                                                    fontSize: '10px',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                Minimum
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="199"
                                                    value={customMin}
                                                    onChange={(e) => setCustomMin(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        fontSize: '13px',
                                                        background: 'transparent',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <span style={{ color: 'var(--text-muted)' }}>—</span>

                                        <div
                                            style={{
                                                flex: 1,
                                                background: '#ffffff',
                                                border: '1px solid var(--border-sand)',
                                                borderRadius: 8,
                                                padding: '8px 10px',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'block',
                                                    fontSize: '10px',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                Maximum
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="25000"
                                                    value={customMax}
                                                    onChange={(e) => setCustomMax(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        fontSize: '13px',
                                                        background: 'transparent',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Color' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Cream', 'Silver', 'Tortoise', 'Ivory', 'Espresso', 'Gold', 'Terracotta', 'Black', 'Olive'].map(
                                    (col) => {
                                        const checked = (draft.colors || []).includes(col);
                                        return (
                                            <button
                                                key={col}
                                                type="button"
                                                onClick={() => toggleArrayValue('colors', col)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    borderRadius: 10,
                                                    background: '#ffffff',
                                                    border: checked
                                                        ? '1.5px solid var(--terracotta-800)'
                                                        : '1px solid var(--border-sand)',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <span>{col}</span>
                                                {checked && <Check size={14} color="var(--terracotta-800)" />}
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        )}

                        {activeTab === 'Material' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {['Leather', 'Acetate', 'Cotton Piqué', 'Linen', 'Gold Vermeil', 'Metal', 'Cotton Rib'].map(
                                    (mat) => {
                                        const checked = (draft.materials || []).includes(mat);
                                        return (
                                            <button
                                                key={mat}
                                                type="button"
                                                onClick={() => toggleArrayValue('materials', mat)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    borderRadius: 10,
                                                    background: '#ffffff',
                                                    border: checked
                                                        ? '1.5px solid var(--terracotta-800)'
                                                        : '1px solid var(--border-sand)',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <span>{mat}</span>
                                                {checked && <Check size={14} color="var(--terracotta-800)" />}
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Action Footer matching 86:4587 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '14px 18px',
                        background: '#ffffff',
                        borderTop: '1px solid var(--border-sand)',
                    }}
                >
                    <button
                        type="button"
                        onClick={handleClearAll}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 10,
                            border: '1px solid var(--border-sand)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Clear all
                    </button>
                    <button
                        type="button"
                        onClick={handleApplyClick}
                        className="revclo-primary-btn"
                        style={{ flex: 1.4, padding: '12px' }}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
