import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
                credits: 5000,
                subscriptionId: null
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

// Consulta para obtener usuario por email
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const users = await ctx.db
            .query('users')
            .filter(q => q.eq(q.field('email'), args.email))
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
        
        // Buscar usuario por stripeCustomerId
        const users = await ctx.db
            .query('users')
            .filter(q => q.eq(q.field('stripeCustomerId'), stripeCustomerId))
            .collect();

        if (users.length === 0) {
            throw new Error('No se encontró usuario con ese stripeCustomerId');
        }

        const user = users[0];
        await ctx.db.patch(user._id, {
            subscriptionId,
            credits: 50000 // Establecer créditos del plan Pro
        });

        return user;
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
            subscriptionId: null,
            credits: 5000 // Resetear a créditos del plan gratuito
        });

        console.log("✅ Suscripción eliminada para el usuario:", args.email);
        return user;
    },
});
  