"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SubscriptionSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!sessionId) {
            router.push('/dashboard');
            return;
        }

        // Contador regresivo
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setIsRedirecting(true);
                    router.push('/dashboard');
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(countdownInterval);
        };
    }, [sessionId, router]);

    if (!sessionId) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                <div className="mb-6">
                    {isRedirecting ? (
                        <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
                    ) : (
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    ¡Suscripción Exitosa!
                </h1>
                <p className="text-gray-600 mb-6">
                    Tu suscripción al Plan Pro ha sido activada correctamente. 
                    Ahora tienes acceso a 50,000 tokens mensuales.
                </p>
                <div className="text-sm text-gray-500">
                    {isRedirecting ? (
                        "Redirigiendo al dashboard..."
                    ) : (
                        `Serás redirigido al dashboard en ${countdown} segundos...`
                    )}
                </div>
            </div>
        </div>
    );
} 