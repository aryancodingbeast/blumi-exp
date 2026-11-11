'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Archive,
    ArrowLeft,
    MailCheck,
    MoreVertical,
    Search,
    Trash2,
} from 'lucide-react';
import { Conversation } from '@/types';
import { getConversations, updateConversationStatus } from '@/actions/marketplace';
import { SEED_CONVERSATIONS } from '@/lib/revcloSeedData';

export default function ChatInboxPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
    const [folder, setFolder] = useState<'all' | 'requests' | 'archived'>('all');
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [query, setQuery] = useState<string>('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        getConversations().then((res) => {
            if (res && res.length > 0) setConversations(res);
        });
    }, []);

    const handleAction = async (
        e: React.MouseEvent,
        convId: string,
        action: 'mark_unread' | 'archive' | 'unarchive' | 'delete'
    ) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(null);
        const updated = await updateConversationStatus(convId, action);
        setConversations([...updated]);
    };

    const filtered = conversations.filter((c) => {
        if (c.folder !== folder) return false;
        if (query.trim()) {
            const q = query.toLowerCase();
            return (
                c.participant_name.toLowerCase().includes(q) ||
                c.product_title.toLowerCase().includes(q) ||
                c.last_message.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 32 }}>
            {/* Top Bar matching Figma 118:7954 */}
            <header className="revclo-page-header">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="revclo-icon-btn"
                    aria-label="Back"
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="revclo-page-title">Messages</span>
                <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="revclo-icon-btn"
                    aria-label="Search messages"
                >
                    <Search size={16} />
                </button>
            </header>

            {searchOpen && (
                <div style={{ padding: '10px 16px', background: '#ffffff', borderBottom: '1px solid var(--border-sand)' }}>
                    <div className="revclo-search-pill">
                        <Search size={14} color="var(--text-muted)" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search seller or item..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                                fontSize: '13px',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Folder Tabs: All / Requests / Archived matching 118:7954 */}
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-sand)',
                    background: 'var(--bg-canvas)',
                }}
            >
                {(
                    [
                        { id: 'all', label: 'All' },
                        {
                            id: 'requests',
                            label: `Requests (${conversations.filter((c) => c.folder === 'requests').length})`,
                        },
                        {
                            id: 'archived',
                            label: `Archived (${conversations.filter((c) => c.folder === 'archived').length})`,
                        },
                    ] as const
                ).map((tab) => {
                    const active = folder === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFolder(tab.id)}
                            style={{
                                padding: '7px 14px',
                                borderRadius: 999,
                                background: active ? 'var(--terracotta-920)' : '#ffffff',
                                color: active ? '#ffffff' : 'var(--text-secondary)',
                                border: '1px solid var(--border-sand)',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Conversation List */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.length === 0 ? (
                    <div
                        style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                        }}
                    >
                        No conversations in {folder}.
                    </div>
                ) : (
                    filtered.map((conv) => (
                        <div
                            key={conv.id}
                            style={{
                                position: 'relative',
                                borderBottom: '1px solid var(--border-sand)',
                                background: conv.unread_count > 0 ? '#faf8f5' : 'var(--bg-canvas)',
                            }}
                        >
                            <Link
                                href={`/chat/${conv.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 16px',
                                }}
                            >
                                {/* Participant Avatar + Online Dot */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <img
                                        src={conv.participant_avatar}
                                        alt={conv.participant_name}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 999,
                                            objectFit: 'cover',
                                            border: '1px solid var(--border-card)',
                                        }}
                                    />
                                    {conv.participant_online && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                bottom: 1,
                                                right: 1,
                                                width: 11,
                                                height: 11,
                                                borderRadius: 999,
                                                background: '#17a34a',
                                                border: '2px solid #ffffff',
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Center Message Preview */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            marginBottom: 3,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: conv.unread_count > 0 ? 700 : 600,
                                                color: 'var(--text-ink)',
                                            }}
                                        >
                                            {conv.participant_name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            • {conv.last_message_time}
                                        </span>
                                        {conv.unread_count > 0 && (
                                            <span
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: 999,
                                                    background: 'var(--terracotta-600)',
                                                }}
                                            />
                                        )}
                                    </div>
                                    <p
                                        style={{
                                            fontSize: '12.5px',
                                            color:
                                                conv.unread_count > 0
                                                    ? 'var(--text-ink)'
                                                    : 'var(--text-secondary)',
                                            fontWeight: conv.unread_count > 0 ? 600 : 400,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {conv.last_message}
                                    </p>
                                </div>

                                {/* Stacked Rotated Product Thumbnails matching Figma 118:7954 */}
                                <div
                                    style={{
                                        position: 'relative',
                                        width: 46,
                                        height: 46,
                                        flexShrink: 0,
                                    }}
                                >
                                    {conv.product_images[1] && (
                                        <img
                                            src={conv.product_images[1]}
                                            alt=""
                                            style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: 6,
                                                width: 38,
                                                height: 38,
                                                borderRadius: 8,
                                                objectFit: 'cover',
                                                border: '1px solid var(--border-card)',
                                                transform: 'rotate(9deg)',
                                            }}
                                        />
                                    )}
                                    <img
                                        src={
                                            conv.product_images[0] ||
                                            '/figma/14bdb6af-eb9e-4d33-ba53-2b0e83cb8918.png'
                                        }
                                        alt={conv.product_title}
                                        style={{
                                            position: 'absolute',
                                            top: 4,
                                            left: 0,
                                            width: 38,
                                            height: 38,
                                            borderRadius: 8,
                                            objectFit: 'cover',
                                            border: '1.5px solid #ffffff',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                            transform: 'rotate(-5deg)',
                                        }}
                                    />
                                </div>

                                {/* Context Menu Button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                                    }}
                                    aria-label="Conversation actions"
                                    style={{
                                        padding: 6,
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </Link>

                            {/* Floating Context Menu matching Figma 118:7954 */}
                            {openMenuId === conv.id && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: 16,
                                        top: 56,
                                        zIndex: 30,
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        border: '1px solid var(--border-sand)',
                                        boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
                                        minWidth: 156,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => handleAction(e, conv.id, 'mark_unread')}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            fontSize: '12.5px',
                                            borderBottom: '1px solid var(--border-sand)',
                                        }}
                                    >
                                        <MailCheck size={14} />
                                        <span>Mark unread</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) =>
                                            handleAction(
                                                e,
                                                conv.id,
                                                conv.folder === 'archived' ? 'unarchive' : 'archive'
                                            )
                                        }
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            fontSize: '12.5px',
                                            borderBottom: '1px solid var(--border-sand)',
                                        }}
                                    >
                                        <Archive size={14} />
                                        <span>
                                            {conv.folder === 'archived' ? 'Unarchive' : 'Archive'}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleAction(e, conv.id, 'delete')}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 14px',
                                            fontSize: '12.5px',
                                            color: '#dc2626',
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
