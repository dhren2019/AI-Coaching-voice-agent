import { NextResponse } from "next/server";

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
    
    return NextResponse.json({
      status: 'OK',
      message: 'POST test funcionando',
      receivedData: body,
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
