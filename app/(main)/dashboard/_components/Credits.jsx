import { UserContext } from '@/app/_context/UserContext'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@stackframe/stack';
import { Wallet2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useContext, useState, useEffect } from 'react'
import { toast } from 'sonner';
import { DotPattern } from '@/components/magicui/dot-pattern';

function Credits() {
    const { userData } = useContext(UserContext);
    const user = useUser();
    const [loading, setLoading] = useState(false);
    const [displayedTokens, setDisplayedTokens] = useState({ current: 0, max: 5000 });
    const [progressValue, setProgressValue] = useState(0);

    useEffect(() => {
        if (userData) {
            const maxTokens = userData.subscriptionId ? 50000 : 5000;
            setDisplayedTokens({
                current: userData.credits || 0,
                max: maxTokens
            });
            
            // Calculate tokens used percentage (0-100)
            const tokensUsed = maxTokens - (userData.credits || 0);
            const percentage = (tokensUsed / maxTokens) * 100;
            setProgressValue(Math.min(Math.max(percentage, 0), 100));
        }
    }, [userData]);

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/get-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user?.primaryEmail,
                }),
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('Error:', data.error);
                toast.error('Error creating payment session');
                setLoading(false);
                return;
            }

            // Redirect to Stripe payment page
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No redirect URL received');
            }
            
        } catch (error) {
            console.error('Error processing upgrade:', error);
            toast.error('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

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
                <h2>{formatNumber(displayedTokens.current)}/{formatNumber(displayedTokens.max)}</h2>
                <Progress value={progressValue} className='my-3' />

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