import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log('🎉 Webhook recibido:', {
            type: event.type,
            id: event.id,
            timestamp: new Date().toISOString()
        });

        // Solo manejar checkout completado para simplificar
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            console.log('💳 Checkout completado:', {
                sessionId: session.id,
                customerId: session.customer,
                subscriptionId: session.subscription,
                mode: session.mode,
                email: session.customer_details?.email
            });

            // Solo procesar suscripciones
            if (session.mode === 'subscription' && session.subscription) {
                try {
                    console.log('🔄 Actualizando usuario con:', {
                        subscriptionId: session.subscription,
                        stripeCustomerId: session.customer
                    });

                    const result = await convex.mutation(api.users.updateUserSubscription, {
                        subscriptionId: session.subscription,
                        stripeCustomerId: session.customer
                    });

                    console.log('✅ Usuario actualizado exitosamente:', result);

                } catch (updateError) {
                    console.error('❌ Error actualizando usuario:', {
                        error: updateError.message,
                        subscriptionId: session.subscription,
                        stripeCustomerId: session.customer
                    });
                    
                    // No fallar el webhook por esto
                    // return NextResponse.json({ error: 'Error interno' }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (err) {
        console.error('❌ Error en webhook:', {
            error: err.message,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }
}
