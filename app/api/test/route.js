import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
  try {
    console.log('🧪 Test endpoint llamado');
    
    // Verificar variables de entorno
    const envCheck = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ Faltante',
      STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || '❌ Faltante',
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ? '✅ Configurada' : '❌ Faltante',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    console.log('🔧 Variables de entorno:', envCheck);
    
    return NextResponse.json({
      status: 'OK',
      message: 'Endpoint de prueba funcionando',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('🧪 Test POST endpoint llamado con:', body);
    
    // Si se solicita crear un usuario
    if (body.action === 'createUser') {
      try {
        const user = await convex.mutation(api.users.CreateUser, {
          name: body.name || 'Usuario de Prueba',
          email: body.email || 'test@example.com'
        });
        
        console.log('👤 Usuario creado/encontrado:', user);
        
        return NextResponse.json({
          status: 'OK',
          message: 'Usuario creado/encontrado',
          user,
          userId: user._id || user.id,
          timestamp: new Date().toISOString()
        });
      } catch (convexError) {
        console.error('❌ Error con Convex:', convexError);
        return NextResponse.json({
          error: 'Error con Convex: ' + convexError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
    // Si se solicita listar usuarios
    if (body.action === 'listUsers') {
      try {
        const users = await convex.query(api.users.getAllUsers, {});
        
        console.log('👥 Usuarios encontrados:', users.length);
        
        return NextResponse.json({
          status: 'OK',
          message: 'Usuarios listados',
          users: users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            credits: u.credits,
            subscriptionId: u.subscriptionId,
            isMember: u.isMember
          })),
          count: users.length,
          timestamp: new Date().toISOString()
        });
      } catch (convexError) {
        console.error('❌ Error listando usuarios:', convexError);
        return NextResponse.json({
          error: 'Error listando usuarios: ' + convexError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      status: 'OK',
      message: 'POST test funcionando',
      receivedData: body,
      availableActions: ['createUser', 'listUsers'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en test POST endpoint:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
