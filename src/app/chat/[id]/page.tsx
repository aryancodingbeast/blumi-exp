'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Conversation } from '@/types';
import {
    getConversationById,
    sendConversationMessage,
} from '@/actions/marketplace';

export default function ChatThreadPage() {
    const params = useParams();
    const router = useRouter();
    const convId = String(params?.id || '');

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        getConversationById(convId)
            .then((c) => {
                if (active) setConversation(c);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [convId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversation || !input.trim()) return;
        const text = input.trim();
        setInput('');

        const now = new Date();
        const label = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
        ).padStart(2, '0')}`;

        setConversation({
            ...conversation,
            last_message: text,
            last_message_time: label,
            messages: [
                ...conversation.messages,
                {
                    id: `msg-${Date.now()}`,
                    conversation_id: conversation.id,
                    sender: 'me',
                    text,
                    timestamp_label: label,
                    created_at: now.toISOString(),
                },
            ],
        });

        await sendConversationMessage(conversation.id, text);
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#5E5E5E]">
                <Loader2 size={26} className="animate-spin text-[#532B21]" />
                <p className="text-[13px]">Loading conversation...</p>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="py-20 text-center">
                <p className="text-[15px] font-bold">Conversation not found</p>
                <Link
                    href="/chat"
                    className="mt-3 inline-block underline text-[13px]"
                >
                    Back to Messages
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[780px] mx-auto min-h-[calc(100vh-80px)] flex flex-col bg-white md:rounded-[22px] md:border md:border-[#DCD6CD] md:my-4 overflow-hidden">
            {/* Header (Figma 326:12858) */}
            <header className="p-4 border-b border-[#EFEFEF] flex items-center justify-between bg-[#FBF9F6]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/chat')}
                        className="revclo-icon-btn"
                        aria-label="Back to messages"
                    >
                        <ArrowLeft size={17} />
                    </button>
                    <img
                        src={conversation.participant_avatar}
                        alt={conversation.participant_name}
                        className="w-10 h-10 rounded-full object-cover border border-[#CDC8BF]"
                    />
                    <div>
                        <h1 className="text-[15px] font-bold text-[#161616]">
                            {conversation.participant_name}
                        </h1>
                        <p className="text-[11px] text-[#007A00] font-medium">
                            @{conversation.participant_handle} &bull; Active now
                        </p>
                    </div>
                </div>
            </header>

            {/* Attached Product Banner */}
            <Link
                href={`/product/${conversation.product_id}`}
                className="p-3 bg-[#F7F6F3] border-b border-[#E6E3DD] flex items-center justify-between gap-3"
            >
                <div className="flex items-center gap-3 min-w-0">
                    {conversation.product_images[0] && (
                        <img
                            src={conversation.product_images[0]}
                            alt={conversation.product_title}
                            className="w-12 h-12 rounded-lg object-cover border border-[#CDC8BF] shrink-0"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#161616] truncate">
                            {conversation.product_title}
                        </p>
                        <p className="text-[12px] font-semibold text-[#532B21]">
                            ₹{conversation.product_price.toLocaleString('en-IN')}{' '}
                            &bull; Size {conversation.product_size}
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD6CD] text-[11px] font-semibold text-[#161616] shrink-0">
                    View Piece
                </span>
            </Link>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {conversation.messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[78%] ${
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
                                {msg.timestamp_label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Composer */}
            <form
                onSubmit={handleSend}
                className="p-3.5 border-t border-[#EFEFEF] flex items-center gap-2.5 bg-[#FAFAFA]"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 h-11 px-4 rounded-full bg-white border border-[#DCD6CD] text-[13px] outline-none focus:border-[#161616]"
                />
                <button
                    type="submit"
                    className="w-11 h-11 rounded-full bg-[#532B21] text-white flex items-center justify-center shrink-0"
                    aria-label="Send"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
