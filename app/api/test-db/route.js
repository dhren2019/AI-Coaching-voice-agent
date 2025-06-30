import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
    try {
        console.log('🔍 Intentando obtener usuarios...');
        
        // Obtener todos los usuarios para ver el estado actual
        const users = await convex.query(api.users.getAllUsers);
        
        console.log('👥 Usuarios encontrados:', users?.length || 0);

        return NextResponse.json({
            message: 'Diagnóstico de base de datos',
            totalUsers: users?.length || 0,
            users: users?.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                subscriptionId: user.subscriptionId || 'unset',
                stripeCustomerId: user.stripeCustomerId || 'unset',
                isMember: user.isMember || false
            })) || []
        });

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        return NextResponse.json({
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { action, userEmail, subscriptionId, stripeCustomerId } = await req.json();

        if (action === 'update_subscription' && userEmail && subscriptionId && stripeCustomerId) {
            console.log('🧪 Test de actualización manual:', {
                userEmail,
                subscriptionId,
                stripeCustomerId
            });

            // Simular el flujo del webhook
            const result = await convex.mutation(api.users.updateUserSubscription, {
                subscriptionId,
                stripeCustomerId
            });

            return NextResponse.json({
                success: true,
                message: 'Usuario actualizado manualmente',
                result
            });
        }

        return NextResponse.json({
            error: 'Parámetros inválidos',
            usage: {
                action: 'update_subscription',
                required: ['userEmail', 'subscriptionId', 'stripeCustomerId']
            }
        }, { status: 400 });

    } catch (error) {
        console.error('❌ Error en test manual:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
