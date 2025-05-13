"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '@/app/_context/UserContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const { userData, setUserData } = useContext(UserContext);
  
  // Usar useRef para rastrear procesamiento
  const processingRef = useRef(false);
  const processedSessionsRef = useRef(new Set());
  // Añadir estado para rastrear intentos
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const updateUserSubscription = useMutation(api.users.updateUserSubscription);

  useEffect(() => {
    const verifyPayment = async () => {
      // Condiciones para evitar reprocesamiento
      if (
        success !== 'true' || 
        !sessionId || 
        processingRef.current || 
        processedSessionsRef.current.has(sessionId)
      ) {
        return;
      }

      // Verificar si tenemos userData y su ID
      if (!userData || !userData._id) {
        // Si no tenemos userData pero no hemos excedido los reintentos, programar otro intento
        if (retryCount < maxRetries) {
          console.log(`Esperando userData, intento ${retryCount + 1} de ${maxRetries}...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            processingRef.current = false; // Permitir otro intento
          }, 1000); // Esperar 1 segundo antes de reintentar
          return;
        } else {
          console.error('No se pudo obtener userData después de múltiples intentos');
          toast.error('Error al verificar la suscripción. Por favor, contacta a soporte.');
          return;
        }
      }

      // Bloquear procesamiento
      processingRef.current = true;
      processedSessionsRef.current.add(sessionId);

      try {
        console.log(`Verificando pago para sesión ${sessionId} y usuario ${userData._id}`);
        
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

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de update-subscription:', data);
        
        if (data.success && data.subscriptionId) {
          // Actualizar suscripción en Convex
          try {
            await updateUserSubscription({
              id: userData._id,
              subscriptionId: data.subscriptionId,
              credits: 50000
            });
            
            // Actualizar contexto de usuario
            setUserData(prev => ({
              ...prev,
              subscriptionId: data.subscriptionId,
              credits: 50000
            }));
            
            // Mostrar mensaje de éxito
            toast.success('¡Suscripción activada! Ahora tienes acceso al Plan Pro con 50,000 tokens.');
            console.log('Suscripción actualizada exitosamente:', data.subscriptionId);

            // Redirigir para prevenir bucle
            router.replace('/dashboard');
          } catch (convexError) {
            console.error('Error al actualizar en Convex:', convexError);
            toast.error('Error al actualizar la suscripción en la base de datos');
          }
        } else {
          console.error('Respuesta de API sin éxito:', data);
          toast.error('No se pudo verificar la suscripción');
        }
      } catch (error) {
        console.error('Error al verificar el pago:', error);
        toast.error('Error al verificar el estado de la suscripción');
      } finally {
        // Liberar bloqueo
        processingRef.current = false;
      }
    };

    verifyPayment();
  }, [success, sessionId, userData, updateUserSubscription, setUserData, router, retryCount]);

  return null;
}
