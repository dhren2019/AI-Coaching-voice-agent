"use client"
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@stackframe/stack';

export default function PaymentSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useUser();
    const [status, setStatus] = useState('verificando');

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
            console.error('❌ No se encontró session_id');
            router.push('/dashboard');
            return;
        }

        const verifyPayment = async () => {
            try {
                console.log('🔍 Verificando pago:', {
                    sessionId,
                    timestamp: new Date().toISOString()
                });

                const response = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-customer-email': user?.primaryEmail
                    },
                    body: JSON.stringify({ sessionId })
                });

                if (!response.ok) {
                    throw new Error('Error verificando el pago');
                }

                const data = await response.json();
                
                if (data.success) {
                    setStatus('éxito');
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('❌ Error en verificación:', error);
                setStatus('error');
            }
        };

        if (user) {
            verifyPayment();
        }
    }, [user, searchParams, router]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                {status === 'verificando' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-700">Verificando tu pago...</h2>
                        <p className="mt-2 text-gray-500">Por favor, espera un momento.</p>
                    </div>
                )}

                {status === 'éxito' && (
                    <div className="text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-xl font-semibold text-gray-700">¡Pago exitoso!</h2>
                        <p className="mt-2 text-gray-500">
                            Tu suscripción ha sido activada. Serás redirigido al dashboard en unos segundos.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="text-5xl mb-4">❌</div>
                        <h2 className="text-xl font-semibold text-red-600">Error en la verificación</h2>
                        <p className="mt-2 text-gray-500">
                            Hubo un problema verificando tu pago. Por favor, contacta a soporte.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Volver al Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 