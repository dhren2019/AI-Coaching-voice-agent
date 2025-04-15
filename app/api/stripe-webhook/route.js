// app/api/stripe-webhook/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser'; // Need Convex client to call mutations
import { api } from '@/convex/_generated/api'; // Import your Convex API definition

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia', // Updated API Version
});

// Get the webhook secret from environment variables
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Convex client
// Ensure CONVEX_URL is set in your environment variables
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

export async function POST(req) {
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set.');
        return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    const reqBuffer = await req.arrayBuffer(); // Read the raw body

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            Buffer.from(reqBuffer), // Use the raw buffer
            sig,
            webhookSecret
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Checkout session completed:', session.id);

            // Check if payment was successful
            if (session.payment_status === 'paid' && session.subscription) {
                const subscriptionId = session.subscription;
                const convexUserId = session.metadata?.convexUserId; // Retrieve from metadata

                if (!convexUserId) {
                    console.error('Error: convexUserId not found in session metadata for session:', session.id);
                    // Decide how to handle this - maybe log and ignore, or attempt lookup via email if stored
                    return NextResponse.json({ received: true, error: 'Missing convexUserId in metadata' });
                }

                // Define credits to add based on your plan (e.g., 50,000)
                const creditsToAdd = 50000; // Adjust this value as needed

                try {
                    console.log(`Updating Convex user ${convexUserId} with subscription ${subscriptionId} and adding ${creditsToAdd} credits.`);
                    // Call the Convex mutation to update the user
                    await convex.mutation(api.users.updateUserSubscription, {
                        id: convexUserId, // Pass the Convex User ID
                        subscriptionId: subscriptionId,
                        credits: creditsToAdd, // Or fetch current credits and add to them if needed
                    });
                    console.log(`Successfully updated Convex user ${convexUserId}.`);
                } catch (convexError) {
                    console.error(`Failed to update Convex user ${convexUserId}:`, convexError);
                    // Consider retry logic or alerting
                    return NextResponse.json({ received: true, error: 'Failed to update user in Convex.' }, { status: 500 });
                }
            } else {
                console.log(`Checkout session ${session.id} completed but payment status is ${session.payment_status} or no subscription found.`);
            }
            break;
        // TODO: Handle other event types like subscription updates/cancellations
        // case 'customer.subscription.updated':
        // case 'customer.subscription.deleted':
        //   // Handle subscription changes
        //   break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
}
