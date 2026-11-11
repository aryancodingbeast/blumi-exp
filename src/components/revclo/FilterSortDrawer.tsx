'use client';

import React, { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import {
    REVCLO_BRANDS_CATALOG,
    REVCLO_CATEGORIES_CATALOG,
    REVCLO_SIZE_OPTIONS,
} from '@/lib/revcloSeedData';

export interface FilterSortState {
    sortBy: 'trending' | 'price_asc' | 'price_desc' | 'newest' | 'trust_score';
    category: string;
    sizes: string[];
    conditions: string[];
    brands: string[];
    maxPrice: number;
}

interface FilterSortDrawerProps {
    open: boolean;
    onClose: () => void;
    value: FilterSortState;
    onChange: (next: FilterSortState) => void;
    totalResults?: number;
}

const TABS = [
    { id: 'sort', label: 'Sort by' },
    { id: 'category', label: 'Category' },
    { id: 'size', label: 'Size' },
    { id: 'condition', label: 'Condition' },
    { id: 'brand', label: 'Brand' },
    { id: 'price', label: 'Price' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function FilterSortDrawer({
    open,
    onClose,
    value,
    onChange,
    totalResults = 0,
}: FilterSortDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabId>('sort');

    if (!open) return null;

    const toggleItem = (list: string[], item: string) =>
        list.includes(item)
            ? list.filter((x) => x !== item)
            : [...list, item];

    const handleReset = () => {
        onChange({
            sortBy: 'trending',
            category: 'All',
            sizes: [],
            conditions: [],
            brands: [],
            maxPrice: 50000,
        });
    };

    return (
        <div className="revclo-backdrop" onClick={onClose}>
            <div
                className="revclo-sheet !max-w-[540px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Figma 93:3638) */}
                <div className="p-4 border-b border-[#DCD6CD] flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-[16px] font-bold text-[#161616]">
                            Filter &amp; Sort
                        </h3>
                        <p className="text-[11px] text-[#6F6F6F]">
                            {totalResults} verified pieces matching selection
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-3 py-1.5 rounded-full bg-[#F7F6F3] border border-[#DCD6CD] text-[11px] font-semibold text-[#532B21] inline-flex items-center gap-1"
                        >
                            <RotateCcw size={11} />
                            Clear all
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[#F2F2F2] flex items-center justify-center"
                            aria-label="Close filters"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Two-Pane Body matching Figma 93:3638 */}
                <div className="grid grid-cols-12 h-[380px] bg-white overflow-hidden">
                    {/* Left Navigation Rail */}
                    <div className="col-span-4 bg-[#F7F6F3] border-r border-[#E6E3DD] flex flex-col">
                        {TABS.map((t) => {
                            const active = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`px-4 py-3.5 text-left text-[13px] font-semibold border-l-4 transition-all ${
                                        active
                                            ? 'bg-white border-[#532B21] text-[#161616]'
                                            : 'border-transparent text-[#6F6F6F] hover:text-[#161616]'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Options Area */}
                    <div className="col-span-8 p-4 overflow-y-auto flex flex-col gap-2">
                        {activeTab === 'sort' &&
                            (
                                [
                                    { id: 'trending', label: 'Trending & Popular' },
                                    { id: 'price_asc', label: 'Price: Low to High' },
                                    { id: 'price_desc', label: 'Price: High to Low' },
                                    { id: 'newest', label: 'Newest First' },
                                    { id: 'trust_score', label: 'Highest AI Trust Score' },
                                ] as const
                            ).map((opt) => {
                                const selected = value.sortBy === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                sortBy: opt.id,
                                            })
                                        }
                                        className={`p-3 rounded-xl border flex items-center justify-between text-left text-[13px] font-medium ${
                                            selected
                                                ? 'border-[#532B21] bg-[#FBF9F6] font-bold text-[#161616]'
                                                : 'border-[#EFEFEF] text-[#434343]'
                                        }`}
                                    >
                                        <span>{opt.label}</span>
                                        {selected && (
                                            <Check
                                                size={15}
                                                className="text-[#532B21]"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                        {activeTab === 'category' &&
                            [
                                'All',
                                ...Object.keys(REVCLO_CATEGORIES_CATALOG),
                            ].map((cat) => {
                                const selected = value.category === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                category: cat,
                                            })
                                        }
                                        className={`p-3 rounded-xl border flex items-center justify-between text-left text-[13px] font-medium ${
                                            selected
                                                ? 'border-[#532B21] bg-[#FBF9F6] font-bold text-[#161616]'
                                                : 'border-[#EFEFEF] text-[#434343]'
                                        }`}
                                    >
                                        <span>
                                            {cat === 'All'
                                                ? 'All Categories'
                                                : cat}
                                        </span>
                                        {selected && (
                                            <Check
                                                size={15}
                                                className="text-[#532B21]"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                        {activeTab === 'size' && (
                            <div className="grid grid-cols-2 gap-2">
                                {REVCLO_SIZE_OPTIONS.map((sz) => {
                                    const selected = value.sizes.includes(sz);
                                    return (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() =>
                                                onChange({
                                                    ...value,
                                                    sizes: toggleItem(
                                                        value.sizes,
                                                        sz
                                                    ),
                                                })
                                            }
                                            className={`p-2.5 rounded-xl border text-[12px] font-semibold flex items-center justify-between ${
                                                selected
                                                    ? 'bg-[#532B21] text-white border-[#532B21]'
                                                    : 'bg-white text-[#161616] border-[#DCD6CD]'
                                            }`}
                                        >
                                            <span>{sz}</span>
                                            {selected && <Check size={13} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'condition' &&
                            (
                                [
                                    'Pristine',
                                    'Excellent',
                                    'Good',
                                    'Well-loved',
                                ] as const
                            ).map((cond) => {
                                const selected =
                                    value.conditions.includes(cond);
                                return (
                                    <button
                                        key={cond}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                conditions: toggleItem(
                                                    value.conditions,
                                                    cond
                                                ),
                                            })
                                        }
                                        className={`p-3 rounded-xl border flex items-center justify-between text-left text-[13px] font-medium ${
                                            selected
                                                ? 'border-[#532B21] bg-[#FBF9F6] font-bold text-[#161616]'
                                                : 'border-[#EFEFEF] text-[#434343]'
                                        }`}
                                    >
                                        <span>{cond}</span>
                                        {selected && (
                                            <Check
                                                size={15}
                                                className="text-[#532B21]"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                        {activeTab === 'brand' &&
                            REVCLO_BRANDS_CATALOG.slice(0, 20).map((b) => {
                                const selected = value.brands.includes(b);
                                return (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                brands: toggleItem(
                                                    value.brands,
                                                    b
                                                ),
                                            })
                                        }
                                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left text-[13px] font-medium ${
                                            selected
                                                ? 'border-[#532B21] bg-[#FBF9F6] font-bold text-[#161616]'
                                                : 'border-[#EFEFEF] text-[#434343]'
                                        }`}
                                    >
                                        <span>{b}</span>
                                        {selected && (
                                            <Check
                                                size={15}
                                                className="text-[#532B21]"
                                            />
                                        )}
                                    </button>
                                );
                            })}

                        {activeTab === 'price' &&
                            [
                                { label: 'Under ₹299', max: 299 },
                                { label: 'Under ₹499', max: 499 },
                                { label: 'Under ₹999', max: 999 },
                                { label: 'Under ₹2,499', max: 2499 },
                                { label: 'All Prices', max: 50000 },
                            ].map((p) => {
                                const selected = value.maxPrice === p.max;
                                return (
                                    <button
                                        key={p.max}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                maxPrice: p.max,
                                            })
                                        }
                                        className={`p-3 rounded-xl border flex items-center justify-between text-left text-[13px] font-medium ${
                                            selected
                                                ? 'border-[#532B21] bg-[#FBF9F6] font-bold text-[#161616]'
                                                : 'border-[#EFEFEF] text-[#434343]'
                                        }`}
                                    >
                                        <span>{p.label}</span>
                                        {selected && (
                                            <Check
                                                size={15}
                                                className="text-[#532B21]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="p-4 border-t border-[#DCD6CD] bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full h-11 rounded-xl bg-[#532B21] hover:bg-[#361C15] text-white text-[13px] font-bold"
                    >
                        Show {totalResults} Results
                    </button>
                </div>
            </div>
        </div>
    );
}
