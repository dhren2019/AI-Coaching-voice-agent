import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});

export async function POST(req) {
    try {
        const { customerId } = await req.json();

        console.log('🔧 Iniciando portal de gestión:', {
            customerId,
            timestamp: new Date().toISOString()
        });

        if (!customerId) {
            throw new Error('Se requiere el ID del cliente');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.HOST_URL}/dashboard`,
        });

        console.log('✅ Sesión del portal creada:', {
            sessionId: session.id,
            url: session.url,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('❌ Error creando sesión del portal:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            { error: 'Error creando sesión del portal' },
            { status: 500 }
        );
    }
} 