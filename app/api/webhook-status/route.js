import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Verificar variables de entorno críticas
        const envCheck = {
            STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
            NEXT_PUBLIC_CONVEX_URL: !!process.env.NEXT_PUBLIC_CONVEX_URL,
        };

        console.log('🔍 Diagnóstico del sistema:', {
            env: envCheck,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            status: 'OK',
            message: 'Sistema de webhook revisado y listo',
            environment: envCheck,
            webhookEndpoint: '/api/webhook-v2',
            features: [
                '✅ Búsqueda de usuario por stripeCustomerId',
                '✅ Fallback a búsqueda por email',
                '✅ Vinculación automática de customer ID',
                '✅ Actualización robusta de subscriptionId',
                '✅ Manejo de errores sin fallar webhook',
                '✅ Logs detallados para depuración'
            ],
            nextSteps: [
                '1. Detener stripe CLI actual',
                '2. Ejecutar: stripe listen --forward-to localhost:3000/api/webhook-v2',
                '3. Hacer compra de prueba',
                '4. Verificar subscriptionId en base de datos'
            ]
        });

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return NextResponse.json({
            status: 'ERROR',
            error: error.message
        }, { status: 500 });
    }
}
