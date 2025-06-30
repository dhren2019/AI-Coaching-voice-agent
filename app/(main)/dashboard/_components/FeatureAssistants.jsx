"use client"
import { BlurFade } from '@/components/magicui/blur-fade';
import { Button } from '@/components/ui/button';
import { CoachingOptions } from '@/services/Options';

import { useUser } from '@stackframe/stack'
import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react'
import UserInputDialog from './UserInputDialog';
import ProfileDialog from './ProfileDialog';
import { UserContext } from '@/app/_context/UserContext';

function FeatureAssistants() {
    const user = useUser();
    const { userData, isCreatingUser, isUserReady } = useContext(UserContext);
    const [hasWaited, setHasWaited] = useState(false);

    useEffect(() => {
        // Dar tiempo para que userData se cargue
        const timer = setTimeout(() => {
            setHasWaited(true);
        }, 3000); // 3 segundos de espera

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Solo verificar después del período de espera y si no está creando usuario
        if (hasWaited && !isCreatingUser && !userData?._id && user) {
            console.log('🔄 UserData not found after waiting, reloading...', { 
                userData, 
                user: user?.primaryEmail,
                isCreatingUser,
                hasWaited
            });
            // En lugar de recargar, redirigir al login
            window.location.href = '/';
        }
    }, [userData, user, isCreatingUser, hasWaited]);

    // Mostrar loading mientras se cargan los datos
    if (isCreatingUser || !hasWaited) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">
                    {isCreatingUser ? 'Setting up your account...' : 'Loading...'}
                </span>
            </div>
        );
    }
    return (
        <div>
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className='font-medium text-gray-500'>My Workspace</h2>
                    <h2 className='text-3xl font-bold'>Welcome back, {user?.displayName}</h2>
                </div>
                <ProfileDialog>
                    <Button>Profile</Button>
                </ProfileDialog>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-10 mt-10'>
                {CoachingOptions.map((option, index) => (
                    <BlurFade key={option.icon} delay={0.25 + index * 0.05} inView>
                        <div key={index} className='p-3 bg-secondary rounded-3xl flex flex-col
                     justify-center items-center cursor-pointer'>
                            <UserInputDialog coachingOption={option} >
                                <div key={index} className='flex flex-col
                     justify-center items-center'>
                                    <Image src={option.icon} alt={option.name}
                                        width={150}
                                        height={150}
                                        className='h-[70px] w-[70px] hover:rotate-12 cursor-pointer transition-all'
                                    />
                                    <h2 className='mt-2'>{option.name}</h2>
                                </div>
                            </UserInputDialog>
                        </div>
                    </BlurFade>
                ))}
            </div>
        </div>
    )
}

export default FeatureAssistants