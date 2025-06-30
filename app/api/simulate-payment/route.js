import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { userId } = await req.json();
        
        console.log('🎭 Simulador de pago exitoso iniciado:', {
            userId,
            timestamp: new Date().toISOString()
        });

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'userId es requerido'
            }, { status: 400 });
        }

        // Simular datos de suscripción exitosa
        const mockSubscriptionArgs = {
            userId,
            subscriptionId: `sub_mock_${Date.now()}`,
            stripeCustomerId: `cus_mock_${Date.now()}`,
            planType: 'monthly',
            credits: 50000, // Plan PRO
            status: 'active',
            paymentStatus: 'paid',
            priceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_mock',
            currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
        };

        console.log('💳 Simulando datos de suscripción:', mockSubscriptionArgs);

        // Llamar a la función saveSubscription en Convex
        const result = await convex.mutation(api.subscriptions.saveSubscription, mockSubscriptionArgs);

        console.log('✅ Suscripción simulada guardada:', result);

        // Verificar el estado del usuario después de la actualización
        const user = await convex.query(api.users.getUserById, { userId });
        
        console.log('👤 Estado del usuario después de la simulación:', {
            userId: user._id,
            subscriptionId: user.subscriptionId,
            credits: user.credits,
            isMember: user.isMember
        });

        return NextResponse.json({
            success: true,
            message: 'Pago simulado exitosamente para desarrollo local',
            data: {
                subscriptionId: mockSubscriptionArgs.subscriptionId,
                userUpdated: true,
                userState: {
                    subscriptionId: user.subscriptionId,
                    credits: user.credits,
                    isMember: user.isMember
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en el simulador de pago:', error);
        return NextResponse.json({
            success: false,
            error: `Error en simulación: ${error.message}`
        }, { status: 500 });
    }
}
