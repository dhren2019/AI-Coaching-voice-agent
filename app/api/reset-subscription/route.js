import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { email } = await req.json();
        
        console.log('🔄 Reseteando suscripción para:', email);

        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email es requerido'
            }, { status: 400 });
        }

        // Llamar a la función removeSubscription en Convex
        const result = await convex.mutation(api.users.removeSubscription, {
            email
        });

        console.log('✅ Suscripción reseteada:', result);

        return NextResponse.json({
            success: true,
            message: 'Suscripción reseteada exitosamente',
            user: result
        });

    } catch (error) {
        console.error('❌ Error al resetear suscripción:', error);
        return NextResponse.json({
            success: false,
            error: `Error: ${error.message}`
        }, { status: 500 });
    }
}
