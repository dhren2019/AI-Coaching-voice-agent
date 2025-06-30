// /app/api/create-checkout-session/route.js
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
  try {
    // Receive the customer's email AND Convex userId
    const { userEmail, userId } = await req.json();

    console.log('📥 Datos recibidos:', { userEmail, userId });

    // --- Validation ---
    if (!userEmail || !userId) {
        console.error('❌ Datos faltantes:', { userEmail, userId });
        return NextResponse.json({
            error: 'User email and User ID are required.'
        }, {
            status: 400
        });
    }
    // --- End Validation ---

    console.log('Creating session for:', userEmail, 'with Convex ID:', userId);

    // Verificar variables de entorno
    console.log('🔧 Variables de entorno:', {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ Faltante',
      STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || '❌ Faltante',
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ? '✅ Configurada' : '❌ Faltante'
    });

    // Find or create customer in Stripe
    const customer = await stripe.customers.list({
      email: userEmail,
      limit: 1
    }).then(async (existingCustomers) => {
      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        await stripe.customers.update(customer.id, {
          metadata: { convexUserId: userId }
        });
        return customer;
      } else {
        return await stripe.customers.create({
          email: userEmail,
          metadata: { convexUserId: userId }
        });
      }
    });
    console.log('Customer:', customer.id);

    // Update user in Convex with stripeCustomerId
    try {
      console.log('🔄 Intentando actualizar usuario en Convex...');
      
      if (!convex) {
        console.error('❌ ConvexHttpClient no está inicializado');
        throw new Error('ConvexHttpClient no está disponible');
      }
      
      await convex.mutation(api.users.updateUserStripeInfo, {
        userId: userId,
        stripeCustomerId: customer.id
      });
      
      console.log('✅ Usuario actualizado con stripeCustomerId:', {
        userId,
        stripeCustomerId: customer.id
      });
    } catch (error) {
      console.error('❌ Error actualizando usuario con stripeCustomerId:', {
        error: error.message,
        stack: error.stack
      });
      // Don't fail session creation for this error, but log it
    }

    // Define the base success URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrlWithParams = `${baseUrl}/workflow?success=true&userId=${userId}`;
    const cancelUrl = `${baseUrl}/dashboard?canceled=true`;

    console.log('🔗 URLs configuradas:', { successUrlWithParams, cancelUrl });

    // Create a checkout session for the customer to pay
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id, // Associate the session with the customer
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_MONTHLY, // Usar directamente la variable de entorno
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrlWithParams, // Pass userId back
      cancel_url: cancelUrl,
      metadata: {
        customerEmail: userEmail,
        convexUserId: userId // Store Convex User ID here
      },
    });

    // Return the session URL to redirect the customer
    return NextResponse.json({
      url: session.url,
      sessionId: session.id, // Keep sending sessionId for potential client-side use
      customerId: customer.id,
      // 🆕 Información adicional para desarrollo local
      development: {
        simulateWebhookUrl: process.env.NODE_ENV === 'development' ? 
          `${baseUrl}/api/webhook-simulator` : null,
        instructions: process.env.NODE_ENV === 'development' ? 
          'En desarrollo local, el webhook se simulará automáticamente en /workflow' : null
      }
    });
  } catch (error) {
    console.error('❌ Error detallado en create-checkout-session:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      error: `Error del servidor: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, {
      status: 500
    });
  }
}
