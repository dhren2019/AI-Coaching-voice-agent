import { NextResponse } from "next/server";
import { buffer } from "micro";
import { getStripeInstance } from "@/lib/stripe-client";
import { api } from "@/convex/_generated/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Webhook handler
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await buffer(req);

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.payment_status === 'paid') {
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        console.log("🔔 Pago exitoso recibido");
        console.log("🧾 subscriptionId:", subscriptionId);
        console.log("👤 customerId:", customerId);

        if (!subscriptionId || !customerId) {
          console.error("❌ Falta subscriptionId o customerId en la sesión");
          return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Aquí necesitas tener mapeado el Stripe customerId a un userId de Convex
        // Supongamos que tienes un campo customerId en tu tabla users
        await api.users.updateUserByStripeCustomerId({
          stripeCustomerId: customerId,
          subscriptionId,
        });

        console.log("✅ Suscripción actualizada en Convex");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Error procesando el webhook:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
