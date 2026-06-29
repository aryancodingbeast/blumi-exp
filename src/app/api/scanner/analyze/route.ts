import { NextRequest, NextResponse } from 'next/server'
import { analyzeWithGemini } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { images } = body as { images: string[] }

        if (!images || images.length === 0) {
            return NextResponse.json(
                { error: 'At least one image is required' },
                { status: 400 }
            )
        }

        if (images.length > 4) {
            return NextResponse.json(
                { error: 'Maximum 4 images allowed' },
                { status: 400 }
            )
        }

        const analysis = await analyzeWithGemini(images)

        if (!analysis.isClothing) {
            return NextResponse.json(
                {
                    error: 'Not a clothing item',
                    analysis: {
                        isClothing: false,
                        photoQuality: 'rejected',
                        qualityFeedback: 'The uploaded image does not appear to be a clothing item. Please upload a photo of a garment.',
                    },
                },
                { status: 422 }
            )
        }

        if (analysis.photoQuality === 'rejected') {
            return NextResponse.json(
                {
                    error: 'Photo quality too low',
                    analysis: {
                        isClothing: true,
                        photoQuality: 'rejected',
                        qualityFeedback: analysis.qualityFeedback,
                    },
                },
                { status: 422 }
            )
        }

        return NextResponse.json({ analysis })
    } catch (error: any) {
        console.error('Scanner analyze error:', error)
        return NextResponse.json(
            { error: error.message || 'Analysis failed' },
            { status: 500 }
        )
    }
}
