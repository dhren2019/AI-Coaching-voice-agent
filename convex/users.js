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

export const updateUserByStripeCustomerId = mutation({
    args: {
      stripeCustomerId: v.string(),
      subscriptionId: v.string(),
    },
    handler: async (ctx, args) => {
      const users = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("stripeCustomerId"), args.stripeCustomerId))
        .collect();
  
      if (users.length === 0) {
        console.error("❌ No se encontró usuario con ese Stripe customer ID");
        return;
      }
  
      const user = users[0];
  
      await ctx.db.patch(user._id, {
        subscriptionId: args.subscriptionId,
      });
  
      console.log("✅ Usuario actualizado con subscriptionId:", args.subscriptionId);
    },
  });

