import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        console.log('🧪 Iniciando test manual de webhook...');
        
        // Usar datos de ejemplo que simulan un webhook real de Stripe
        const testData = {
            subscriptionId: "sub_1Rfey3K1jLfWhQ4KwAah57hR", // Del log de Stripe
            stripeCustomerId: "cus_123456789" // Un customer ID de ejemplo
        };

        console.log('📋 Datos de test:', testData);

        // Intentar actualizar el usuario
        const result = await convex.mutation(api.users.updateUserSubscription, testData);

        console.log('✅ Resultado:', result);

        return NextResponse.json({
            success: true,
            message: 'Test de webhook completado',
            testData,
            result
        });

    } catch (error) {
        console.error('❌ Error en test de webhook:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
