import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { logger } from '@/utils/logger';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

// Este es el secreto del webhook para pruebas locales
const endpointSecret = "whsec_7e147982abb76b57cd748decc3807ab439e9ea4ff2b53cf01d796069e7a6fe13";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

export async function POST(req) {
    if (!endpointSecret) {
        await logger.error('Webhook secret not configured');
        return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    const reqBuffer = await req.arrayBuffer();

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            Buffer.from(reqBuffer),
            sig,
            endpointSecret
        );
    } catch (err) {
        await logger.error('Webhook signature verification failed', { error: err.message });
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    await logger.info('Evento recibido', { type: event.type });

    try {
        // Manejar el evento
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await logger.info('Checkout session completed', { session });

                if (session.payment_status === 'paid' && session.subscription) {
                    const subscriptionId = session.subscription;
                    const customerEmail = session.customer_email || session.metadata?.customerEmail;

                    await logger.debug('Datos de suscripción', { 
                        subscriptionId, 
                        customerEmail,
                        sessionId: session.id 
                    });

                    if (!customerEmail) {
                        throw new Error('No se encontró el email del cliente en la sesión');
                    }

                    // Buscar usuario
                    const users = await convex.query(api.users.getUserByEmail, { email: customerEmail });
                    
                    if (!users || users.length === 0) {
                        throw new Error(`No se encontró usuario con email ${customerEmail}`);
                    }

                    await logger.info('Usuario encontrado, actualizando suscripción', { 
                        userId: users[0]._id,
                        email: customerEmail 
                    });

                    // Actualizar suscripción
                    await convex.mutation(api.users.updateUserSubscription, {
                        email: customerEmail,
                        subscriptionId: subscriptionId
                    });

                    await logger.info('Suscripción actualizada exitosamente', {
                        email: customerEmail,
                        subscriptionId
                    });
                } else {
                    await logger.warning('Sesión de checkout incompleta', {
                        sessionId: session.id,
                        paymentStatus: session.payment_status,
                        subscription: session.subscription
                    });
                }
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                const customer = await stripe.customers.retrieve(subscription.customer);
                
                await logger.info('Procesando cancelación de suscripción', {
                    subscriptionId: subscription.id,
                    customerEmail: customer.email
                });

                await convex.mutation(api.users.removeSubscription, {
                    email: customer.email
                });

                await logger.info('Suscripción cancelada exitosamente', {
                    customerEmail: customer.email
                });
                break;

            default:
                await logger.info('Evento no manejado', { type: event.type });
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        await logger.error('Error procesando webhook', { 
            error: error.message,
            eventType: event.type
        });
        
        return NextResponse.json({ 
            received: true,
            error: error.message 
        });
    }
} 