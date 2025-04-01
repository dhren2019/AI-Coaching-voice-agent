// PaymentSuccessHandler.jsx
import { useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '@/app/_context/UserContext';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const { userData, setUserData } = useContext(UserContext);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (success === 'true' && !checked) {
      // Aquí puedes agregar un control para evitar la redirección repetitiva
      // Ejemplo de llamada a Convex para actualizar la suscripción
      api.users.updateUserSubscription({
        sessionId,
        status: 'active',
      }).then(() => {
        setChecked(true);
        toast.success("¡Pago exitoso! Tu suscripción ha sido activada.");
      }).catch((error) => {
        toast.error("Hubo un error al activar tu suscripción.");
      });
    }
  }, [success, checked, sessionId]);

  return (
    <div>
      {/* Contenido del componente de éxito */}
    </div>
  );
}