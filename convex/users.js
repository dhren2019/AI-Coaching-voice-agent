import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const CreateUser = mutation({
    args: {
        name: v.string(),
        email: v.string()
    },
    handler: async (ctx, args) => {
        // if user already exist
        const userData = await ctx.db.query('users')
            .filter(q => q.eq(q.field('email'), args.email))
            .collect();
        //If not Then add new user
        if (userData?.length == 0) {
            const data = {
                name: args.name,
                email: args.email,
                credits: 5000
            }
            const result = await ctx.db.insert('users', {
                ...data
            });

            return data;
        }
        return userData[0]
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

// Mutación para actualizar la suscripción del usuario
export const updateUserSubscription = mutation({
    args: {
        id: v.id('users'),
        subscriptionId: v.string(),
        credits: v.number()
    },
    handler: async (ctx, args) => {
        console.log(`Actualizando suscripción para usuario ${args.id}: ${args.subscriptionId}, créditos: ${args.credits}`);
        
        try {
            // Verificar si el usuario existe
            const user = await ctx.db.get(args.id);
            if (!user) {
                console.error(`Error: Usuario con ID ${args.id} no encontrado`);
                return { 
                    success: false, 
                    error: 'Usuario no encontrado' 
                };
            }
            
            console.log(`Usuario encontrado: ${user.name}, email: ${user.email}`);
            
            // Actualiza los campos de suscripción
            await ctx.db.patch(args.id, {
                subscriptionId: args.subscriptionId,
                credits: args.credits
            });
            
            console.log(`Suscripción actualizada exitosamente para ${user.name}`);
            
            return { 
                success: true,
                message: 'Suscripción actualizada correctamente'
            };
        } catch (error) {
            console.error(`Error al actualizar suscripción: ${error.message}`);
            return { 
                success: false, 
                error: error.message || 'Error desconocido al actualizar suscripción'
            };
        }
    }
});
