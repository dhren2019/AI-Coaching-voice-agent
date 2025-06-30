"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function WorkflowSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const userId = searchParams.get('userId');
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            const sessionId = localStorage.getItem('checkoutSessionId');
            
            console.log('🔄 Iniciando verificación de suscripción:', {
                success,
                userId,
                sessionId: sessionId || 'No encontrado',
                isLocalhost: window.location.hostname === 'localhost',
                timestamp: new Date().toISOString()
            });

            try {
                console.log('🔍 Datos de sesión:', {
                    sessionId: sessionId ? 'Encontrado' : 'No encontrado',
                    sessionIdValue: sessionId,
                    timestamp: new Date().toISOString()
                });

                if (!sessionId) {
                    console.error('❌ No se encontró sessionId en localStorage');
                    toast.error('Error: No se encontró la sesión de pago');
                    router.push('/dashboard');
                    return;
                }

                // 🆕 En desarrollo local, usar el simulador de pago directo automáticamente
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('🎭 Ejecutando simulador de pago directo para desarrollo local...');
                    
                    try {
                        const simulatorResponse = await fetch('/api/simulate-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userId,
                            }),
                        });

                        const simulatorResult = await simulatorResponse.json();
                        console.log('🎭 Resultado del simulador de pago:', simulatorResult);

                        if (simulatorResult.success) {
                            console.log('✅ Simulador ejecutado exitosamente, suscripción actualizada');
                            toast.success('¡Pago procesado exitosamente! Redirigiendo al dashboard...');
                            
                            // Limpiar localStorage y redirigir
                            localStorage.removeItem('checkoutSessionId');
                            setTimeout(() => {
                                router.push('/dashboard');
                            }, 2000);
                            setIsProcessing(false);
                            return;
                        } else {
                            console.log('⚠️ Simulador falló, continuando con verificación normal:', simulatorResult.error);
                        }
                    } catch (simulatorError) {
                        console.log('⚠️ Error en simulador, continuando con verificación normal:', simulatorError.message);
                    }
                }

                console.log('📤 Enviando solicitud de verificación:', {
                    sessionId,
                    userId,
                    timestamp: new Date().toISOString()
                });

                // Verificar el estado de la suscripción (como antes)
                const response = await fetch('/api/verify-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        userId
                    }),
                });

                console.log('📥 Respuesta recibida:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    timestamp: new Date().toISOString()
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Error en la respuesta del servidor:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        sessionId,
                        timestamp: new Date().toISOString()
                    });
                    throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('📊 Datos de respuesta completos:', {
                    ...data,
                    timestamp: new Date().toISOString()
                });

                if (data.success) {
                    console.log('✅ Suscripción verificada exitosamente:', {
                        subscriptionId: data.subscriptionId,
                        status: data.status,
                        userId: data.userId,
                        stripeCustomerId: data.stripeCustomerId,
                        sessionId: sessionId,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Verificación adicional del estado del usuario
                    try {
                        const debugResponse = await fetch('/api/debug-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: data.userId })
                        });
                        
                        if (debugResponse.ok) {
                            const debugData = await debugResponse.json();
                            console.log('🔍 Estado final del usuario verificado:', debugData);
                            
                            if (!debugData.debug.hasSubscriptionId) {
                                console.warn('⚠️ ADVERTENCIA: Usuario actualizado pero subscriptionId no está presente');
                            }
                        }
                    } catch (debugError) {
                        console.log('ℹ️ No se pudo verificar el estado final del usuario:', debugError.message);
                    }
                    
                    toast.success('¡Suscripción activada correctamente!');
                    
                    console.log('🗑️ Limpiando sessionId del localStorage:', {
                        sessionIdEliminado: sessionId,
                        timestamp: new Date().toISOString()
                    });
                    localStorage.removeItem('checkoutSessionId');
                    
                    console.log('⏳ Iniciando redirección al dashboard');
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else {
                    console.error('❌ Error en la verificación:', {
                        error: data.error,
                        sessionId,
                        subscriptionId: data.subscriptionId,
                        timestamp: new Date().toISOString()
                    });
                    throw new Error(data.error || 'Error al verificar la suscripción');
                }
            } catch (error) {
                console.error('❌ Error en el proceso:', {
                    message: error.message,
                    stack: error.stack,
                    sessionId,
                    timestamp: new Date().toISOString()
                });
                
                toast.error(error.message || 'Error al verificar el estado de la suscripción');
                
                console.log('⏳ Iniciando redirección al dashboard por error');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } finally {
                setIsProcessing(false);
            }
        };

        if (success === 'true' && userId) {
            checkSubscriptionStatus();
        } else {
            console.log('⚠️ Parámetros inválidos:', {
                success,
                userId,
                timestamp: new Date().toISOString()
            });
            router.push('/dashboard');
        }
    }, [success, userId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {isProcessing ? (
                    <div>
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                            Procesando tu suscripción
                        </h1>
                        <p className="text-gray-600">
                            Por favor espera mientras verificamos tu pago...
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-white text-2xl">✓</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                            ¡Suscripción Exitosa!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Tu suscripción al Plan Pro ha sido activada correctamente. 
                            Ahora tienes acceso a 50,000 tokens mensuales.
                        </p>
                        <p className="text-sm text-gray-500">
                            Serás redirigido al dashboard en unos segundos...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 