import { auth } from '@/lib/auth'
import { getSellerOrders } from '@/actions/orders'
import SellerOrdersClient from '@/components/SellerOrdersClient'
import { Activity } from 'lucide-react'

export default async function SellerOrdersPage() {
    const session = await auth()
    if (!session?.user?.id) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="font-display text-2xl uppercase italic tracking-widest opacity-80">Access Restricted_</h1>
                <p className="label-caps mt-4 opacity-50">Please authenticate to access transaction telemetry</p>
            </div>
        )
    }

    const sellerId = session.user.id
    const orders = await getSellerOrders(sellerId)

    return (
        <div className="container mx-auto px-8 md:px-12 py-32 max-w-7xl">
            <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-[1px] bg-blue-500" />
                        <p className="label-caps text-blue-500 font-black tracking-widest">Fulfillment System v2.6</p>
                    </div>
                    <h1 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] italic mb-8">
                        Transaction<br />Telemetry
                    </h1>
                    <p className="font-mono text-xs opacity-40 uppercase max-w-sm tracking-tight leading-relaxed">
                        Real-time monitoring of incoming order streams and inventory velocity. All data is synchronized via Nexus Hub.
                    </p>
                </div>

                <div className="flex gap-12 border-l border-white/10 pl-12 h-fit">
                    <div>
                        <p className="label-caps text-[0.6rem] opacity-40 mb-2">Network_Status</p>
                        <div className="flex items-center gap-2">
                            <Activity size={14} className="text-green-500 animate-pulse" />
                            <span className="font-mono text-xs uppercase font-bold tracking-widest">Active</span>
                        </div>
                    </div>
                    <div>
                        <p className="label-caps text-[0.6rem] opacity-40 mb-2">Order_Density</p>
                        <span className="font-mono text-xs uppercase font-bold tracking-widest">{orders?.length || 0} Entities</span>
                    </div>
                </div>
            </header>

            <SellerOrdersClient orders={orders} />
        </div>
    )
}
