import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Crear o actualizar una suscripción
export const saveSubscription = mutation({
    args: {
        userId: v.id("users"),
        subscriptionId: v.string(),
        stripeCustomerId: v.string(),
        status: v.string(),
        planType: v.string(),
        credits: v.number(),
        currentPeriodEnd: v.optional(v.number()),
        paymentStatus: v.optional(v.string()),
        priceId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { 
            userId, 
            subscriptionId, 
            stripeCustomerId, 
            status, 
            planType, 
            credits,
            currentPeriodEnd,
            paymentStatus,
            priceId
        } = args;

        console.log('🔄 Iniciando guardado/actualización de suscripción:', {
            subscriptionId,
            userId,
            timestamp: new Date().toISOString()
        });

        try {
            // Buscar si ya existe una suscripción para este usuario
            const existingSubscriptions = await ctx.db
                .query("subscriptions")
                .filter(q => q.eq(q.field("userId"), userId))
                .collect();

            if (existingSubscriptions.length > 0) {
                const existingSub = existingSubscriptions[0];
                console.log('📝 Actualizando suscripción existente:', {
                    subscriptionId: existingSub.subscriptionId,
                    nuevoSubscriptionId: subscriptionId,
                    userId,
                    timestamp: new Date().toISOString()
                });

                // Actualizar la suscripción existente
                await ctx.db.patch(existingSub._id, {
                    subscriptionId,
                    stripeCustomerId,
                    status,
                    planType,
                    credits,
                    updatedAt: Date.now(),
                    currentPeriodEnd: currentPeriodEnd || null,
                    paymentStatus: status === 'active' ? 'paid' : 'pending',
                    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || ''
                });

                // Actualizar también el usuario con el nuevo subscriptionId
                console.log('🔄 Actualizando usuario con nuevo subscriptionId:', {
                    userId,
                    subscriptionIdAnterior: existingSub.subscriptionId,
                    subscriptionIdNuevo: subscriptionId,
                    timestamp: new Date().toISOString()
                });

                await ctx.db.patch(userId, {
                    subscriptionId,
                    stripeCustomerId,
                    credits,
                    isMember: true
                });

                console.log('✅ Usuario actualizado con nuevo subscriptionId:', {
                    userId,
                    subscriptionId,
                    timestamp: new Date().toISOString()
                });

                return existingSub._id;
            }

            // Crear nueva suscripción
            console.log('📝 Creando nueva suscripción:', {
                subscriptionId,
                userId,
                timestamp: new Date().toISOString()
            });

            const newSubscriptionId = await ctx.db.insert("subscriptions", {
                userId,
                subscriptionId,
                stripeCustomerId,
                status,
                planType,
                credits,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                currentPeriodEnd: currentPeriodEnd || null,
                ...(paymentStatus && { paymentStatus }),
                ...(priceId && { priceId })
            });

            console.log('✅ Suscripción guardada exitosamente:', {
                subscriptionId,
                userId,
                dbId: newSubscriptionId,
                timestamp: new Date().toISOString()
            });

            // Actualizar también el usuario con el subscriptionId
            console.log('🔄 Actualizando usuario con subscriptionId:', {
                userId,
                subscriptionId,
                stripeCustomerId,
                credits,
                timestamp: new Date().toISOString()
            });

            await ctx.db.patch(userId, {
                subscriptionId,
                stripeCustomerId,
                credits,
                isMember: true
            });

            console.log('✅ Usuario actualizado con subscriptionId:', {
                userId,
                subscriptionId,
                timestamp: new Date().toISOString()
            });

            return newSubscriptionId;
        } catch (error) {
            console.error('❌ Error al guardar suscripción:', {
                error: error.message,
                stack: error.stack,
                subscriptionId,
                userId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Obtener la suscripción activa de un usuario
export const getActiveSubscription = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("subscriptions")
            .filter(q => 
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        return subscriptions[0] || null;
    }
});

// Cancelar una suscripción
export const cancelSubscription = mutation({
    args: { 
        subscriptionId: v.string(),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const { subscriptionId, userId } = args;

        console.log('🔄 Iniciando cancelación de suscripción:', {
            subscriptionId,
            userId,
            timestamp: new Date().toISOString()
        });

        try {
            const subscriptions = await ctx.db
                .query("subscriptions")
                .filter(q => q.eq(q.field("subscriptionId"), subscriptionId))
                .collect();

            if (subscriptions.length === 0) {
                throw new Error('Suscripción no encontrada');
            }

            const subscription = subscriptions[0];

            await ctx.db.patch(subscription._id, {
                status: "canceled",
                canceledAt: Date.now(),
                updatedAt: Date.now()
            });

            // Actualizar el usuario a plan gratuito
            await ctx.db.patch(userId, {
                subscriptionId: undefined,
                credits: 5000 // Volver a créditos del plan gratuito
            });

            console.log('✅ Suscripción cancelada exitosamente:', {
                subscriptionId,
                userId,
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('❌ Error al cancelar suscripción:', {
                error: error.message,
                stack: error.stack,
                subscriptionId,
                userId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Guardar registro de pago
export const savePaymentRecord = mutation({
    args: {
        sessionId: v.string(),
        stripeCustomerId: v.string(),
        amount: v.number(),
        status: v.string(),
        metadata: v.optional(v.any()),
        subscriptionId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { sessionId, stripeCustomerId, amount, status, metadata, subscriptionId } = args;

        console.log('💰 Guardando registro de pago:', {
            sessionId,
            stripeCustomerId,
            amount,
            subscriptionId,
            timestamp: new Date().toISOString()
        });

        try {
            // Buscar usuario por stripeCustomerId
            const users = await ctx.db
                .query("users")
                .filter(q => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
                .collect();

            if (!users.length) {
                console.error('❌ Usuario no encontrado para stripeCustomerId:', stripeCustomerId);
                throw new Error('Usuario no encontrado');
            }

            const userId = users[0]._id;

            // Crear registro de pago
            const paymentId = await ctx.db.insert("paymentRecords", {
                userId,
                stripeCustomerId,
                sessionId,
                amount,
                status,
                createdAt: Date.now(),
                metadata: metadata || {},
                subscriptionId: subscriptionId || undefined
            });

            console.log('✅ Registro de pago guardado:', {
                paymentId,
                userId,
                subscriptionId,
                timestamp: new Date().toISOString()
            });

            return paymentId;
        } catch (error) {
            console.error('❌ Error guardando registro de pago:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Actualizar estado de suscripción
export const updateSubscriptionStatus = mutation({
    args: {
        subscriptionId: v.string(),
        status: v.string(),
        stripeCustomerId: v.string(),
        currentPeriodEnd: v.number()
    },
    handler: async (ctx, args) => {
        const { subscriptionId, status, stripeCustomerId, currentPeriodEnd } = args;

        console.log('🔄 Actualizando estado de suscripción:', {
            subscriptionId,
            status,
            timestamp: new Date().toISOString()
        });

        try {
            // Buscar suscripción existente
            const subscriptions = await ctx.db
                .query("subscriptions")
                .filter(q => q.eq(q.field("subscriptionId"), subscriptionId))
                .collect();

            // Buscar usuario
            const users = await ctx.db
                .query("users")
                .filter(q => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
                .collect();

            if (!users.length) {
                throw new Error('Usuario no encontrado');
            }

            const userId = users[0]._id;

            if (subscriptions.length > 0) {
                // Actualizar suscripción existente
                await ctx.db.patch(subscriptions[0]._id, {
                    status,
                    updatedAt: Date.now(),
                    currentPeriodEnd
                });

                // Actualizar usuario
                await ctx.db.patch(userId, {
                    isMember: status === 'active',
                    credits: status === 'active' ? 50000 : 5000
                });

                console.log('✅ Suscripción actualizada:', {
                    subscriptionId,
                    status,
                    userId,
                    timestamp: new Date().toISOString()
                });

                return subscriptions[0]._id;
            } else {
                // Crear nueva suscripción
                const newSubscriptionId = await ctx.db.insert("subscriptions", {
                    userId,
                    subscriptionId,
                    stripeCustomerId,
                    status,
                    planType: 'pro',
                    credits: 50000,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    currentPeriodEnd,
                    paymentStatus: status === 'active' ? 'paid' : 'pending',
                    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || ''
                });

                // Actualizar usuario
                await ctx.db.patch(userId, {
                    subscriptionId,
                    stripeCustomerId,
                    isMember: true,
                    credits: 50000
                });

                console.log('✅ Nueva suscripción creada:', {
                    subscriptionId,
                    userId,
                    timestamp: new Date().toISOString()
                });

                return newSubscriptionId;
            }
        } catch (error) {
            console.error('❌ Error actualizando suscripción:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Actualizar registro de pago
export const updatePaymentRecord = mutation({
    args: {
        stripeCustomerId: v.string(),
        amount: v.number(),
        status: v.string(),
        subscriptionId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { stripeCustomerId, amount, status, subscriptionId } = args;

        console.log('💳 Actualizando registro de pago:', {
            stripeCustomerId,
            status,
            timestamp: new Date().toISOString()
        });

        try {
            const users = await ctx.db
                .query("users")
                .filter(q => q.eq(q.field("stripeCustomerId"), stripeCustomerId))
                .collect();

            if (!users.length) {
                throw new Error('Usuario no encontrado');
            }

            const userId = users[0]._id;

            const paymentId = await ctx.db.insert("paymentRecords", {
                userId,
                stripeCustomerId,
                amount,
                status,
                createdAt: Date.now(),
                subscriptionId: subscriptionId || undefined
            });

            // Si el pago falló, actualizar el estado del usuario
            if (status === 'failed') {
                await ctx.db.patch(userId, {
                    isMember: false,
                    credits: 5000
                });
            }

            console.log('✅ Registro de pago actualizado:', {
                paymentId,
                userId,
                status,
                timestamp: new Date().toISOString()
            });

            return paymentId;
        } catch (error) {
            console.error('❌ Error actualizando registro de pago:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Función para manejar cuando se completa una suscripción desde Stripe
export const handleSubscriptionCompleted = mutation({
    args: {
        subscriptionId: v.string(),
        stripeCustomerId: v.string(),
        status: v.string(),
        userEmail: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const { subscriptionId, stripeCustomerId, status, userEmail } = args;
        
        console.log('🎉 Manejando suscripción completada:', {
            subscriptionId,
            stripeCustomerId,
            status,
            userEmail,
            timestamp: new Date().toISOString()
        });

        try {
            // Buscar usuario por stripeCustomerId primero
            let users = await ctx.db
                .query('users')
                .filter(q => q.eq(q.field('stripeCustomerId'), stripeCustomerId))
                .collect();

            // Si no se encuentra por stripeCustomerId, buscar por email
            if (users.length === 0 && userEmail) {
                console.log('🔄 Buscando usuario por email:', userEmail);
                users = await ctx.db
                    .query('users')
                    .filter(q => q.eq(q.field('email'), userEmail))
                    .collect();
            }

            if (users.length === 0) {
                console.error('❌ Usuario no encontrado:', {
                    stripeCustomerId,
                    userEmail,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Usuario no encontrado para stripeCustomerId: ${stripeCustomerId}`);
            }

            const user = users[0];
            console.log('👤 Usuario encontrado:', {
                userId: user._id,
                email: user.email,
                timestamp: new Date().toISOString()
            });

            // Actualizar el usuario con la información de suscripción
            await ctx.db.patch(user._id, {
                subscriptionId,
                stripeCustomerId,
                credits: 50000, // Créditos del plan Pro
                isMember: true
            });

            // Crear o actualizar registro de suscripción
            const saveSubscriptionArgs = {
                userId: user._id,
                subscriptionId,
                stripeCustomerId,
                status,
                planType: 'pro',
                credits: 50000,
                currentPeriodEnd: undefined,
                paymentStatus: status === 'active' ? 'paid' : 'pending',
                priceId: process.env.STRIPE_PRICE_ID_MONTHLY || ''
            };
            
            // Llamar directamente a la función saveSubscription
            await saveSubscription.handler(ctx, saveSubscriptionArgs);

            console.log('✅ Suscripción completada exitosamente:', {
                userId: user._id,
                subscriptionId,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                userId: user._id,
                subscriptionId
            };

        } catch (error) {
            console.error('❌ Error manejando suscripción completada:', {
                error: error.message,
                stack: error.stack,
                subscriptionId,
                stripeCustomerId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});