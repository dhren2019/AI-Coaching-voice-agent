# 🔍 GUÍA DE TESTING - Stripe + Convex Integration

## Estado Actual del Código

### ✅ Mejoras Implementadas:
1. **Logs detallados en webhook** - Captura específica del subscriptionId
2. **Logs en función updateUserSubscription** - Verificación paso a paso del guardado
3. **Endpoint de debug** - `/api/debug-subscription` para revisar estado de usuarios
4. **Doble estrategia de búsqueda** - Por stripeCustomerId y por email

### 🎯 Logs Críticos Añadidos:

#### En el Webhook (`/api/webhook/route.js`):
- Log del subscriptionId capturado en eventos
- Verificación del valor exacto del subscriptionId
- Confirmación de tipo y formato

#### En Convex (`convex/users.js`):
- Log del subscriptionId antes de guardar
- Verificación post-guardado
- Comparación de valores originales vs guardados

## 🧪 Pasos para Testing:

### 1. Reiniciar el Servidor
```bash
# Detener el servidor si está corriendo
# Reiniciar con:
npm run dev
```

### 2. Realizar una Compra de Prueba
- Ir a la aplicación
- Iniciar proceso de suscripción
- Completar pago con tarjeta de prueba de Stripe

### 3. Monitorear Logs del Webhook
Durante el pago, buscar en la consola:

```
🎯 SUBSCRIPTION CAPTURADO en checkout.session.completed
🔍 VALOR EXACTO del subscriptionId
🎯 CRÍTICO: Verificando subscriptionId en checkout
✅ SUBSCRIPTION ID CONFIRMADO
```

### 4. Monitorear Logs de Convex
Buscar logs de actualización del usuario:

```
🎯 CRÍTICO - Valor del subscriptionId a guardar
💾 Patch ejecutado, verificando resultado...
🔍 VERIFICACIÓN FINAL del subscriptionId guardado
```

### 5. Verificar Estado en Base de Datos
Usar el endpoint de debug:

```
GET /api/debug-subscription?email=tu-email@example.com
```

O si conoces el stripeCustomerId:
```
GET /api/debug-subscription?customerId=cus_xxxxxxxx
```

### 6. Verificar en Página Workflow
Después del pago, la página `/workflow` debería mostrar:
- ✅ Suscripción verificada exitosamente
- subscriptionId en los logs
- Usuario actualizado a PRO

## 🔍 Qué Buscar en los Logs:

### ✅ ÉXITO - Lo que debes ver:
```
🎯 SUBSCRIPTION CAPTURADO: sub_xxxxxxxxx
✅ SUBSCRIPTION ID CONFIRMADO: sub_xxxxxxxxx
✅ Usuario actualizado exitosamente
🔍 VERIFICACIÓN FINAL: sonIguales: true
```

### ❌ PROBLEMA - Lo que indicaría error:
```
❌ subscriptionId no es válido
❌ CRÍTICO: No se pudo actualizar usuario
🔍 VERIFICACIÓN FINAL: sonIguales: false
```

## 🛠️ Endpoints de Diagnóstico:

1. **Debug de Suscripción**: `/api/debug-subscription?email=tu-email`
2. **Test de Conexión**: `/api/test`
3. **Estado del Webhook**: `/api/webhook` (método GET)

## 📋 Checklist Post-Compra:

- [ ] Webhook recibe evento `checkout.session.completed`
- [ ] subscriptionId se captura correctamente (formato `sub_xxxxxxx`)
- [ ] Usuario se encuentra en Convex por stripeCustomerId
- [ ] subscriptionId se guarda en la base de datos
- [ ] Campo `subscriptionId` deja de estar como "unset"
- [ ] Usuario pasa a PRO (isMember: true, credits: 50000)
- [ ] Página workflow muestra éxito

## 🚨 Troubleshooting:

### Si el webhook no funciona:
1. Verificar que el endpoint `/api/webhook` responde con GET
2. Reiniciar servidor Next.js
3. Verificar variables de entorno (`STRIPE_WEBHOOK_SECRET`)

### Si no se encuentra el usuario:
1. Verificar que `stripeCustomerId` se guardó durante checkout
2. Usar búsqueda por email como fallback
3. Revisar logs del endpoint `/api/create-checkout-session`

### Si subscriptionId queda como "unset":
1. Verificar logs del webhook para confirmar captura
2. Revisar logs de Convex para confirmar guardado
3. Usar endpoint de debug para ver estado actual
