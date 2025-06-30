import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});

export async function POST(req) {
    try {
        const { priceId } = await req.json();

        console.log('🛍️ Iniciando checkout:', {
            priceId,
            timestamp: new Date().toISOString()
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId || process.env.STRIPE_PRICE_ID_MONTHLY,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.HOST_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.HOST_URL}/payment/cancel`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            customer_email: req.headers.get('x-customer-email'),
            metadata: {
                source: 'AI-Coaching-voice-agent'
            }
        });

        console.log('✅ Sesión de checkout creada:', {
            sessionId: session.id,
            url: session.url,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('❌ Error creando sesión de checkout:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            { error: 'Error creando sesión de checkout' },
            { status: 500 }
        );
    }
} 