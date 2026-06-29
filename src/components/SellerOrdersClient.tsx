'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import StatusSelect from '@/components/StatusSelect'
import { gsap } from 'gsap'
import { Package, Receipt, ArrowRight, Activity } from 'lucide-react'

export default function SellerOrdersClient({ orders }: { orders: any[] }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const cards = containerRef.current.querySelectorAll('.order-card-luxury')
        gsap.fromTo(cards,
            {
                opacity: 0,
                y: 40,
                skewY: 2
            },
            {
                opacity: 1,
                y: 0,
                skewY: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power4.out',
                delay: 0.2
            }
        )
    }, [])

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 border-t border-white/10 opacity-50">
                <Package size={48} className="mb-6 stroke-1" />
                <p className="font-display text-xl uppercase tracking-widest italic">Inventory Stream Empty</p>
                <p className="label-caps mt-2">No transmissions received_</p>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="flex flex-col gap-12 max-w-6xl">
            {orders.map((order, idx) => (
                <div
                    key={order.id}
                    className={`order-card-luxury relative group border-t border-white/5 pt-12 transition-all duration-700 hover:border-white/20 ${idx % 2 !== 0 ? 'md:ml-24' : 'md:mr-24'}`}
                >
                    {/* Background Fragment */}
                    <div className="absolute -top-6 right-0 text-[10rem] font-display font-black opacity-[0.02] pointer-events-none select-none">
                        {order.id.slice(0, 2)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                        {/* Column 1: Metadata */}
                        <div className="md:col-span-3 space-y-6">
                            <div>
                                <p className="label-caps text-[0.6rem] text-muted-foreground mb-1">Manifest_ID</p>
                                <p className="font-mono text-xs opacity-80 uppercase tracking-tighter">
                                    #TXN-{order.id.slice(0, 8)}
                                </p>
                            </div>

                            <div>
                                <p className="label-caps text-[0.6rem] text-muted-foreground mb-1">Telemetry_Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    <StatusSelect orderId={order.id} initialStatus={order.status} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="label-caps text-[0.6rem] text-muted-foreground mb-1">Revenue_Gross</p>
                                <p className="font-display text-3xl font-bold italic">₹{order.total_amount}</p>
                            </div>
                        </div>

                        {/* Column 2: Items Stream */}
                        <div className="md:col-span-6 border-x border-white/5 px-8 space-y-8">
                            {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex gap-6 group/item relative">
                                    <div className="w-16 h-20 relative overflow-hidden bg-white/5 border border-white/10">
                                        {item.products?.images?.[0] ? (
                                            <Image
                                                src={item.products.images[0]}
                                                alt=""
                                                fill
                                                className="object-cover transition-all duration-700 group-hover/item:scale-110"
                                            />
                                        ) : (
                                            <div className="w-100 h-100 bg-white/5 flex items-center justify-center">
                                                <Package className="opacity-20 stroke-1" size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 py-1">
                                        <h4 className="font-heading font-semibold text-sm tracking-tight mb-1 group-hover/item:text-blue-400 transition-colors">
                                            {item.products?.title}
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <p className="font-mono text-[0.65rem] opacity-40 uppercase">
                                                Qty: {item.quantity || 1}
                                            </p>
                                            <p className="font-mono text-[0.65rem] opacity-40 uppercase border-l border-white/10 pl-4">
                                                Unit price: ₹{item.price}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Column 3: Logistics Action */}
                        <div className="md:col-span-3 flex flex-col justify-end items-end space-y-4">
                            <div className="text-right">
                                <p className="label-caps text-[0.6rem] text-muted-foreground mb-1">Timestamp</p>
                                <p className="font-mono text-[0.6rem] opacity-40 uppercase">
                                    {new Date(order.created_at || Date.now()).toLocaleTimeString()}
                                </p>
                            </div>

                            <button className="flex items-center gap-3 py-3 px-6 bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all duration-500 group/btn">
                                <span className="label-caps text-[0.6rem] font-black">Dispatch Details</span>
                                <ArrowRight size={14} className="transition-transform duration-500 group-hover/btn:translate-x-1" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Decorative Line */}
                    <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 w-0 group-hover:w-full transition-all duration-1000 ease-out" />
                </div>
            ))}
        </div>
    )
}
