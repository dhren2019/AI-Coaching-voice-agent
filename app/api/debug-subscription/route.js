import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const stripeCustomerId = searchParams.get('customerId');

        console.log('🔍 Debug de suscripción solicitado:', {
            email,
            stripeCustomerId,
            timestamp: new Date().toISOString()
        });

        let user = null;

        // Buscar usuario por email si se proporciona
        if (email) {
            console.log('📧 Buscando usuario por email:', email);
            const users = await convex.query(api.users.getUserByEmail, { email });
            if (users && users.length > 0) {
                user = users[0];
                console.log('👤 Usuario encontrado por email:', {
                    id: user._id,
                    email: user.email,
                    subscriptionId: user.subscriptionId || 'unset',
                    stripeCustomerId: user.stripeCustomerId || 'unset',
                    credits: user.credits,
                    isMember: user.isMember
                });
            } else {
                console.log('❌ No se encontró usuario con email:', email);
            }
        }

        // Buscar por stripeCustomerId si se proporciona
        if (stripeCustomerId && !user) {
            console.log('🏪 Buscando usuario por stripeCustomerId:', stripeCustomerId);
            try {
                const users = await convex.query(api.users.getAllUsers);
                const foundUser = users.find(u => u.stripeCustomerId === stripeCustomerId);
                if (foundUser) {
                    user = foundUser;
                    console.log('👤 Usuario encontrado por stripeCustomerId:', {
                        id: user._id,
                        email: user.email,
                        subscriptionId: user.subscriptionId || 'unset',
                        stripeCustomerId: user.stripeCustomerId,
                        credits: user.credits,
                        isMember: user.isMember
                    });
                } else {
                    console.log('❌ No se encontró usuario con stripeCustomerId:', stripeCustomerId);
                }
            } catch (error) {
                console.error('❌ Error buscando por stripeCustomerId:', error.message);
            }
        }

        // Si no se encontró usuario, mostrar todos los usuarios para debug
        if (!user) {
            console.log('📋 Mostrando todos los usuarios para debug:');
            try {
                const allUsers = await convex.query(api.users.getAllUsers);
                console.log('👥 Usuarios en la base de datos:', allUsers.map(u => ({
                    id: u._id,
                    email: u.email,
                    subscriptionId: u.subscriptionId || 'unset',
                    stripeCustomerId: u.stripeCustomerId || 'unset',
                    credits: u.credits,
                    isMember: u.isMember
                })));

                return NextResponse.json({
                    success: false,
                    message: 'Usuario no encontrado',
                    searchParams: { email, stripeCustomerId },
                    allUsers: allUsers.map(u => ({
                        id: u._id,
                        email: u.email,
                        subscriptionId: u.subscriptionId || 'unset',
                        stripeCustomerId: u.stripeCustomerId || 'unset',
                        credits: u.credits,
                        isMember: u.isMember
                    }))
                });
            } catch (error) {
                console.error('❌ Error obteniendo todos los usuarios:', error.message);
                return NextResponse.json({
                    success: false,
                    error: 'Error accediendo a la base de datos',
                    message: error.message
                }, { status: 500 });
            }
        }

        // Análisis del estado del usuario
        const analysis = {
            tieneSubscriptionId: !!user.subscriptionId,
            subscriptionIdValido: user.subscriptionId?.startsWith?.('sub_'),
            esMiembro: user.isMember,
            tieneCreditos: user.credits > 0,
            stripeCustomerIdVinculado: !!user.stripeCustomerId
        };

        console.log('📊 Análisis del usuario:', analysis);

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                subscriptionId: user.subscriptionId || 'unset',
                stripeCustomerId: user.stripeCustomerId || 'unset',
                credits: user.credits,
                isMember: user.isMember
            },
            analysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en debug-subscription:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        }, { status: 500 });
    }
}
