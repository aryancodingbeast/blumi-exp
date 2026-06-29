import { NextRequest, NextResponse } from 'next/server'
import { validateStepPhoto } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { image, stepId } = body as { image: string; stepId: string }

        if (!image) {
            return NextResponse.json(
                { error: 'Image is required' },
                { status: 400 }
            )
        }

        if (!stepId || !['front', 'back', 'label', 'detail'].includes(stepId)) {
            return NextResponse.json(
                { error: 'Valid stepId is required (front, back, label, detail)' },
                { status: 400 }
            )
        }

        const result = await validateStepPhoto(stepId, image)

        return NextResponse.json({
            valid: result.isValid,
            isClothing: result.isClothing,
            viewType: result.viewType,
            feedback: result.feedback,
            confidence: result.confidence,
        })
    } catch (error: any) {
        console.error('Step validation error:', error)
        return NextResponse.json(
            { error: error.message || 'Validation failed' },
            { status: 500 }
        )
    }
}
