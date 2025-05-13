// /app/api/update-subscription/route.js
import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe-client";

// Caché para rastrear sesiones ya procesadas
const processedSessions = new Set();

export async function POST(req) {
  try {
    // Parseo seguro del cuerpo de la solicitud
    const body = await req.text();
    let sessionId, userId;
    
    try {
      const parsedBody = body ? JSON.parse(body) : {};
      sessionId = parsedBody.sessionId;
      userId = parsedBody.userId;
    } catch (parseError) {
      console.error('Error al parsear el cuerpo de la solicitud:', parseError);
      return NextResponse.json({ 
        error: 'Error al parsear la solicitud' 
      }, { status: 400 });
    }
    
    // Validaciones iniciales
    if (!sessionId || !userId) {
      console.error('Solicitud incompleta:', { sessionId, userId });
      return NextResponse.json({ 
        error: 'Session ID y User ID son requeridos' 
      }, { status: 400 });
    }

    // Prevenir procesamiento duplicado
    if (processedSessions.has(sessionId)) {
      console.log('Sesión ya procesada:', sessionId);
      return NextResponse.json({
        success: false,
        message: 'Sesión ya procesada'
      });
    }

    console.log('Verificando sesión:', sessionId, 'para usuario:', userId);
    
    const stripe = getStripeInstance();
    
    // Verificar el estado de la sesión de Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Información de sesión recuperada:', {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        subscription: session.subscription
      });
    } catch (stripeError) {
      console.error('Error al recuperar la sesión de Stripe:', stripeError);
      return NextResponse.json({ 
        error: 'Error al verificar la sesión de pago' 
      }, { status: 500 });
    }
    
    // Verificar si la sesión fue pagada exitosamente
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Obtener el ID de suscripción
      const subscriptionId = session.subscription;
      
      // Si hay una suscripción, devolver la información para actualizar en Convex
      if (subscriptionId) {
        // Marcar sesión como procesada
        processedSessions.add(sessionId);

        // Limpiar caché periódicamente para evitar memory leak
        if (processedSessions.size > 100) {
          processedSessions.clear();
        }

        console.log('Suscripción verificada exitosamente:', subscriptionId);
        return NextResponse.json({
          success: true,
          subscriptionId,
          userId
        });
      } else {
        console.error('Sesión pagada pero sin ID de suscripción:', session.id);
      }
    } else {
      console.log('Sesión no completada:', {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status
      });
    }
    
    // Si no se completó el pago o no hay suscripción
    return NextResponse.json({
      success: false,
      message: 'La sesión no está completa o no tiene una suscripción asociada'
    });
    
  } catch (error) {
    console.error('Error al actualizar estado de suscripción:', error);
    return NextResponse.json({ 
      error: error.message || 'Error desconocido' 
    }, { status: 500 });
  }
}
