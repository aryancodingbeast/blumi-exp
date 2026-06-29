import { NextRequest, NextResponse } from 'next/server'

// In-memory store for temp images (auto-expires after 5 minutes)
const imageStore: Record<string, { data: Uint8Array; mime: string; expires: number }> = {}

// Cleanup expired images
function cleanup() {
    const now = Date.now()
    for (const key of Object.keys(imageStore)) {
        if (now > imageStore[key].expires) delete imageStore[key]
    }
}

// POST: Store a base64 image and return a public URL
export async function POST(request: NextRequest) {
    try {
        cleanup()
        const { image } = await request.json()
        if (!image) return NextResponse.json({ error: 'image required' }, { status: 400 })

        const match = image.match(/^data:image\/(\w+);base64,(.+)$/)
        if (!match) return NextResponse.json({ error: 'invalid base64 image' }, { status: 400 })

        const mime = `image/${match[1]}`
        const raw = atob(match[2])
        const bytes = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

        const id = crypto.randomUUID()
        imageStore[id] = { data: bytes, mime, expires: Date.now() + 5 * 60 * 1000 }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const url = `${baseUrl}/api/scanner/temp-image?id=${id}`

        return NextResponse.json({ url, id })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// GET: Serve the image by ID
export async function GET(request: NextRequest) {
    cleanup()
    const id = request.nextUrl.searchParams.get('id')
    if (!id) return new NextResponse('Missing id', { status: 400 })

    const entry = imageStore[id]
    if (!entry) return new NextResponse('Image expired or not found', { status: 404 })

    return new NextResponse(entry.data as unknown as BodyInit, {
        headers: {
            'Content-Type': entry.mime,
            'Content-Length': String(entry.data.byteLength),
            'Cache-Control': 'no-store, max-age=300',
        },
    })
}
