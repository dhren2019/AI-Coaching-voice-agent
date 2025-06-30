# Guía de Testing para Suscripciones

## Problema identificado
El `subscriptionId` no se estaba actualizando correctamente en la tabla `users` de Convex tras un pago exitoso.

## Correcciones implementadas

### 1. Función `saveSubscription` mejorada
- Se asegura que tanto la tabla `subscriptions` como `users` se actualicen con el `subscriptionId`
- Funciona tanto para suscripciones nuevas como actualizaciones

### 2. Verificación mejorada en `/api/verify-subscription`
- Agrega verificación post-actualización para confirmar que el usuario se actualizó correctamente
- Incluye logs detallados para debugging

### 3. Nuevo endpoint de debugging `/api/debug-user`
- Permite verificar el estado actual de cualquier usuario
- Muestra información detallada sobre subscripción y créditos

### 4. Frontend mejorado
- Agrega verificación adicional del estado del usuario después de la actualización
- Mejores logs para debugging

## Pasos para probar la corrección

### 1. Probar el flujo completo de pago
```bash
# Acceder a la aplicación
# Crear un nuevo pago y completarlo
# Verificar que se redirija a /workflow?success=true&userId=...
```

### 2. Verificar estado del usuario después del pago
```bash
# Usar el endpoint de debugging
curl -X POST http://localhost:3000/api/debug-user \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_AQUI"}'

# O por email:
curl -X POST http://localhost:3000/api/debug-user \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@email.com"}'
```

### 3. Verificar logs en la consola
Los logs ahora incluyen:
- 🎯 CRÍTICO: Información del subscriptionId
- ✅ Confirmaciones de actualización exitosa
- 🔍 Verificaciones del estado final del usuario

## Campos que se actualizan en la tabla `users`:
- `subscriptionId`: ID de la suscripción de Stripe
- `stripeCustomerId`: ID del cliente en Stripe
- `credits`: Cantidad de créditos (50,000 para Pro)
- `isMember`: Estado de membresía (true)

## Campos en la tabla `subscriptions`:
- `userId`: Referencia al usuario
- `subscriptionId`: ID de la suscripción de Stripe
- `stripeCustomerId`: ID del cliente en Stripe
- `status`: Estado de la suscripción ('active')
- `planType`: Tipo de plan ('pro')
- `credits`: Cantidad de créditos
- `currentPeriodEnd`: Fecha de fin del período actual
- `paymentStatus`: Estado del pago ('paid')

## Verificaciones automáticas
El sistema ahora verifica automáticamente:
1. Que el `subscriptionId` se guarde correctamente
2. Que coincida con el valor original de Stripe
3. Que el usuario tenga los créditos correctos
4. Que el estado de membresía sea correcto
