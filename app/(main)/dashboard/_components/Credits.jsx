import { UserContext } from '@/app/_context/UserContext'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@stackframe/stack';
import { Wallet2 } from 'lucide-react';
import Image from 'next/image';
import React, { useContext } from 'react'

function Credits() {
    const { userData } = useContext(UserContext);
    const user = useUser();


    const CalculateProgress = () => {
        if (userData?.subscriptionId) {
            console.log((userData.credits / 50000) * 100)
            return (userData.credits / 50000) * 100
        }
    }

    return (
        <div>
            <div className='flex gap-5 items-center'>
                <Image src={user?.profileImageUrl} alt='user' width={60} height={60}
                    className='rounded-full'
                />
                <div>
                    <h2 className='text-lg font-bold'>{user?.displayName}</h2>
                    <h2 className='text-gray-500'>{user?.primaryEmail}</h2>
                </div>
            </div>
            <hr className='my-3' />
            <div>
                <h2 className='font-bold'>Token Usage</h2>
                <h2>{userData.credits}/{userData?.subscriptionId ? '50,000' : '5000'}</h2>
                <Progress value={CalculateProgress()} className='my-3' />

                <div className='flex justify-between items-center mt-3'>
                    <h2 className='font-bold'>Current Plan</h2>
                    <h2 className='p-1 bg-secondary rounded-lg px-2'>

                        {userData?.subscriptionId ? 'Paid Plan' : 'Free Plan'}
                    </h2>
                </div>

                <div className='mt-5 p-5 border rounded-2xl'>
                    <div className='flex justify-between'>
                        <div>
                            <h2 className='font-bold'>Pro Plan</h2>
                            <h2>50,000 Tokens</h2>
                        </div>
                        <h2 className='font-bold'>$10/Month</h2>
                    </div>
                    <hr className='my-3' />
                    <Button className='w-full'> <Wallet2 /> Upgrade $10</Button>
                </div>

            </div>
        </div>
    )
}

export default Credits