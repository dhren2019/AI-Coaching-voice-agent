import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { stripe } from '@/lib/stripe-server';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { sessionId, userId } = await req.json();
        
        console.log('🔄 Simulador de webhook local iniciado:', {
            sessionId,
            userId,
            timestamp: new Date().toISOString()
        });

        if (!sessionId) {
            return NextResponse.json({
                success: false,
                error: 'sessionId es requerido'
            }, { status: 400 });
        }

        // Obtener la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'No se encontró la sesión de pago'
            }, { status: 404 });
        }

        console.log('📋 Sesión obtenida de Stripe:', {
            sessionId: session.id,
            paymentStatus: session.payment_status,
            mode: session.mode,
            hasSubscription: !!session.subscription,
            customerId: session.customer,
            customerEmail: session.customer_details?.email
        });

        // Verificar que la sesión es válida para procesar
        if (session.mode === 'subscription' && session.subscription && session.payment_status === 'paid') {
            
            // Obtener detalles completos de la suscripción
            const [subscription, customer] = await Promise.all([
                stripe.subscriptions.retrieve(session.subscription),
                stripe.customers.retrieve(session.customer)
            ]);

            console.log('📊 Datos completos obtenidos:', {
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                customerId: customer.id,
                customerEmail: customer.email
            });

            // Buscar usuario
            let targetUser = null;
            
            // Estrategia 1: Por userId si se proporciona
            if (userId) {
                try {
                    targetUser = await convex.query(api.users.getUserById, { userId });
                    if (targetUser) {
                        console.log('👤 Usuario encontrado por ID:', {
                            userId: targetUser._id,
                            email: targetUser.email
                        });
                    }
                } catch (error) {
                    console.log('⚠️ No se pudo buscar por userId:', error.message);
                }
            }
            
            // Estrategia 2: Por email si no se encontró por ID
            if (!targetUser && customer.email) {
                try {
                    const users = await convex.query(api.users.getUserByEmail, { 
                        email: customer.email 
                    });
                    if (users && users.length > 0) {
                        targetUser = users[0];
                        console.log('👤 Usuario encontrado por email:', {
                            userId: targetUser._id,
                            email: targetUser.email
                        });
                    }
                } catch (error) {
                    console.log('⚠️ No se pudo buscar por email:', error.message);
                }
            }

            if (!targetUser) {
                return NextResponse.json({
                    success: false,
                    error: 'No se encontró el usuario en la base de datos'
                }, { status: 404 });
            }

            // Simular el evento checkout.session.completed
            console.log('🎭 Simulando evento checkout.session.completed...');
            
            // Usar saveSubscription para actualizar todo correctamente
            const savedSubscription = await convex.mutation(api.subscriptions.saveSubscription, {
                userId: targetUser._id,
                subscriptionId: subscription.id,
                stripeCustomerId: customer.id,
                status: subscription.status,
                planType: 'pro',
                credits: 50000,
                currentPeriodEnd: subscription.current_period_end,
                paymentStatus: 'paid',
                priceId: subscription.items.data[0]?.price?.id || process.env.STRIPE_PRICE_ID_MONTHLY || ''
            });

            console.log('✅ Simulación de webhook exitosa:', {
                subscriptionId: subscription.id,
                userId: targetUser._id,
                savedId: savedSubscription
            });

            // Verificar el resultado final
            const finalUser = await convex.query(api.users.getUserById, { 
                userId: targetUser._id 
            });

            console.log('🔍 Verificación final:', {
                subscriptionIdGuardado: finalUser.subscriptionId,
                credits: finalUser.credits,
                isMember: finalUser.isMember,
                stripeCustomerId: finalUser.stripeCustomerId
            });

            return NextResponse.json({
                success: true,
                message: 'Webhook simulado exitosamente',
                data: {
                    subscriptionId: subscription.id,
                    userId: targetUser._id,
                    status: subscription.status,
                    credits: 50000,
                    customerEmail: customer.email,
                    simulation: true
                }
            });

        } else {
            console.log('⚠️ Sesión no válida para procesar:', {
                mode: session.mode,
                hasSubscription: !!session.subscription,
                paymentStatus: session.payment_status
            });

            return NextResponse.json({
                success: false,
                error: 'La sesión no es válida para procesar (no es suscripción pagada)'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Error en simulador de webhook:', {
            error: error.message,
            stack: error.stack
        });

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
