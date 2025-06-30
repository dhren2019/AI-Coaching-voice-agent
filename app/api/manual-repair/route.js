import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { email, subscriptionId, stripeCustomerId } = await req.json();

        console.log('🔧 Iniciando reparación manual de usuario:', {
            email,
            subscriptionId,
            stripeCustomerId,
            timestamp: new Date().toISOString()
        });

        // Validar parámetros
        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email es requerido'
            }, { status: 400 });
        }

        if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
            return NextResponse.json({
                success: false,
                error: 'subscriptionId válido es requerido (debe empezar con sub_)'
            }, { status: 400 });
        }

        if (!stripeCustomerId || !stripeCustomerId.startsWith('cus_')) {
            return NextResponse.json({
                success: false,
                error: 'stripeCustomerId válido es requerido (debe empezar con cus_)'
            }, { status: 400 });
        }

        // Buscar usuario por email
        console.log('🔍 Buscando usuario por email:', email);
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
            creditsActuales: user.credits,
            subscriptionIdActual: user.subscriptionId || 'unset',
            stripeCustomerIdActual: user.stripeCustomerId || 'unset'
        });

        // Actualizar stripeCustomerId primero
        console.log('🔗 Vinculando stripeCustomerId:', stripeCustomerId);
        await convex.mutation(api.users.updateUserStripeInfo, {
            userId: user._id,
            stripeCustomerId
        });

        // Luego actualizar la suscripción
        console.log('💳 Actualizando suscripción:', subscriptionId);
        const result = await convex.mutation(api.users.updateUserSubscription, {
            subscriptionId,
            stripeCustomerId
        });

        console.log('✅ Usuario reparado exitosamente:', {
            userId: result._id,
            email: result.email,
            subscriptionIdNuevo: result.subscriptionId,
            stripeCustomerIdNuevo: result.stripeCustomerId,
            credits: result.credits,
            isMember: result.isMember
        });

        return NextResponse.json({
            success: true,
            message: 'Usuario reparado exitosamente',
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
        console.error('❌ Error en reparación manual:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Endpoint para reparación manual de usuarios',
        usage: 'POST con { email, subscriptionId, stripeCustomerId }',
        example: {
            email: 'user@example.com',
            subscriptionId: 'sub_1Rfg7iK1jLfWhQ4Kc1nQx1vp',
            stripeCustomerId: 'cus_xxxxxxxxx'
        }
    });
}
