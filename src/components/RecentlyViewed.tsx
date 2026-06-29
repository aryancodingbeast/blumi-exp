'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import ProductCard from './ProductCard'

export default function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
    const [recent, setRecent] = useState<Product[]>([])

    useEffect(() => {
        // Fetch product data for IDs in localStorage
        const fetchRecent = async () => {
            const saved = localStorage.getItem('revclo-recently-viewed')
            if (!saved) return
            
            const ids = JSON.parse(saved) as string[]
            // We'll just show the last 4 and filter out current
            const otherIds = ids.filter(id => id !== currentProductId).slice(0, 4)
            
            if (otherIds.length === 0) return

            // Note: In a real app, we'd fetch these specifically, 
            // but for now we'll assume the IDs might be enough or we skip if no bulk fetch action
        }
        
        // Add current to history
        const saved = localStorage.getItem('revclo-recently-viewed')
        const ids = saved ? (JSON.parse(saved) as string[]) : []
        const newIds = [currentProductId, ...ids.filter(id => id !== currentProductId)].slice(0, 10)
        localStorage.setItem('revclo-recently-viewed', JSON.stringify(newIds))
        
        fetchRecent()
    }, [currentProductId])

    return null // Hidden for now as we don't have a bulk fetch action ready
}
