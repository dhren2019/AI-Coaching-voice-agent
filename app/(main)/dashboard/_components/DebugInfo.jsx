"use client"
import React, { useContext, useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { UserContext } from '@/app/_context/UserContext';

function DebugInfo() {
    const user = useUser();
    const { userData, isCreatingUser, isUserReady } = useContext(UserContext);

    useEffect(() => {
        console.log('🐛 Debug Info Update:', {
            timestamp: new Date().toISOString(),
            user: {
                exists: !!user,
                email: user?.primaryEmail,
                displayName: user?.displayName
            },
            userData: {
                exists: !!userData,
                id: userData?._id,
                email: userData?.email,
                credits: userData?.credits,
                subscriptionId: userData?.subscriptionId
            },
            states: {
                isCreatingUser,
                isUserReady
            }
        });
    }, [user, userData, isCreatingUser, isUserReady]);

    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs max-w-xs opacity-75 z-50">
            <div><strong>Debug Info:</strong></div>
            <div>User: {user?.primaryEmail || 'None'}</div>
            <div>UserData: {userData?._id || 'None'}</div>
            <div>Creating: {isCreatingUser ? 'Yes' : 'No'}</div>
            <div>Ready: {isUserReady ? 'Yes' : 'No'}</div>
        </div>
    );
}

export default DebugInfo;
