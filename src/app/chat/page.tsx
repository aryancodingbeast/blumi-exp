'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Archive,
    ArrowLeft,
    Loader2,
    LogIn,
    Mail,
    MessageCircle,
    Search,
    Send,
    Trash2,
} from 'lucide-react';
import { Conversation } from '@/types';
import {
    AuthenticatedMarketplaceUser,
    getConversations,
    getCurrentUser,
    sendConversationMessage,
    updateConversationStatus,
} from '@/actions/marketplace';
import BottomNavbar from '@/components/revclo/BottomNavbar';

export default function ChatInboxPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] =
        useState<AuthenticatedMarketplaceUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [folder, setFolder] = useState<'all' | 'requests' | 'archived'>('all');
    const [search, setSearch] = useState('');
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [draftMessage, setDraftMessage] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getCurrentUser(), getConversations('all')])
            .then(([user, convs]) => {
                if (!active) return;
                setCurrentUser(user);
                setConversations(convs);
                if (convs[0]) setSelectedConvId(convs[0].id);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            if (folder === 'all' && c.folder === 'archived') return false;
            if (folder !== 'all' && c.folder !== folder) return false;
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                return (
                    c.participant_name.toLowerCase().includes(q) ||
                    c.product_title.toLowerCase().includes(q) ||
                    c.last_message.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [conversations, folder, search]);

    const activeDesktopConv = useMemo(
        () =>
            conversations.find((c) => c.id === selectedConvId) ||
            filteredConversations[0] ||
            null,
        [conversations, selectedConvId, filteredConversations]
    );

    const handleAction = async (
        id: string,
        action: 'archive' | 'delete' | 'mark_unread'
    ) => {
        if (action === 'delete') {
            setConversations((prev) => prev.filter((c) => c.id !== id));
        } else if (action === 'archive') {
            setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, folder: 'archived' } : c))
            );
        } else if (action === 'mark_unread') {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, unread_count: c.unread_count + 1 } : c
                )
            );
        }
        await updateConversationStatus(id, action);
    };

    const handleSendDesktopMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeDesktopConv || !draftMessage.trim()) return;
        const text = draftMessage.trim();
        setDraftMessage('');

        const now = new Date();
        const label = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
        ).padStart(2, '0')}`;

        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeDesktopConv.id
                    ? {
                          ...c,
                          last_message: text,
                          last_message_time: label,
                          messages: [
                              ...c.messages,
                              {
                                  id: `msg-${Date.now()}`,
                                  conversation_id: c.id,
                                  sender: 'me',
                                  text,
                                  timestamp_label: label,
                                  created_at: now.toISOString(),
                              },
                          ],
                      }
                    : c
            )
        );

        await sendConversationMessage(activeDesktopConv.id, text);
    };

    return (
        <>
            <header className="revclo-page-header">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="revclo-icon-btn"
                        aria-label="Back"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <h1 className="revclo-page-title">Messages</h1>
                </div>

                {/* Folder Pills (Figma 326:12915 All | Requests | Archived) */}
                <div className="flex items-center gap-1.5">
                    {(['all', 'requests', 'archived'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFolder(f)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all ${
                                folder === f
                                    ? 'bg-[#532B21] text-white'
                                    : 'bg-white border border-[#DCD6CD] text-[#5E5E5E]'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <main className="revclo-main-canvas px-4 md:px-0 pt-2">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                        <Loader2
                            size={26}
                            className="animate-spin text-[#532B21]"
                        />
                        <p className="text-[13px]">Loading messages...</p>
                    </div>
                ) : !currentUser ? (
                    <div className="max-w-[540px] mx-auto my-8 bg-white rounded-[20px] border border-[#DCD6CD] p-8 text-center">
                        <MessageCircle
                            size={32}
                            className="mx-auto mb-3 text-[#532B21]"
                        />
                        <h2 className="text-[19px] font-bold text-[#161616]">
                            Sign in to message sellers
                        </h2>
                        <p className="text-[13px] text-[#5E5E5E] mt-1.5 mb-5">
                            Sign in to chat with sellers, negotiate offers, and request garment measurements.
                        </p>
                        <Link
                            href="/login?callbackUrl=/chat"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161616] text-white text-[13px] font-semibold"
                        >
                            <LogIn size={15} />
                            <span>Sign In</span>
                        </Link>
                    </div>
                ) : (
                    /* Responsive Split-Pane Messenger on Desktop, Thread List on Mobile */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Pane: Inbox List */}
                        <div className="lg:col-span-5 flex flex-col gap-3">
                            <div className="revclo-search-pill !h-10 !bg-white">
                                <Search size={15} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations or items..."
                                    className="w-full bg-transparent border-none outline-none text-[13px] text-[#161616]"
                                />
                            </div>

                            {filteredConversations.length === 0 ? (
                                <div className="bg-white rounded-[18px] border border-[#DCD6CD] p-8 text-center text-[#5E5E5E] text-[13px]">
                                    No conversations in {folder}. Tap &ldquo;Ask Seller&rdquo; on any product page to start chatting!
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {filteredConversations.map((conv) => {
                                        const isSelected =
                                            activeDesktopConv?.id === conv.id;
                                        return (
                                            <div
                                                key={conv.id}
                                                className={`bg-white rounded-[16px] border p-3.5 transition-all ${
                                                    isSelected
                                                        ? 'border-[#532B21] ring-1 ring-[#532B21]/20'
                                                        : 'border-[#DCD6CD] hover:border-[#8B4736]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div
                                                        onClick={() => {
                                                            setSelectedConvId(
                                                                conv.id
                                                            );
                                                            if (
                                                                window.innerWidth <
                                                                1024
                                                            ) {
                                                                router.push(
                                                                    `/chat/${conv.id}`
                                                                );
                                                            }
                                                        }}
                                                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                    >
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={
                                                                    conv.participant_avatar
                                                                }
                                                                alt={
                                                                    conv.participant_name
                                                                }
                                                                className="w-12 h-12 rounded-full object-cover border border-[#CDC8BF]"
                                                            />
                                                            {conv.participant_online && (
                                                                <span className="w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white absolute bottom-0 right-0" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-[14px] font-bold text-[#161616] truncate">
                                                                    {
                                                                        conv.participant_name
                                                                    }
                                                                </span>
                                                                <span className="text-[11px] text-[#7C7C7C] shrink-0">
                                                                    {
                                                                        conv.last_message_time
                                                                    }
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] font-semibold text-[#8B4736] truncate">
                                                                {
                                                                    conv.product_title
                                                                }{' '}
                                                                &bull; ₹
                                                                {conv.product_price.toLocaleString(
                                                                    'en-IN'
                                                                )}
                                                            </p>
                                                            <p className="text-[12px] text-[#5E5E5E] truncate mt-0.5">
                                                                {
                                                                    conv.last_message
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions (Figma 326:13031 Unread / Archive / Delete) */}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleAction(
                                                                    conv.id,
                                                                    'mark_unread'
                                                                )
                                                            }
                                                            title="Mark Unread"
                                                            className="w-7 h-7 rounded-lg hover:bg-[#F2F2F2] flex items-center justify-center text-[#5E5E5E]"
                                                        >
                                                            <Mail size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleAction(
                                                                    conv.id,
                                                                    'archive'
                                                                )
                                                            }
                                                            title="Archive"
                                                            className="w-7 h-7 rounded-lg hover:bg-[#F2F2F2] flex items-center justify-center text-[#5E5E5E]"
                                                        >
                                                            <Archive
                                                                size={13}
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleAction(
                                                                    conv.id,
                                                                    'delete'
                                                                )
                                                            }
                                                            title="Delete"
                                                            className="w-7 h-7 rounded-lg hover:bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Pane (Desktop Split View): Active Thread (Figma 326:12858) */}
                        <div className="hidden lg:flex lg:col-span-7 flex-col bg-white rounded-[22px] border border-[#DCD6CD] h-[640px] overflow-hidden">
                            {activeDesktopConv ? (
                                <>
                                    {/* Thread Header */}
                                    <div className="p-4 border-b border-[#EFEFEF] flex items-center justify-between bg-[#FBF9F6]">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    activeDesktopConv.participant_avatar
                                                }
                                                alt={
                                                    activeDesktopConv.participant_name
                                                }
                                                className="w-10 h-10 rounded-full object-cover border border-[#CDC8BF]"
                                            />
                                            <div>
                                                <div className="text-[14px] font-bold text-[#161616]">
                                                    {
                                                        activeDesktopConv.participant_name
                                                    }
                                                </div>
                                                <div className="text-[11px] text-[#007A00] font-medium">
                                                    @{
                                                        activeDesktopConv.participant_handle
                                                    }{' '}
                                                    &bull; Online
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/product/${activeDesktopConv.product_id}`}
                                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCD6CD] hover:border-[#161616]"
                                        >
                                            {activeDesktopConv
                                                .product_images[0] && (
                                                <img
                                                    src={
                                                        activeDesktopConv
                                                            .product_images[0]
                                                    }
                                                    alt=""
                                                    className="w-9 h-9 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="text-left">
                                                <p className="text-[12px] font-bold text-[#161616] truncate max-w-[160px]">
                                                    {
                                                        activeDesktopConv.product_title
                                                    }
                                                </p>
                                                <p className="text-[11px] font-semibold text-[#532B21]">
                                                    ₹
                                                    {activeDesktopConv.product_price.toLocaleString(
                                                        'en-IN'
                                                    )}{' '}
                                                    &bull; Size{' '}
                                                    {
                                                        activeDesktopConv.product_size
                                                    }
                                                </p>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                                        {activeDesktopConv.messages.map(
                                            (msg) => {
                                                const isMe =
                                                    msg.sender === 'me';
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex flex-col max-w-[75%] ${
                                                            isMe
                                                                ? 'self-end items-end'
                                                                : 'self-start items-start'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                                                                isMe
                                                                    ? 'bg-[#532B21] text-white rounded-br-sm'
                                                                    : 'bg-[#F2F2F2] text-[#161616] rounded-bl-sm'
                                                            }`}
                                                        >
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[10px] text-[#8C8C8C] mt-1 px-1">
                                                            {
                                                                msg.timestamp_label
                                                            }
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <form
                                        onSubmit={handleSendDesktopMessage}
                                        className="p-3.5 border-t border-[#EFEFEF] flex items-center gap-2.5 bg-[#FAFAFA]"
                                    >
                                        <input
                                            type="text"
                                            value={draftMessage}
                                            onChange={(e) =>
                                                setDraftMessage(e.target.value)
                                            }
                                            placeholder="Write a message or counter-offer..."
                                            className="flex-1 h-11 px-4 rounded-full bg-white border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                                        />
                                        <button
                                            type="submit"
                                            className="w-11 h-11 rounded-full bg-[#532B21] text-white flex items-center justify-center shrink-0"
                                            aria-label="Send message"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-[#7C7C7C] text-[13px]">
                                    Select a conversation on the left to view messages
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <BottomNavbar />
        </>
    );
}
