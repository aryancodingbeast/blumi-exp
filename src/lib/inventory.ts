export interface ThriftItem {
    id: string
    title: string
    description: string
    brand: string
    size: string
    category: string
    condition: string
    price: number
    image: string
    vibe: string
    stylingNotes: string
    tags: string[]
}

export const VINTAGE_INVENTORY: ThriftItem[] = [
    {
        id: 'blumi-001',
        title: 'Reconstructed Lace-Up Satin Corset',
        description: 'One-of-one vintage corset reconstructed with black satin paneling, steel boning, and delicate cream lace trim.',
        brand: 'Blumi Vintage',
        size: 'S',
        category: 'Tops',
        condition: 'Excellent Vintage',
        price: 2499,
        image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=80',
        vibe: 'edgy/romantic',
        stylingNotes: 'Pair with low-rise bootcut denim, a silver chain choker, and black pointed boots. Absolutely striking.',
        tags: ['corset', 'lace', 'black', 'satin', 'date']
    },
    {
        id: 'blumi-002',
        title: '90s Oversized Leather Bomber Jacket',
        description: 'Ultra-soft hand-sourced distressed brown leather bomber jacket with original metal zippers and heavy ribbed cuffs.',
        brand: 'Harley Davidson Vintage',
        size: 'L',
        category: 'Jackets',
        condition: 'Gently Worn (Perfect Patina)',
        price: 4800,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
        vibe: 'bold/grunge',
        stylingNotes: 'Throw over a simple white baby tee, baggy cargo pants, and retro sneakers. Effortless streetwear vibe.',
        tags: ['leather', 'bomber', 'jacket', 'brown', 'oversized']
    },
    {
        id: 'blumi-003',
        title: 'Structured Sand Wool Blazer',
        description: 'Single-breasted wool blazer in a warm sand tone. Features padded shoulders, marbled brown buttons, and satin lining.',
        brand: 'Ralph Lauren Vintage',
        size: 'M',
        category: 'Jackets',
        condition: 'Mint Condition',
        price: 3200,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80',
        vibe: 'soft/editorial',
        stylingNotes: 'Style open over a knit halter-neck top, structured cream trousers, and chunky gold hoops.',
        tags: ['blazer', 'wool', 'sand', 'beige', 'classic']
    },
    {
        id: 'blumi-004',
        title: 'Low-Rise Indigo Cargo Denim Skirt',
        description: 'Rare early 2000s wash denim skirt with utility side-pockets, raw hem detailing, and contrast amber stitching.',
        brand: 'Diesel Vintage',
        size: 'S',
        category: 'Skirts',
        condition: 'Very Good',
        price: 2900,
        image: 'https://images.unsplash.com/photo-1582142306909-195724d33ab9?w=500&auto=format&fit=crop&q=80',
        vibe: 'y2k/edgy',
        stylingNotes: 'Wear with a fitted baby tee, knee-high boots, and small tinted futuristic sunglasses.',
        tags: ['denim', 'skirt', 'cargo', 'indigo', 'y2k']
    },
    {
        id: 'blumi-005',
        title: 'Sheer Abstract Mesh Knit Top',
        description: 'Psychedelic printed long-sleeve mesh top with lettuce-edge hems. Lightweight and semi-sheer fabric.',
        brand: 'Jean Paul Gaultier Vintage',
        size: 'M',
        category: 'Tops',
        condition: 'Near New',
        price: 5500,
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80',
        vibe: 'avant-garde',
        stylingNotes: 'Layer over a solid black bralette, and style with baggy black leather pants and high platforms.',
        tags: ['mesh', 'sheer', 'print', 'longsleeve', 'party']
    }
]
