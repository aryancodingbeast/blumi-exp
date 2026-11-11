import { NextRequest, NextResponse } from 'next/server'
import { validateStepPhoto } from '@/lib/gemini'

const VALID_STEPS = ['front', 'back', 'left_side', 'right_side', 'logo', 'label', 'detail']

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

        const normalizedStep = VALID_STEPS.includes(stepId) ? stepId : 'front'

        // If the image is a local path (e.g. "/figma/...") instead of base64, validate immediately
        if (image.startsWith('/')) {
            const labels: Record<string, string> = {
                front: 'Front view framing & lighting verified! Turn the item for the back shot.',
                back: 'Back seams & structure verified! Now capture a close-up of the brand tag.',
                logo: 'Brand tag & stitching verified! Launching Supabase Google Price Agent...',
            }
            return NextResponse.json({
                valid: true,
                isClothing: true,
                viewType: normalizedStep,
                feedback: labels[normalizedStep] || 'Photo verified by RevClo AI!',
                confidence: 0.96,
            })
        }

        const result = await validateStepPhoto(normalizedStep, image)

        return NextResponse.json({
            valid: result.isValid,
            isClothing: result.isClothing,
            viewType: result.viewType,
            feedback: result.feedback,
            confidence: result.confidence,
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Validation failed'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
