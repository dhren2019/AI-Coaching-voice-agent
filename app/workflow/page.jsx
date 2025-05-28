"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const success = searchParams.get('success');
    const userId = searchParams.get('userId');
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            try {
                // Obtener el sessionId del localStorage
                const sessionId = localStorage.getItem('checkoutSessionId');
                
                if (!sessionId) {
                    console.error('No se encontró sessionId');
                    router.push('/dashboard');
                    return;
                }

                // Verificar el estado de la suscripción
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

                const data = await response.json();

                if (data.success) {
                    toast.success('¡Suscripción activada correctamente!');
                    // Limpiar el sessionId del localStorage
                    localStorage.removeItem('checkoutSessionId');
                    // Redirigir al dashboard después de 3 segundos
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Error al verificar la suscripción');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Error al verificar el estado de la suscripción');
                router.push('/dashboard');
            } finally {
                setIsProcessing(false);
            }
        };

        if (success === 'true' && userId) {
            checkSubscriptionStatus();
        } else {
            router.push('/dashboard');
        }
    }, [success, userId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                {isProcessing ? (
                    <>
                        <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin mb-6" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">
                            Procesando tu suscripción
                        </h1>
                        <p className="text-gray-600">
                            Por favor espera mientras verificamos tu pago...
                        </p>
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
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
                    </>
                )}
            </div>
        </div>
    );
} 