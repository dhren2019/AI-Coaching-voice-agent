import { NextResponse } from "next/server";
import { buffer } from "micro";
import { getStripeInstance } from "@/lib/stripe-client";
import { api } from "@/convex/_generated/api"; // Mutaciones de Convex
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Asegúrate de que esta versión esté correcta
});

// Webhook handler
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await buffer(req);

  console.log("🚨 Recibiendo webhook de Stripe...");

  try {
    // Verificamos que el evento recibido sea válido usando el secreto de webhook de Stripe
    const event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Webhook verificado con éxito");

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log("🔔 Evento checkout.session.completed recibido");

      // Verifica que la sesión haya sido pagada exitosamente
      if (session.payment_status === 'paid') {
        const subscriptionId = session.subscription || session.payment_intent;
        const customerId = session.customer;  // Obtener el customerId de la sesión

        console.log("🧾 subscriptionId:", subscriptionId);
        console.log("👤 customerId:", customerId);

        if (!subscriptionId || !customerId) {
          console.error("❌ Falta subscriptionId o customerId en la sesión");
          return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Log para verificar que estamos llamando la mutación de Convex
        console.log("🔄 Llamando a la mutación de Convex para actualizar la suscripción...");

        // Actualizar la base de datos Convex con el subscriptionId
        const updateResponse = await api.users.updateUserSubscription({
          stripeCustomerId: customerId,  // Usamos customerId para encontrar el usuario
          subscriptionId,  // Actualiza el subscriptionId
        });

        console.log("✅ Respuesta de Convex al intentar actualizar la suscripción:", updateResponse);

        return NextResponse.json({ success: true });
      } else {
        console.log("🚫 El pago no fue exitoso");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Error procesando el webhook:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
