'use client'

import { updateOrderStatus } from '@/actions/orders'
import { OrderStatus } from '@/types'

export default function StatusSelect({ orderId, initialStatus }: { orderId: string, initialStatus: OrderStatus }) {
    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as OrderStatus
        try {
            await updateOrderStatus(orderId, newStatus)
        } catch (err) {
            console.error(err)
            alert('Failed to update status.')
        }
    }

    return (
        <select
            defaultValue={initialStatus}
            className="font-mono text-[0.65rem] font-bold uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer text-blue-400 hover:text-white transition-colors duration-300"
            style={{ appearance: 'none' }}
            onChange={handleChange}
        >
            <option value="PLACED" className="bg-[#0C0A09]">PLACED</option>
            <option value="SHIPPED" className="bg-[#0C0A09]">SHIPPED</option>
            <option value="DELIVERED" className="bg-[#0C0A09]">DELIVERED</option>
            <option value="CANCELLED" className="bg-[#0C0A09]">CANCELLED</option>
        </select>
    )
}
