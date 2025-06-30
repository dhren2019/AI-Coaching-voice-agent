import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_async function updateUserWithSubscription({ subscriptionId, stripeCustomerId, customerEmail, sessionId }) {
    console.log('🔄 Iniciando actualización de usuario con múltiples estrategias (V2)...', {
        subscriptionId,
        stripeCustomerId,
        customerEmail,
        sessionId,
        timestamp: new Date().toISOString()
    });

    // Log específico para el subscriptionId que vamos a guardar
    console.log('🎯 CRÍTICO (V2) - subscriptionId a procesar:', {
        raw: subscriptionId,
        type: typeof subscriptionId,
        length: subscriptionId?.length,
        startsWith_sub: subscriptionId?.startsWith('sub_'),
        json: JSON.stringify(subscriptionId),
        timestamp: new Date().toISOString()
    });
    
    try {
        // Estrategia 1: Buscar por stripeCustomerId
        console.log('🔍 Estrategia 1 (V2): Buscando por stripeCustomerId:', stripeCustomerId);_URL);

const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
]);

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

        // Log específico para capturar subscription en todos los eventos
        if (event.data.object) {
            const obj = event.data.object;
            console.log('📦 Objeto del evento V2:', {
                type: event.type,
                objectType: obj.object,
                subscriptionId: obj.subscription || obj.id?.startsWith('sub_') ? obj.id : null,
                customerId: obj.customer || obj.customer_id || null,
                email: obj.customer_details?.email || obj.email || null,
                mode: obj.mode || null,
                status: obj.status || null,
                timestamp: new Date().toISOString()
            });

            // Log específico para subscription en checkout session
            if (event.type === 'checkout.session.completed' && obj.subscription) {
                console.log('🎯 SUBSCRIPTION CAPTURADO en checkout.session.completed (V2):', {
                    subscriptionId: obj.subscription,
                    sessionId: obj.id,
                    customerId: obj.customer,
                    email: obj.customer_details?.email,
                    timestamp: new Date().toISOString()
                });
                
                // Log adicional para confirmar el valor exacto
                console.log('🔍 VALOR EXACTO del subscriptionId (V2):', {
                    raw: obj.subscription,
                    type: typeof obj.subscription,
                    length: obj.subscription?.length,
                    startsWith_sub: obj.subscription?.startsWith('sub_'),
                    json: JSON.stringify(obj.subscription),
                    timestamp: new Date().toISOString()
                });
            }

            // Log para eventos de subscription directos
            if (obj.object === 'subscription') {
                console.log('🎯 SUBSCRIPTION DIRECTO capturado (V2):', {
                    subscriptionId: obj.id,
                    customerId: obj.customer,
                    status: obj.status,
                    eventType: event.type,
                    timestamp: new Date().toISOString()
                });
                
                // Log adicional para subscription directo
                console.log('🔍 VALOR EXACTO del subscription directo (V2):', {
                    raw: obj.id,
                    type: typeof obj.id,
                    length: obj.id?.length,
                    startsWith_sub: obj.id?.startsWith('sub_'),
                    json: JSON.stringify(obj.id),
                    timestamp: new Date().toISOString()
                });
            }
        }

        if (relevantEvents.has(event.type)) {
            try {
                switch (event.type) {
                    case 'checkout.session.completed':
                        await handleCheckoutCompleted(event.data.object);
                        break;

                    case 'customer.subscription.created':
                    case 'customer.subscription.updated':
                        await handleSubscriptionChange(event.data.object);
                        break;

                    case 'customer.subscription.deleted':
                        await handleSubscriptionDeleted(event.data.object);
                        break;

                    default:
                        console.warn(`🤔 Evento no manejado: ${event.type}`);
                }
            } catch (error) {
                console.error('❌ Error procesando webhook:', {
                    type: event.type,
                    eventId: event.id,
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
                
                // NO fallar el webhook por errores internos - Stripe seguirá reintentando
                console.warn('⚠️ Webhook marcado como exitoso para evitar reintentos de Stripe');
            }
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('❌ Error verificando webhook signature:', {
            error: err.message,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }
}

async function handleCheckoutCompleted(session) {
    console.log('💳 Procesando checkout.session.completed (V2):', {
        sessionId: session.id,
        customerId: session.customer,
        email: session.customer_details?.email,
        subscriptionId: session.subscription,
        mode: session.mode,
        paymentStatus: session.payment_status
    });

    // Log específico para el subscription ID
    console.log('🎯 CRITICAL (V2): Verificando subscriptionId en checkout:', {
        'session.subscription': session.subscription,
        'tipo': typeof session.subscription,
        'esString': typeof session.subscription === 'string',
        'empiezaConSub': session.subscription?.startsWith?.('sub_'),
        'longitud': session.subscription?.length,
        'sessionId': session.id,
        timestamp: new Date().toISOString()
    });

    try {
        // Solo procesar suscripciones completadas exitosamente
        if (session.mode === 'subscription' && session.subscription && session.payment_status === 'paid') {
            
            console.log('✅ Condiciones cumplidas (V2), procesando suscripción:', {
                mode: session.mode,
                hasSubscription: !!session.subscription,
                subscriptionValue: session.subscription,
                paymentStatus: session.payment_status,
                timestamp: new Date().toISOString()
            });

            // Obtener detalles completos de Stripe
            console.log('📞 Consultando Stripe para subscription (V2):', session.subscription);
            const [subscription, customer] = await Promise.all([
                stripe.subscriptions.retrieve(session.subscription),
                stripe.customers.retrieve(session.customer)
            ]);
            
            console.log('📋 Detalles de Stripe obtenidos (V2):', {
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                customerId: customer.id,
                customerEmail: customer.email,
                timestamp: new Date().toISOString()
            });

            // VERIFICACIÓN CRÍTICA: Confirmar que tenemos el subscription ID
            if (!subscription.id || !subscription.id.startsWith('sub_')) {
                console.error('🚨 CRÍTICO (V2): subscription.id no es válido:', {
                    subscriptionId: subscription.id,
                    subscriptionObject: subscription,
                    timestamp: new Date().toISOString()
                });
                throw new Error('Subscription ID no válido');
            }

            console.log('✅ SUBSCRIPTION ID CONFIRMADO (V2):', {
                subscriptionId: subscription.id,
                empiezaConSub: subscription.id.startsWith('sub_'),
                longitud: subscription.id.length,
                timestamp: new Date().toISOString()
            });
            
            // Intentar actualizar usuario - con múltiples estrategias de búsqueda
            const updateResult = await updateUserWithSubscription({
                subscriptionId: subscription.id,
                stripeCustomerId: customer.id,
                customerEmail: customer.email,
                sessionId: session.id
            });

            if (updateResult.success) {
                console.log('✅ Usuario actualizado exitosamente (V2):', updateResult.user);
                
                // Guardar registro de pago solo si el usuario se actualizó correctamente
                await savePaymentRecord({
                    sessionId: session.id,
                    stripeCustomerId: customer.id,
                    subscriptionId: subscription.id,
                    amount: session.amount_total || 0,
                    status: session.payment_status,
                    metadata: session.metadata || {}
                });
                
            } else {
                console.error('❌ No se pudo actualizar el usuario (V2):', updateResult.error);
            }
        } else {
            console.log('ℹ️ Sesión ignorada (V2):', {
                mode: session.mode,
                hasSubscription: !!session.subscription,
                paymentStatus: session.payment_status,
                reason: 'No es una suscripción completada exitosamente'
            });
        }

    } catch (error) {
        console.error('❌ Error en handleCheckoutCompleted (V2):', {
            error: error.message,
            stack: error.stack,
            sessionId: session.id
        });
        throw error;
    }
}

// Método GET para verificar que el endpoint funciona
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook V2 endpoint is working',
        version: 'v2',
        timestamp: new Date().toISOString()
    });
}

async function updateUserWithSubscription({ subscriptionId, stripeCustomerId, customerEmail, sessionId }) {
    console.log('� Iniciando actualización de usuario con múltiples estrategias...');
    
    try {
        // Estrategia 1: Buscar por stripeCustomerId
        console.log('🔍 Estrategia 1: Buscando por stripeCustomerId:', stripeCustomerId);
        
        try {
            const result = await convex.mutation(api.users.updateUserSubscription, {
                subscriptionId,
                stripeCustomerId
            });
            
            console.log('✅ Estrategia 1 exitosa - Usuario encontrado por stripeCustomerId');
            return { success: true, user: result, strategy: 'stripeCustomerId' };
            
        } catch (error) {
            console.warn('⚠️ Estrategia 1 falló:', error.message);
        }

        // Estrategia 2: Buscar por email y actualizar stripeCustomerId
        if (customerEmail) {
            console.log('🔍 Estrategia 2: Buscando por email:', customerEmail);
            
            try {
                const users = await convex.query(api.users.getUserByEmail, { email: customerEmail });
                
                if (users && users.length > 0) {
                    const user = users[0];
                    console.log('👤 Usuario encontrado por email:', {
                        userId: user._id,
                        email: user.email,
                        creditsActuales: user.credits
                    });
                    
                    // Actualizar con stripeCustomerId y subscriptionId
                    await convex.mutation(api.users.updateUserStripeInfo, {
                        userId: user._id,
                        stripeCustomerId
                    });
                    
                    // Luego actualizar la suscripción
                    const result = await convex.mutation(api.users.updateUserSubscription, {
                        subscriptionId,
                        stripeCustomerId
                    });
                    
                    console.log('✅ Estrategia 2 exitosa - Usuario vinculado y actualizado');
                    return { success: true, user: result, strategy: 'email_link' };
                    
                } else {
                    console.warn('⚠️ Estrategia 2 falló: No se encontró usuario con email:', customerEmail);
                }
                
            } catch (error) {
                console.warn('⚠️ Estrategia 2 falló:', error.message);
            }
        }

        // Si todas las estrategias fallan
        console.error('❌ Todas las estrategias fallaron. Usuario no encontrado:', {
            stripeCustomerId,
            customerEmail,
            subscriptionId,
            sessionId
        });
        
        return { 
            success: false, 
            error: `No se encontró usuario para stripeCustomerId: ${stripeCustomerId} o email: ${customerEmail}` 
        };

    } catch (error) {
        console.error('❌ Error en updateUserWithSubscription:', error);
        return { success: false, error: error.message };
    }
}

async function savePaymentRecord({ sessionId, stripeCustomerId, subscriptionId, amount, status, metadata }) {
    try {
        console.log('💾 Guardando registro de pago:', {
            sessionId,
            stripeCustomerId,
            subscriptionId,
            amount,
            status
        });

        await convex.mutation(api.subscriptions.savePaymentRecord, {
            sessionId,
            stripeCustomerId,
            subscriptionId, // Ahora incluido
            amount,
            status,
            metadata
        });

        console.log('✅ Registro de pago guardado exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error guardando registro de pago:', {
            error: error.message,
            sessionId,
            stripeCustomerId
        });
        return false;
    }
}

async function handleSubscriptionChange(subscription) {
    console.log('📝 Procesando subscription change:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: subscription.customer
    });

    try {
        // Solo actualizar si la suscripción está activa
        if (subscription.status === 'active') {
            const result = await convex.mutation(api.users.updateUserSubscription, {
                subscriptionId: subscription.id,
                stripeCustomerId: subscription.customer
            });

            console.log('✅ Suscripción actualizada exitosamente:', result);
        } else {
            console.log('ℹ️ Suscripción no activa, ignorando actualización:', subscription.status);
        }
        
    } catch (error) {
        console.error('❌ Error en handleSubscriptionChange:', {
            error: error.message,
            subscriptionId: subscription.id
        });
        throw error;
    }
}

async function handleSubscriptionDeleted(subscription) {
    console.log('❌ Procesando subscription deleted:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer
    });

    try {
        await convex.mutation(api.users.removeSubscription, {
            stripeCustomerId: subscription.customer
        });

        console.log('✅ Suscripción cancelada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en handleSubscriptionDeleted:', {
            error: error.message,
            subscriptionId: subscription.id
        });
        throw error;
    }
}
