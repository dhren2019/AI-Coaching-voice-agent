import { UserContext } from '@/app/_context/UserContext'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@stackframe/stack';
import { Wallet2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useContext, useState, useEffect } from 'react'
import { toast } from 'sonner';
import { DotPattern } from '@/components/magicui/dot-pattern';

// Función de log del cliente
const clientLog = (message, data = null) => {
    const log = {
        timestamp: new Date().toISOString(),
        message,
        data
    };
    console.log('Client Log:', log);
    // Guardar en localStorage para debugging
    const logs = JSON.parse(localStorage.getItem('paymentLogs') || '[]');
    logs.push(log);
    localStorage.setItem('paymentLogs', JSON.stringify(logs));
};

function Credits() {
    const { userData } = useContext(UserContext);
    const user = useUser();
    const [loading, setLoading] = useState(false);

    // El componente Progress en shadcn/ui muestra la barra llena cuando el valor es 100
    // y vacía cuando el valor es 0. Necesitamos INVERTIR esta lógica para nuestro caso.
    const calculateProgress = () => {
        if (!userData?.credits) return 0;
        
        const maxTokens = userData?.subscriptionId ? 50000 : 5000;
        const availableTokens = userData.credits;
        
        // La clave está aquí: invertimos la barra de progreso
        // Un valor alto (userData.credits cercano a maxTokens) debería dar un progreso bajo (barra vacía)
        return 100 - ((availableTokens / maxTokens) * 100);
    }

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            clientLog('Iniciando proceso de upgrade', { userEmail: user?.primaryEmail });
            
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user?.primaryEmail,
                    userId: userData?._id,
                    successUrl: `${window.location.origin}/workflow?success=true&userId=${userData?._id}`,
                    cancelUrl: `${window.location.origin}/dashboard?canceled=true`
                }),
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            clientLog('Respuesta del servidor recibida', { data });
            
            if (data.error) {
                clientLog('Error en la respuesta del servidor', { error: data.error });
                toast.error('Error al crear la sesión de pago');
                setLoading(false);
                return;
            }

            // Redirigir a Stripe Checkout
            if (data.url) {
                clientLog('Redirigiendo a Stripe', { 
                    checkoutUrl: data.url,
                    sessionId: data.sessionId 
                });
                // Guardar el ID de la sesión en localStorage
                localStorage.setItem('checkoutSessionId', data.sessionId);
                window.location.href = data.url;
            } else {
                throw new Error('No se recibió la URL de redirección');
            }
            
        } catch (error) {
            clientLog('Error en el proceso de pago', { error: error.message });
            toast.error('Ocurrió un error. Por favor intenta de nuevo.');
            setLoading(false);
        }
    };

    const handleTestUpgrade = async () => {
        try {
            setLoading(true);
            clientLog('🧪 Iniciando proceso de upgrade de TESTING', { userEmail: user?.primaryEmail });
            
            const response = await fetch('/api/test-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user?.primaryEmail,
                    userId: userData?._id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error response:', errorData);
                throw new Error(`Error HTTP: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            clientLog('✅ Respuesta del servidor recibida', { data });
            
            if (data.error) {
                clientLog('❌ Error en la respuesta del servidor', { error: data.error });
                toast.error(`Error al crear la sesión de pago: ${data.error}`);
                setLoading(false);
                return;
            }

            // Redirigir a Stripe Checkout
            if (data.url) {
                clientLog('🔀 Redirigiendo a Stripe', { 
                    checkoutUrl: data.url,
                    sessionId: data.sessionId 
                });
                window.location.href = data.url;
            } else {
                throw new Error('URL de checkout no recibida');
            }
        } catch (error) {
            clientLog('❌ Error en test upgrade:', { 
                error: error.message,
                stack: error.stack 
            });
            toast.error(`Error: ${error.message}`);
            setLoading(false);
        }
    }

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
    };

    // Para depuración
    useEffect(() => {
        if (userData) {
            console.log('Token usage info:', {
                credits: userData.credits,
                maxTokens: userData.subscriptionId ? 50000 : 5000,
                progressBarValue: calculateProgress()
            });
        }
    }, [userData]);

    return (
        <div>
            <div className='flex gap-5 items-center'>
                <Image src={user?.profileImageUrl || '/placeholder-avatar.png'} alt='user' width={60} height={60}
                    className='rounded-full'
                />
                <div>
                    <h2 className='text-lg font-bold'>{user?.displayName || 'User'}</h2>
                    <h2 className='text-gray-500'>{user?.primaryEmail || 'email@example.com'}</h2>
                </div>
            </div>
            <hr className='my-3' />
            <div>
                <h2 className='font-bold'>Token Usage</h2>
                <h2>{formatNumber(userData?.credits)}/{userData?.subscriptionId ? '50,000' : '5,000'}</h2>
                <Progress value={calculateProgress()} className='my-3' />

                <div className='flex justify-between items-center mt-3'>
                    <h2 className='font-bold'>Current Plan</h2>
                    <h2 className='p-1 bg-secondary rounded-lg px-2'>
                        {userData?.subscriptionId ? 'Pro Plan' : 'Free Plan'}
                    </h2>
                </div>

                {!userData?.subscriptionId && (
                    <div className="mt-5">
                        {/* Contenedor principal con borde de gradiente */}
                        <div className="relative p-[2px] rounded-2xl overflow-hidden shine-border-container">
                            {/* Contenido con fondo y patrón de puntos */}
                            <div className="relative bg-background/80 backdrop-blur-sm rounded-xl p-5 z-10 overflow-hidden">
                                {/* DotPattern como fondo */}
                                <div className="absolute inset-0 z-0">
                                    <DotPattern
                                        width={20}
                                        height={20}
                                        cx={1}
                                        cy={1}
                                        r={0.5}
                                        className="absolute inset-0 h-full w-full text-blue-400/20"
                                    />
                                </div>
                                
                                {/* Contenido sobre el patrón de puntos */}
                                <div className="relative z-10">
                                    <div className='flex justify-between'>
                                        <div>
                                            <h2 className='font-bold'>Pro Plan</h2>
                                            <h2>50,000 Tokens</h2>
                                        </div>
                                        <h2 className='font-bold'>$10/Month</h2>
                                    </div>
                                    <hr className='my-3' />
                                    <Button 
                                        className='w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white' 
                                        onClick={handleUpgrade}
                                        disabled={loading}
                                    > 
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Wallet2 className="mr-2" /> Upgrade $10
                                            </>
                                        )}
                                    </Button>
                                    
                                    {/* Botón de testing temporal */}
                                    <Button 
                                        className='w-full mt-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white' 
                                        onClick={handleTestUpgrade}
                                        disabled={loading}
                                    > 
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                🧪 Test Upgrade $10
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer text */}
                        <p className="text-s text-gray-800 mt-3 text-center italic">
                            Activamos tu cuenta de forma manual, te notificaremos por email cuando tu cuenta esté activa.
                        </p>
                        
                        {/* Estilos CSS para la animación */}
                        <style jsx global>{`
                            .shine-border-container {
                                background: linear-gradient(90deg, #4F46E5, #6366F1, #818CF8, #3B82F6);
                                position: relative;
                            }
                            
                            .shine-border-container::before {
                                content: "";
                                position: absolute;
                                top: 0;
                                left: -100%;
                                width: 50%;
                                height: 100%;
                                background: linear-gradient(
                                    90deg,
                                    transparent,
                                    rgba(255, 255, 255, 0.4),
                                    transparent
                                );
                                animation: shine 2s infinite linear;
                                z-index: 1;
                            }
                            
                            @keyframes shine {
                                100% {
                                    left: 200%;
                                }
                            }
                        `}</style>
                    </div>
                )}   
            </div>
        </div>
    )
}

export default Credits