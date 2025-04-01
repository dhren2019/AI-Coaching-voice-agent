import { NextResponse } from "next/server";
import { buffer } from "micro";
import { getStripeInstance } from "@/lib/stripe-client";
import { api } from "@/convex/_generated/api"; // Mutaciones de Convex
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Usa la versión más reciente
});

// Asegúrate de que la función es compatible con el formato de las peticiones HTTP
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await buffer(req); // Lee el cuerpo del mensaje

  try {
    // Verificamos que el evento que recibimos es válido usando el webhook secret de Stripe
    const event = stripe.webhooks.constructEvent(rawBody.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET);

    // Si el evento es una sesión de pago completada
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Verifica que la sesión haya sido pagada exitosamente
      if (session.payment_status === 'paid') {
        const subscriptionId = session.subscription || session.payment_intent;  // Obtén el subscriptionId

        console.log('Pago completado. Actualizando suscripción en Convex:', subscriptionId);

        // Actualiza la base de datos Convex con el subscriptionId
        await api.users.updateUserSubscription({
          userId: session.customer,  // Puedes usar el customer_id de la sesión
          subscriptionId: subscriptionId,  // Guardar el subscriptionId
        });

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}
