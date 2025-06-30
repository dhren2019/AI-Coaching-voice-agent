"use client"
import { api } from '@/convex/_generated/api';
import { useUser } from '@stackframe/stack'
import { useMutation } from 'convex/react';
import React, { useEffect, useState } from 'react'
import { UserContext } from './_context/UserContext';

function AuthProvider({ children }) {

    const user = useUser();
    const CreateUser = useMutation(api.users.CreateUser);
    const [userData, setUserData] = useState();
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    
    useEffect(() => {
        console.log('👤 User state changed:', user?.primaryEmail || 'No user');
        if (user && !userData && !isCreatingUser) {
            CreateNewUser();
        }
    }, [user, userData, isCreatingUser])

    const CreateNewUser = async () => {
        setIsCreatingUser(true);
        try {
            console.log('🔄 Creating/fetching user...');
            const result = await CreateUser({
                name: user?.displayName,
                email: user.primaryEmail
            });
            console.log('✅ User data received:', result);
            setUserData(result);
        } catch (error) {
            console.error('❌ Error creating user:', error);
        } finally {
            setIsCreatingUser(false);
        }
    }

    return (
        <div>
            <UserContext.Provider value={{ 
                userData, 
                setUserData, 
                isCreatingUser,
                isUserReady: !!userData 
            }}>
                {children}
            </UserContext.Provider>
        </div>
    )
}

export default AuthProvider