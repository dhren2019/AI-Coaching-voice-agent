import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
    try {
        const { userId, email } = await req.json();

        console.log('🔍 Debug request para usuario:', { userId, email });

        let user = null;

        // Buscar por ID si se proporciona
        if (userId) {
            try {
                user = await convex.query(api.users.getUserById, { userId });
                console.log('👤 Usuario encontrado por ID:', user);
            } catch (error) {
                console.log('❌ Error buscando por ID:', error.message);
            }
        }

        // Buscar por email si se proporciona y no se encontró por ID
        if (!user && email) {
            try {
                const users = await convex.query(api.users.getUserByEmail, { email });
                if (users && users.length > 0) {
                    user = users[0];
                    console.log('👤 Usuario encontrado por email:', user);
                }
            } catch (error) {
                console.log('❌ Error buscando por email:', error.message);
            }
        }

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Usuario no encontrado',
                searchCriteria: { userId, email }
            }, { status: 404 });
        }

        // Obtener suscripciones asociadas
        let subscriptions = [];
        try {
            subscriptions = await convex.query(api.subscriptions.getActiveSubscription, { 
                userId: user._id 
            });
        } catch (error) {
            console.log('❌ Error obteniendo suscripciones:', error.message);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                subscriptionId: user.subscriptionId,
                stripeCustomerId: user.stripeCustomerId,
                isMember: user.isMember
            },
            subscriptions,
            debug: {
                hasSubscriptionId: !!user.subscriptionId,
                subscriptionIdValue: user.subscriptionId,
                subscriptionIdType: typeof user.subscriptionId,
                isValidSubscriptionId: user.subscriptionId?.startsWith?.('sub_'),
                hasStripeCustomerId: !!user.stripeCustomerId,
                isMemberStatus: user.isMember,
                creditsCount: user.credits,
                activeSubscriptionsCount: subscriptions?.length || 0
            }
        });

    } catch (error) {
        console.error('❌ Error en debug endpoint:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
