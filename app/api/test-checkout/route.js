// Endpoint simplificado para testing sin Convex
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    console.log('🧪 Test checkout endpoint llamado');
    
    const { userEmail, userId } = await req.json();
    
    console.log('📥 Datos recibidos:', { userEmail, userId });
    
    if (!userEmail || !userId) {
      return NextResponse.json({
        error: 'User email and User ID are required.'
      }, { status: 400 });
    }
    
    // Verificar variables de entorno
    console.log('🔧 Variables de entorno:', {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ Faltante',
      STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || '❌ Faltante'
    });
    
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY no está configurada');
    }
    
    if (!process.env.STRIPE_PRICE_ID_MONTHLY) {
      throw new Error('STRIPE_PRICE_ID_MONTHLY no está configurada');
    }
    
    // Crear o encontrar cliente
    console.log('🔄 Buscando/creando cliente en Stripe...');
    
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('👤 Cliente existente encontrado:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { convexUserId: userId }
      });
      console.log('👤 Nuevo cliente creado:', customer.id);
    }
    
    // Crear sesión de checkout
    console.log('💳 Creando sesión de checkout...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_MONTHLY,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workflow?success=true&userId=${userId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        customerEmail: userEmail,
        convexUserId: userId
      },
    });
    
    console.log('✅ Sesión creada exitosamente:', {
      sessionId: session.id,
      customerId: customer.id,
      url: session.url
    });
    
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      customerId: customer.id
    });
    
  } catch (error) {
    console.error('❌ Error detallado en test-checkout:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: error.type,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      error: `Error del servidor: ${error.message}`,
      type: error.type || 'unknown',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, {
      status: 500
    });
  }
}
