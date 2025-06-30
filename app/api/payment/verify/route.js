import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { sessionId } = await req.json();
        const customerEmail = req.headers.get('x-customer-email');

        console.log('🔍 Verificando sesión de pago:', {
            sessionId,
            customerEmail,
            timestamp: new Date().toISOString()
        });

        if (!sessionId) {
            throw new Error('Se requiere session_id');
        }

        // Obtener detalles de la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log('📦 Detalles de la sesión:', {
            status: session.payment_status,
            customerId: session.customer,
            timestamp: new Date().toISOString()
        });

        if (session.payment_status === 'paid') {
            // Buscar usuario por email
            const users = await convex.query(api.users.getUserByEmail, { 
                email: customerEmail 
            });

            if (!users || users.length === 0) {
                throw new Error('Usuario no encontrado');
            }

            const userId = users[0]._id;

            // Actualizar usuario con información de Stripe
            await convex.mutation(api.users.updateUserStripeInfo, {
                userId,
                stripeCustomerId: session.customer,
                subscriptionId: session.subscription
            });

            console.log('✅ Usuario actualizado con información de Stripe:', {
                userId,
                stripeCustomerId: session.customer,
                subscriptionId: session.subscription,
                timestamp: new Date().toISOString()
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ 
            success: false,
            message: 'Pago pendiente o fallido'
        });

    } catch (error) {
        console.error('❌ Error verificando pago:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            { 
                success: false,
                error: error.message 
            },
            { status: 500 }
        );
    }
} 