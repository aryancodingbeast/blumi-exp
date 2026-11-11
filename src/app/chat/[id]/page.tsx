'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MoreVertical, Send } from 'lucide-react';
import { Conversation } from '@/types';
import { getConversationById, sendConversationMessage } from '@/actions/marketplace';
import { SEED_CONVERSATIONS } from '@/lib/revcloSeedData';

export default function ChatThreadPage() {
    const params = useParams();
    const router = useRouter();
    const convId = typeof params.id === 'string' ? params.id : 'conv-1';

    const [conversation, setConversation] = useState<Conversation>(SEED_CONVERSATIONS[0]);
    const [messageText, setMessageText] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getConversationById(convId).then((res) => {
            if (res) setConversation(res);
        });
    }, [convId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation.messages.length]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || sending) return;

        const textToSend = messageText.trim();
        setMessageText('');
        setSending(true);

        const res = await sendConversationMessage(conversation.id, textToSend);
        setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, res.message],
            last_message: res.message.text,
            last_message_time: res.message.timestamp_label,
        }));
        setSending(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                background: 'var(--bg-canvas)',
            }}
        >
            {/* Top Seller Bar matching Figma 139:2583 */}
            <header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border-sand)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        type="button"
                        onClick={() => router.push('/chat')}
                        className="revclo-icon-btn"
                        aria-label="Back to messages"
                    >
                        <ArrowLeft size={17} />
                    </button>

                    <Link
                        href={`/creator/${conversation.participant_handle}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                        <img
                            src={conversation.participant_avatar}
                            alt={conversation.participant_name}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                objectFit: 'cover',
                                border: '1px solid var(--border-card)',
                            }}
                        />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>
                                {conversation.participant_name}
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '11px',
                                    color: '#17a34a',
                                    fontWeight: 500,
                                }}
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 999,
                                        background: '#17a34a',
                                    }}
                                />
                                <span>Active now</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <button type="button" className="revclo-icon-btn" aria-label="More options">
                    <MoreVertical size={16} />
                </button>
            </header>

            {/* Sticky Dark Terracotta Product Context Banner matching Figma 139:2583 */}
            <Link
                href={`/product/${conversation.product_id}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 16px',
                    background: 'var(--terracotta-950)',
                    color: '#ffffff',
                    borderBottom: '1px solid var(--terracotta-800)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <img
                        src={
                            conversation.product_images[0] ||
                            '/figma/14bdb6af-eb9e-4d33-ba53-2b0e83cb8918.png'
                        }
                        alt={conversation.product_title}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: '12.5px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {conversation.product_title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--terracotta-300)' }}>
                            ₹{conversation.product_price.toLocaleString('en-IN')} •{' '}
                            {conversation.product_size}
                        </div>
                    </div>
                </div>

                <span
                    style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.12)',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}
                >
                    View item
                </span>
            </Link>

            {/* Messages Scroll Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
            >
                {/* Date Pill matching 139:2583 */}
                <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 999,
                            background: '#e5e2dc',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 600,
                        }}
                    >
                        Wed, 21 Aug
                    </span>
                </div>

                {conversation.messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                maxWidth: '78%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <div
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: isMe
                                        ? '16px 16px 4px 16px'
                                        : '16px 16px 16px 4px',
                                    background: isMe ? 'var(--terracotta-920)' : '#f8f8f8',
                                    color: isMe ? '#ffffff' : 'var(--text-ink)',
                                    border: isMe
                                        ? '1px solid var(--terracotta-800)'
                                        : '1px solid var(--border-sand)',
                                    fontSize: '13px',
                                    lineHeight: 1.45,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                }}
                            >
                                {msg.text}
                            </div>
                            <span
                                style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    marginTop: 4,
                                    padding: '0 4px',
                                }}
                            >
                                {msg.timestamp_label}
                            </span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Quick Offer Chips + Sticky Input Bar */}
            <div
                style={{
                    background: '#ffffff',
                    borderTop: '1px solid var(--border-sand)',
                    padding: '10px 14px 16px',
                }}
            >
                <div
                    className="no-scrollbar"
                    style={{
                        display: 'flex',
                        gap: 6,
                        overflowX: 'auto',
                        marginBottom: 8,
                    }}
                >
                    {[
                        'Is this still available?',
                        'Can you ship tomorrow?',
                        'Would you take ₹450?',
                        'Any flaws or stains?',
                    ].map((quick) => (
                        <button
                            key={quick}
                            type="button"
                            onClick={() => setMessageText(quick)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: 999,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-sand)',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {quick}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={handleSend}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Message..."
                        style={{
                            flex: 1,
                            height: 42,
                            padding: '0 14px',
                            borderRadius: 999,
                            background: 'var(--bg-canvas)',
                            border: '1px solid var(--border-sand)',
                            fontSize: '13px',
                            outline: 'none',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!messageText.trim() || sending}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            background: messageText.trim()
                                ? 'var(--terracotta-920)'
                                : 'var(--border-card)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
