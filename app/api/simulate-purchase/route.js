import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email es requerido'
            }, { status: 400 });
        }

        console.log('🧪 Simulando compra exitosa para:', email);

        // Simular datos de Stripe
        const fakeSubscriptionId = 'sub_1Rfg7iK1jLfWhQ4Kc1nQx1vp';
        const fakeCustomerId = 'cus_test123456789';

        // Buscar usuario por email
        const users = await convex.query(api.users.getUserByEmail, { email });

        if (!users || users.length === 0) {
            return NextResponse.json({
                success: false,
                error: `No se encontró usuario con email: ${email}`
            }, { status: 404 });
        }

        const user = users[0];
        console.log('👤 Usuario encontrado:', {
            userId: user._id,
            email: user.email,
            subscriptionIdAnterior: user.subscriptionId || 'unset'
        });

        // Vincular stripeCustomerId
        await convex.mutation(api.users.updateUserStripeInfo, {
            userId: user._id,
            stripeCustomerId: fakeCustomerId
        });

        console.log('🔗 stripeCustomerId vinculado');

        // Actualizar suscripción
        const result = await convex.mutation(api.users.updateUserSubscription, {
            subscriptionId: fakeSubscriptionId,
            stripeCustomerId: fakeCustomerId
        });

        console.log('✅ Simulación de compra completada:', {
            userId: result._id,
            email: result.email,
            subscriptionId: result.subscriptionId,
            credits: result.credits,
            isMember: result.isMember
        });

        return NextResponse.json({
            success: true,
            message: 'Compra simulada exitosamente',
            user: {
                id: result._id,
                email: result.email,
                subscriptionId: result.subscriptionId,
                stripeCustomerId: result.stripeCustomerId,
                credits: result.credits,
                isMember: result.isMember
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en simulación:', {
            error: error.message,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: 'Error en simulación',
            message: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Endpoint de simulación de compra',
        usage: 'POST con { email: "user@example.com" }',
        description: 'Simula una compra exitosa para probar la integración'
    });
}
