import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');
        const email = searchParams.get('email');

        console.log('🔧 Diagnóstico de integración solicitado:', {
            sessionId,
            email,
            timestamp: new Date().toISOString()
        });

        let diagnosticData = {
            webhook: {},
            stripeSession: {},
            convexUser: {},
            integration: {},
            recommendations: []
        };

        // 1. Verificar estado del webhook
        try {
            const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook`, {
                method: 'GET'
            });
            diagnosticData.webhook = {
                status: webhookResponse.status,
                working: webhookResponse.ok,
                response: webhookResponse.ok ? await webhookResponse.json() : 'Error'
            };
        } catch (error) {
            diagnosticData.webhook = {
                status: 'Error',
                working: false,
                error: error.message
            };
        }

        // 2. Verificar sesión de Stripe si se proporciona sessionId
        if (sessionId) {
            try {
                console.log('🔍 Verificando sesión de Stripe:', sessionId);
                const session = await stripe.checkout.sessions.retrieve(sessionId);
                
                diagnosticData.stripeSession = {
                    id: session.id,
                    mode: session.mode,
                    paymentStatus: session.payment_status,
                    subscriptionId: session.subscription,
                    customerId: session.customer,
                    customerEmail: session.customer_details?.email,
                    metadata: session.metadata
                };

                console.log('💳 Sesión de Stripe encontrada:', diagnosticData.stripeSession);

                // Si hay subscription, obtener detalles
                if (session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription);
                    diagnosticData.stripeSession.subscriptionDetails = {
                        id: subscription.id,
                        status: subscription.status,
                        customerId: subscription.customer
                    };
                }

                // Si hay customer, obtener detalles
                if (session.customer) {
                    const customer = await stripe.customers.retrieve(session.customer);
                    diagnosticData.stripeSession.customerDetails = {
                        id: customer.id,
                        email: customer.email,
                        name: customer.name
                    };
                }

            } catch (error) {
                console.error('❌ Error obteniendo sesión de Stripe:', error.message);
                diagnosticData.stripeSession = {
                    error: error.message,
                    sessionId
                };
            }
        }

        // 3. Verificar usuario en Convex
        if (email) {
            try {
                console.log('🔍 Verificando usuario en Convex:', email);
                const users = await convex.query(api.users.getUserByEmail, { email });
                
                if (users && users.length > 0) {
                    const user = users[0];
                    diagnosticData.convexUser = {
                        found: true,
                        id: user._id,
                        email: user.email,
                        subscriptionId: user.subscriptionId || 'unset',
                        stripeCustomerId: user.stripeCustomerId || 'unset',
                        credits: user.credits,
                        isMember: user.isMember
                    };
                } else {
                    diagnosticData.convexUser = {
                        found: false,
                        email
                    };
                }
            } catch (error) {
                console.error('❌ Error verificando usuario en Convex:', error.message);
                diagnosticData.convexUser = {
                    error: error.message,
                    email
                };
            }
        }

        // 4. Análisis de integración
        const analysis = {
            webhookFunctional: diagnosticData.webhook.working,
            sessionFound: !!diagnosticData.stripeSession.id,
            subscriptionExists: !!diagnosticData.stripeSession.subscriptionId,
            userFoundInConvex: diagnosticData.convexUser.found,
            userHasStripeCustomerId: diagnosticData.convexUser.stripeCustomerId !== 'unset',
            subscriptionLinked: diagnosticData.convexUser.subscriptionId !== 'unset'
        };

        diagnosticData.integration = analysis;

        // 5. Recomendaciones basadas en el análisis
        if (!analysis.webhookFunctional) {
            diagnosticData.recommendations.push('🚨 El webhook no está funcionando - revisar configuración');
        }

        if (!analysis.userHasStripeCustomerId && analysis.userFoundInConvex) {
            diagnosticData.recommendations.push('🔗 Usuario no tiene stripeCustomerId vinculado - problema en checkout');
        }

        if (!analysis.subscriptionLinked && analysis.subscriptionExists) {
            diagnosticData.recommendations.push('🎯 Subscription existe en Stripe pero no en Convex - problema en webhook');
        }

        if (analysis.sessionFound && analysis.subscriptionExists && !analysis.subscriptionLinked) {
            diagnosticData.recommendations.push('🔄 Ejecutar manualmente la vinculación de subscription');
        }

        // 6. Si tenemos todos los datos, intentar arreglar automáticamente
        if (sessionId && email && analysis.sessionFound && analysis.subscriptionExists && analysis.userFoundInConvex && !analysis.subscriptionLinked) {
            console.log('🛠️ Intentando reparación automática...');
            
            try {
                const session = diagnosticData.stripeSession;
                const subscription = diagnosticData.stripeSession.subscriptionDetails;
                const user = diagnosticData.convexUser;

                // Actualizar stripeCustomerId si no existe
                if (!analysis.userHasStripeCustomerId) {
                    await convex.mutation(api.users.updateUserStripeInfo, {
                        userId: user.id,
                        stripeCustomerId: session.customerId
                    });
                    console.log('🔗 stripeCustomerId vinculado');
                }

                // Actualizar subscription
                await convex.mutation(api.users.updateUserSubscription, {
                    subscriptionId: subscription.id,
                    stripeCustomerId: session.customerId
                });

                console.log('✅ Reparación automática completada');
                diagnosticData.autoRepair = {
                    attempted: true,
                    success: true,
                    actions: ['stripeCustomerId vinculado', 'subscription actualizada']
                };

                // Verificar resultado
                const updatedUsers = await convex.query(api.users.getUserByEmail, { email });
                if (updatedUsers && updatedUsers.length > 0) {
                    diagnosticData.convexUser.afterRepair = {
                        subscriptionId: updatedUsers[0].subscriptionId,
                        stripeCustomerId: updatedUsers[0].stripeCustomerId,
                        credits: updatedUsers[0].credits,
                        isMember: updatedUsers[0].isMember
                    };
                }

            } catch (repairError) {
                console.error('❌ Error en reparación automática:', repairError.message);
                diagnosticData.autoRepair = {
                    attempted: true,
                    success: false,
                    error: repairError.message
                };
            }
        }

        return NextResponse.json({
            success: true,
            diagnostic: diagnosticData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en diagnóstico:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: false,
            error: 'Error en diagnóstico',
            message: error.message
        }, { status: 500 });
    }
}
