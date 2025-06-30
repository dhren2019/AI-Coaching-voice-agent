import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { subscriptionId, stripeCustomerId } = await req.json();

        if (!subscriptionId || !stripeCustomerId) {
            return NextResponse.json({
                error: 'subscriptionId y stripeCustomerId son requeridos'
            }, { status: 400 });
        }

        console.log('🧪 Test de actualización de suscripción:', {
            subscriptionId,
            stripeCustomerId,
            timestamp: new Date().toISOString()
        });

        // Verificar que el usuario existe con el stripeCustomerId
        const result = await convex.mutation(api.users.updateUserSubscription, {
            subscriptionId,
            stripeCustomerId
        });

        console.log('✅ Test exitoso:', result);

        return NextResponse.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: result
        });

    } catch (error) {
        console.error('❌ Error en test de webhook:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Test endpoint para verificar webhook de suscripción',
        usage: 'POST con { subscriptionId, stripeCustomerId }'
    });
}
