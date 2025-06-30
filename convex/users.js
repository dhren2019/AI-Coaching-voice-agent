import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateUser = mutation({
    args: {
        name: v.string(),
        email: v.string()
    },
    handler: async (ctx, args) => {
        console.log('🔄 CreateUser called with:', { name: args.name, email: args.email });
        
        try {
            // Verificar si el usuario ya existe
            const existingUsers = await ctx.db.query('users')
                .filter(q => q.eq(q.field('email'), args.email))
                .collect();
            
            console.log('🔍 Existing users found:', existingUsers.length);
            
            // Si el usuario ya existe, devolverlo
            if (existingUsers && existingUsers.length > 0) {
                console.log('👤 Returning existing user:', existingUsers[0]._id);
                return existingUsers[0];
            }
            
            // Crear nuevo usuario sin subscriptionId (se agregará más tarde cuando se haga la suscripción)
            const newUserData = {
                name: args.name,
                email: args.email,
                credits: 5000
                // NO incluir subscriptionId - se maneja como opcional en el esquema
            };
            
            console.log('📝 Creating new user with data:', newUserData);
            
            const userId = await ctx.db.insert('users', newUserData);
            
            console.log('✅ New user created with ID:', userId);
            
            // Retornar el usuario completo con su ID
            const newUser = {
                _id: userId,
                ...newUserData
            };
            
            console.log('👤 Returning new user:', newUser);
            return newUser;
            
        } catch (error) {
            console.error('❌ Error in CreateUser:', error);
            throw error;
        }
    }
})

export const UpdateUserToken = mutation({
    args: {
        id: v.id('users'),
        credits: v.number()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            credits: args.credits
        })
    }
})

// Obtener usuario por email
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("email"), args.email))
            .collect();
        return users;
    }
});

export const updateUserSubscription = mutation({
    args: {
        subscriptionId: v.string(),
        stripeCustomerId: v.string()
    },
    handler: async (ctx, args) => {
        const { subscriptionId, stripeCustomerId } = args;
        
        console.log('🔄 Iniciando actualización de suscripción:', {
            subscriptionId,
            stripeCustomerId,
            timestamp: new Date().toISOString()
        });
        
        try {
            // Buscar usuario por stripeCustomerId
            console.log('🔍 Buscando usuario por stripeCustomerId:', stripeCustomerId);
            
            const users = await ctx.db
                .query('users')
                .filter(q => q.eq(q.field('stripeCustomerId'), stripeCustomerId))
                .collect();

            console.log('📊 Resultados de búsqueda:', {
                usersEncontrados: users.length,
                detalles: users.map(u => ({
                    id: u._id,
                    email: u.email,
                    creditsActuales: u.credits,
                    subscriptionIdActual: u.subscriptionId || 'unset'
                }))
            });

            if (users.length === 0) {
                console.error('❌ Usuario no encontrado en Convex:', {
                    stripeCustomerId,
                    subscriptionId,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`No se encontró el usuario con stripeCustomerId: ${stripeCustomerId}`);
            }

            const user = users[0];
            console.log('👤 Usuario encontrado en Convex:', {
                userId: user._id,
                email: user.email,
                creditsActuales: user.credits,
                subscriptionIdAnterior: user.subscriptionId || 'unset',
                nuevoSubscriptionId: subscriptionId
            });
            
            // Actualizar el usuario con la información de la suscripción
            console.log('📝 Iniciando actualización de usuario:', {
                userId: user._id,
                subscriptionIdAnterior: user.subscriptionId || 'unset',
                nuevoSubscriptionId: subscriptionId,
                nuevosCredits: 50000
            });

            // Log específico para verificar el valor del subscriptionId
            console.log('🎯 CRÍTICO - Valor del subscriptionId a guardar:', {
                raw: subscriptionId,
                type: typeof subscriptionId,
                length: subscriptionId?.length,
                startsWith_sub: subscriptionId?.startsWith('sub_'),
                json: JSON.stringify(subscriptionId),
                timestamp: new Date().toISOString()
            });

            // Actualizar usuario con el nuevo subscriptionId
            await ctx.db.patch(user._id, {
                subscriptionId: subscriptionId, // Guardamos el nuevo subscriptionId
                stripeCustomerId: stripeCustomerId,
                credits: 50000, // Establecer créditos del plan Pro
                isMember: true
            });

            console.log('💾 Patch ejecutado, verificando resultado...');

            // Obtener y retornar el usuario actualizado
            const updatedUser = await ctx.db.get(user._id);
            console.log('✅ Usuario actualizado exitosamente:', {
                userId: updatedUser._id,
                email: updatedUser.email,
                subscriptionIdAnterior: user.subscriptionId || 'unset',
                subscriptionIdNuevo: updatedUser.subscriptionId,
                subscriptionIdGuardadoCorrectamente: updatedUser.subscriptionId === subscriptionId,
                credits: updatedUser.credits,
                isMember: updatedUser.isMember,
                timestamp: new Date().toISOString()
            });

            // Verificación adicional del subscriptionId guardado
            console.log('🔍 VERIFICACIÓN FINAL del subscriptionId guardado:', {
                subscriptionIdOriginal: subscriptionId,
                subscriptionIdGuardado: updatedUser.subscriptionId,
                sonIguales: updatedUser.subscriptionId === subscriptionId,
                tipoOriginal: typeof subscriptionId,
                tipoGuardado: typeof updatedUser.subscriptionId,
                estaDefinido: updatedUser.subscriptionId !== null && updatedUser.subscriptionId !== undefined,
                timestamp: new Date().toISOString()
            });
            
            return updatedUser;
        } catch (error) {
            console.error('❌ Error en updateUserSubscription:', {
                error: error.message,
                stack: error.stack,
                stripeCustomerId,
                subscriptionId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    },
});

// Eliminar suscripción
export const removeSubscription = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query('users')
            .filter(q => q.eq(q.field('email'), args.email))
            .collect();

        if (users.length === 0) {
            throw new Error("❌ No se encontró usuario con ese email");
        }

        const user = users[0];

        // Eliminar subscriptionId y resetear créditos al plan gratuito
        await ctx.db.patch(user._id, {
            subscriptionId: undefined,
            credits: 5000 // Resetear a créditos del plan gratuito
        });

        console.log("✅ Suscripción eliminada para el usuario:", args.email);
        return user;
    },
});

// Solo actualizar stripeCustomerId (no hacer PRO hasta completar pago)
export const updateUserStripeInfo = mutation({
    args: {
        userId: v.id("users"),
        stripeCustomerId: v.string()
    },
    handler: async (ctx, args) => {
        const { userId, stripeCustomerId } = args;

        console.log('🔄 Vinculando usuario con Stripe customer:', {
            userId,
            stripeCustomerId,
            timestamp: new Date().toISOString()
        });

        try {
            await ctx.db.patch(userId, {
                stripeCustomerId
            });

            console.log('✅ Usuario vinculado con Stripe customer:', {
                userId,
                stripeCustomerId,
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('❌ Error vinculando usuario con Stripe:', {
                error: error.message,
                stack: error.stack,
                userId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
});

// Obtener todos los usuarios (para diagnóstico)
export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    }
});

// Obtener usuario por ID (para debugging)
export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    }
});

// Función de test para verificar creación de usuarios
export const testCreateUser = mutation({
    args: {
        email: v.string(),
        name: v.string()
    },
    handler: async (ctx, args) => {
        console.log('🧪 Test CreateUser function');
        
        try {
            // Intentar crear usuario de prueba
            const testUser = await ctx.db.insert('users', {
                name: args.name,
                email: args.email,
                credits: 5000
                // subscriptionId se omite intencionalmente para probar el esquema opcional
            });
            
            console.log('✅ Test user created successfully:', testUser);
            return { success: true, userId: testUser };
            
        } catch (error) {
            console.error('❌ Test user creation failed:', error);
            return { success: false, error: error.message };
        }
    }
});
