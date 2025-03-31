// /app/api/update-subscription/route.js
import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe-client";

// Conjunto para rastrear sesiones procesadas y evitar duplicados
const processedSessions = new Set();

export async function POST(req) {
  try {
    const stripe = getStripeInstance();
    const { sessionId, userId } = await req.json();
    
    if (!sessionId || !userId) {
      return NextResponse.json({ 
        error: 'Session ID y User ID son requeridos' 
      }, { status: 400 });
    }

    // Evitar procesar la misma sesión múltiples veces
    if (processedSessions.has(sessionId)) {
      return NextResponse.json({
        success: false,
        message: 'Sesión ya procesada anteriormente'
      });
    }

    console.log('Verificando sesión:', sessionId, 'para usuario:', userId);
    
    // Verificar el estado de la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'] // Expandir datos de suscripción
    });
    
    console.log('Estado de sesión:', session.status, 'Estado de pago:', session.payment_status);
    
    // Verificar si la sesión fue pagada exitosamente
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Intentar obtener ID de suscripción
      let subscriptionId = null;
      
      // Opción 1: Usar ID de suscripción expandido
      if (session.subscription) {
        subscriptionId = session.subscription.id;
        console.log('Usando subscription.id:', subscriptionId);
      } 
      // Opción 2: Usar ID de suscripción directo
      else if (session.subscription) {
        subscriptionId = session.subscription;
        console.log('Usando subscription string:', subscriptionId);
      }
      // Opción 3: Usar payment_intent como fallback
      else if (session.payment_intent) {
        subscriptionId = session.payment_intent;
        console.log('Usando payment_intent como fallback:', subscriptionId);
      }
      
      if (subscriptionId) {
        // Marcar sesión como procesada
        processedSessions.add(sessionId);

        // Limpiar caché periódicamente para evitar memory leak
        if (processedSessions.size > 100) {
          processedSessions.clear();
        }

        return NextResponse.json({
          success: true,
          subscriptionId: subscriptionId,
          userId
        });
      }
    }
    
    // Si no se completó el pago o no hay suscripción
    return NextResponse.json({
      success: false,
      message: 'La sesión no está completa o no tiene una suscripción asociada',
      sessionStatus: session.status,
      paymentStatus: session.payment_status
    });
    
  } catch (error) {
    console.error('Error al actualizar estado de suscripción:', error);
    return NextResponse.json({ 
      error: error.message || 'Error desconocido' 
    }, { status: 500 });
  }
}