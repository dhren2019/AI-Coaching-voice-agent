// /app/api/create-checkout-session/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Updated API Version
});

// ... rest of the file remains the same
export async function POST(req) {
  try {
    // Receive the customer's email AND Convex userId
    const { userEmail, userId } = await req.json();

    // --- Validation ---
    if (!userEmail || !userId) {
        return NextResponse.json({
            error: 'User email and User ID are required.'
        }, {
            status: 400
        });
    }
    // --- End Validation ---

    console.log('Creating session for:', userEmail, 'with Convex ID:', userId);

    // Create a customer in Stripe using the provided email
    // Note: Consider finding existing customer first to avoid duplicates
    const customer = await stripe.customers.create({
      email: userEmail,
      // Optionally add Convex userId to customer metadata too
      metadata: {
        convexUserId: userId
      }
    });

    // Define the base success URL
    const successUrlBase = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workflow`; // Adjust if your success page is different
    // Add userId to the success URL parameters
    const successUrlWithParams = `${successUrlBase}?success=true&userId=${userId}`; // Session ID will be appended by Stripe or handled differently

    // Create a checkout session for the customer to pay
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id, // Associate the session with the customer
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Plan Pro - 50,000 Tokens', // Ensure this matches your plan
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 1000, // 10 EUR (in cents)
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrlWithParams, // Pass userId back
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        customerEmail: userEmail,
        convexUserId: userId // Store Convex User ID here
      },
    });

    // Return the session URL to redirect the customer
    return NextResponse.json({
      url: session.url,
      sessionId: session.id, // Keep sending sessionId for potential client-side use
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error'
    }, {
      status: 500
    });
  }
}
