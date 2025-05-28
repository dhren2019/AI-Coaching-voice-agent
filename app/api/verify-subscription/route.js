import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/utils/logger';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Validar que tenemos la clave de Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
    logger.error('STRIPE_SECRET_KEY no está configurada');
    throw new Error('STRIPE_SECRET_KEY no está configurada');
}

// Inicializar el cliente de Stripe con la clave correcta
const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});

// Inicializar cliente de Convex
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { sessionId, userId } = await req.json();

        if (!sessionId) {
            logger.error('sessionId no proporcionado');
            return NextResponse.json({
                success: false,
                error: 'sessionId es requerido'
            }, { status: 400 });
        }

        logger.info('Verificando estado de suscripción', { sessionId, userId });

        // Obtener la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        logger.debug('Sesión recuperada', { session });

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

            logger.info('Suscripción encontrada', {
                subscriptionId: subscription.id,
                status: subscription.status,
                userId: userId || 'no proporcionado'
            });

            if (subscription.status === 'active') {
                try {
                    // Obtener el stripeCustomerId de la sesión
                    const stripeCustomerId = session.customer;

                    if (!stripeCustomerId) {
                        throw new Error('No se encontró el stripeCustomerId en la sesión');
                    }

                    await convex.mutation(api.users.updateUserSubscription, {
                        subscriptionId: subscription.id,
                        stripeCustomerId
                    });

                    logger.info('Suscripción actualizada en Convex', {
                        subscriptionId: subscription.id,
                        stripeCustomerId,
                        status: subscription.status
                    });

                    return NextResponse.json({
                        success: true,
                        subscriptionId: subscription.id,
                        status: subscription.status
                    });
                } catch (convexError) {
                    logger.error('Error actualizando Convex', {
                        error: convexError.message,
                        stack: convexError.stack
                    });
                    throw convexError;
                }
            }
        }

        logger.warning('La suscripción no está activa', {
            paymentStatus: session.payment_status,
            subscriptionStatus: session.subscription?.status,
            userId: userId || 'no proporcionado'
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