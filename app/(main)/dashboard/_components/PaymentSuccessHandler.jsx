
"use client";
// Componente PaymentSuccessHandler.jsx
// Debes añadirlo a tu carpeta de componentes
import { useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/app/_context/UserContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const { userData, setUserData } = useContext(UserContext);
  const [checked, setChecked] = useState(false);
  
  // Usa tu mutación de Convex existente
  // Asegúrate de que la ruta API coincida con tu estructura actual
  const updateUserSubscription = useMutation(api.users.updateUserSubscription);

  useEffect(() => {
    // Verificar si venimos de un pago exitoso y no hemos verificado ya
    if (success === 'true' && sessionId && userData?._id && !checked) {
      const verifyPayment = async () => {
        try {
          // Llamar a nuestra API para verificar el estado de la sesión
          const response = await fetch('/api/update-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              userId: userData._id
            }),
          });

          const data = await response.json();
          
          // Si la verificación fue exitosa, actualizar Convex
          if (data.success && data.subscriptionId) {
            // Actualizar la suscripción en Convex
            // Asegúrate de que los nombres de los argumentos coincidan con tu función existente
            await updateUserSubscription({
              id: userData._id,
              subscriptionId: data.subscriptionId,
              credits: 50000 // Actualizar a 50,000 tokens para el plan Pro
            });
            
            // Actualizar el contexto local del usuario
            setUserData({
              ...userData,
              subscriptionId: data.subscriptionId,
              credits: 50000
            });
            
            toast.success('¡Suscripción activada! Ahora tienes acceso al Plan Pro con 50,000 tokens.');
          }
        } catch (error) {
          console.error('Error al verificar el pago:', error);
          toast.error('Error al verificar el estado de la suscripción');
        }
        
        // Marcar como verificado para no repetir
        setChecked(true);
      };

      verifyPayment();
    }
  }, [success, sessionId, userData, checked, updateUserSubscription, setUserData]);

  // Este componente no renderiza nada visible
  return null;
}