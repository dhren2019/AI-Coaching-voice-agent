"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/app/_context/UserContext';
import { toast } from 'sonner';

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const { userData } = useContext(UserContext);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Solo procesar si hay parámetros de éxito y no se ha procesado ya
    if (success === 'true' && sessionId && !processed && userData?._id) {
      console.log('🔄 PaymentSuccessHandler: Detectado pago exitoso, redirigiendo a workflow...', {
        sessionId,
        userId: userData._id
      });
      
      setProcessed(true);
      
      // Almacenar sessionId para el workflow
      localStorage.setItem('checkoutSessionId', sessionId);
      
      // Mostrar mensaje temporal y redirigir
      toast.success("¡Pago completado! Procesando tu suscripción...");
      
      // Redirigir al workflow para el procesamiento automático
      setTimeout(() => {
        router.push(`/workflow?success=true&userId=${userData._id}`);
      }, 1000);
    }
  }, [success, sessionId, processed, userData, router]);

  // Este componente no renderiza nada visible
  return null;
}
