# 🎯 Script de Verificación Post-Compra

# Ejecutar después de completar una compra para verificar el estado:

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/debug-subscription?email=toledoagentsautomation@gmail.com" -Method GET
$response | ConvertTo-Json -Depth 5

# Lo que deberías ver si funciona correctamente:
# - subscriptionId: "sub_xxxxxxxxx" (ya no "unset")
# - stripeCustomerId: "cus_xxxxxxxxx" (ya no "unset") 
# - credits: 50000 (ya no 5000)
# - tieneSubscriptionId: true
# - stripeCustomerIdVinculado: true
