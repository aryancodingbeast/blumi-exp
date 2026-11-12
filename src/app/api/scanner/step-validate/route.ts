import { NextRequest, NextResponse } from 'next/server'
import { validateStepPhoto } from '@/lib/gemini'

const VALID_STEPS = ['front', 'back', 'left_side', 'right_side', 'logo', 'label', 'detail']

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { image, stepId } = body as { image: string; stepId: string }

        if (!image || !image.startsWith('data:image/')) {
            return NextResponse.json(
                {
                    valid: false,
                    isClothing: false,
                    feedback: 'Live camera frame is required for AI verification.',
                },
                { status: 400 }
            )
        }

        const normalizedStep = VALID_STEPS.includes(stepId) ? stepId : 'front'
        const result = await validateStepPhoto(normalizedStep, image)

        return NextResponse.json({
            valid: result.isValid,
            isClothing: result.isClothing,
            viewType: result.viewType,
            detectedItem: result.detectedItem,
            framingScore: result.framingScore,
            lightingStatus: result.lightingStatus,
            distanceHint: result.distanceHint,
            feedback: result.feedback,
            confidence: result.confidence,
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Validation failed'
        return NextResponse.json(
            {
                valid: false,
                isClothing: false,
                feedback: `AI camera check error: ${message}`,
                error: message,
            },
            { status: 500 }
        )
    }
}
