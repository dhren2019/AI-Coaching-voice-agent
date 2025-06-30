"use client"
import { useRouter } from 'next/navigation';

export default function PaymentCancel() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <div className="text-5xl mb-4">😔</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Pago Cancelado
                </h2>
                <p className="text-gray-500 mb-6">
                    Has cancelado el proceso de pago. Si tuviste algún problema o tienes preguntas,
                    no dudes en contactarnos.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/dashboard/upgrade')}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Intentar de nuevo
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
} 