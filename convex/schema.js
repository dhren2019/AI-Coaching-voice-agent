import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        credits: v.number(),
        subscriptionId: v.optional(v.string()),
        stripeCustomerId: v.optional(v.string()),
        isMember: v.optional(v.boolean())
    }),

    subscriptions: defineTable({
        userId: v.id("users"),
        subscriptionId: v.string(),
        stripeCustomerId: v.string(),
        status: v.string(),
        planType: v.string(),
        credits: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
        canceledAt: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        paymentStatus: v.optional(v.string()),
        priceId: v.optional(v.string())
    }),

    paymentRecords: defineTable({
        userId: v.id("users"),
        stripeCustomerId: v.string(),
        sessionId: v.string(),
        amount: v.number(),
        status: v.string(),
        createdAt: v.number(),
        subscriptionId: v.optional(v.string()),
        metadata: v.optional(v.any())
    }),

    DiscussionRoom: defineTable({
        coachingOption: v.string(),
        topic: v.string(),
        expertName: v.string(),
        conversation: v.optional(v.any()),
        summery: v.optional(v.any()),
        uid: v.optional(v.id('users'))
    })
})