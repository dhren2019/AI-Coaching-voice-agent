import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/utils/logger';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Validar que tenemos la clave de Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!STRIPE_SECRET_KEY) {
    logger.error('STRIPE_SECRET_KEY no está configurada');
    throw new Error('STRIPE_SECRET_KEY no está configurada');
}

if (!CONVEX_URL) {
    logger.error('NEXT_PUBLIC_CONVEX_URL no está configurada');
    throw new Error('NEXT_PUBLIC_CONVEX_URL no está configurada');
}

// Inicializar el cliente de Stripe con la clave correcta
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

// Inicializar cliente de Convex
const convex = new ConvexHttpClient(CONVEX_URL);

export async function POST(req) {
    try {
        const { sessionId, userId } = await req.json();

        logger.info('Verificando estado de suscripción', { sessionId, userId });

        if (!sessionId) {
            logger.error('sessionId no proporcionado');
            return NextResponse.json({
                success: false,
                error: 'sessionId es requerido'
            }, { status: 400 });
        }

        // Obtener la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        logger.debug('Sesión de Stripe recuperada', { session });

        if (!session) {
            logger.error('No se encontró la sesión de pago', { sessionId });
            return NextResponse.json({
                success: false,
                error: 'No se encontró la sesión de pago'
            }, { status: 404 });
        }

        // Verificar el estado de la suscripción
        if (session.subscription && session.payment_status === 'paid') {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);

            logger.info('Datos de suscripción de Stripe:', {
                subscriptionId: subscription.id,
                status: subscription.status,
                customerId: session.customer,
                email: session.customer_details?.email
            });

            if (subscription.status === 'active') {
                try {
                    // Obtener el stripeCustomerId de la sesión
                    const stripeCustomerId = session.customer;

                    if (!stripeCustomerId) {
                        throw new Error('No se encontró el stripeCustomerId en la sesión');
                    }

                    // Guardar la suscripción en Convex
                    const savedSubscription = await convex.mutation(api.subscriptions.saveSubscription, {
                        userId,
                        subscriptionId: subscription.id,
                        stripeCustomerId,
                        status: subscription.status,
                        planType: 'pro',
                        credits: 50000,
                        currentPeriodEnd: subscription.current_period_end,
                        paymentStatus: 'paid',
                        priceId: subscription.items.data[0]?.price?.id || process.env.STRIPE_PRICE_ID_MONTHLY || ''
                    });

                    logger.info('Suscripción guardada en Convex', {
                        subscriptionId: subscription.id,
                        userId,
                        savedId: savedSubscription
                    });

                    // Verificar que el usuario se actualizó correctamente
                    try {
                        const customerEmail = session.customer_details?.email;
                        
                        // Intentar obtener usuario por ID directo si lo tenemos
                        if (userId) {
                            const userById = await convex.query(api.users.getUserById, { userId });
                            if (userById) {
                                logger.info('Usuario verificado por ID después de actualización', {
                                    userId: userById._id,
                                    email: userById.email,
                                    subscriptionIdGuardado: userById.subscriptionId,
                                    coincideConSubscription: userById.subscriptionId === subscription.id,
                                    credits: userById.credits,
                                    isMember: userById.isMember,
                                    stripeCustomerId: userById.stripeCustomerId
                                });
                            }
                        }
                        
                        // También verificar por email como backup
                        if (customerEmail) {
                            const updatedUser = await convex.query(api.users.getUserByEmail, { 
                                email: customerEmail 
                            });
                            
                            if (updatedUser && updatedUser.length > 0) {
                                const user = updatedUser[0];
                                logger.info('Usuario verificado por email después de actualización', {
                                    userId: user._id,
                                    email: user.email,
                                    subscriptionIdGuardado: user.subscriptionId,
                                    coincideConSubscription: user.subscriptionId === subscription.id,
                                    credits: user.credits,
                                    isMember: user.isMember,
                                    stripeCustomerId: user.stripeCustomerId
                                });
                            }
                        }
                    } catch (verifyError) {
                        logger.warn('No se pudo verificar el usuario actualizado', {
                            error: verifyError.message
                        });
                    }

                    return NextResponse.json({
                        success: true,
                        subscriptionId: subscription.id,
                        status: subscription.status,
                        userId,
                        stripeCustomerId
                    });
                } catch (convexError) {
                    logger.error('Error actualizando Convex', {
                        error: convexError.message,
                        stack: convexError.stack
                    });
                    return NextResponse.json({
                        success: false,
                        error: convexError.message
                    }, { status: 500 });
                }
            }
        }

        logger.warning('La suscripción no está activa', {
            paymentStatus: session.payment_status,
            subscriptionStatus: session.subscription?.status
        });

        return NextResponse.json({
            success: false,
            error: 'La suscripción no está activa'
        }, { status: 400 });

    } catch (error) {
        logger.error('Error al verificar la suscripción', {
            error: error.message,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: error.message || 'Error al verificar el estado de la suscripción'
        }, { status: 500 });
    }
} 