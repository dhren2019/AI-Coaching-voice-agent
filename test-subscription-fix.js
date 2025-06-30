// Test manual para verificar la corrección del subscriptionId
// Ejecutar en la consola del navegador o como script Node.js

async function testSubscriptionFix() {
    const sessionId = 'cs_test_a1Ip5p8zB9AXQlndAJoWxEttppcePcpWpjB3plx4EXrrUGAkEKnc77uRfc';
    const userId = 'j979repkeb5erxh5rgxtxb8nxx7dqmsv';
    
    console.log('🧪 Iniciando test de corrección de subscriptionId...');
    
    try {
        // 1. Primero verificar el estado actual del usuario
        console.log('🔍 1. Verificando estado actual del usuario...');
        const debugResponse = await fetch('/api/debug-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('📊 Estado actual del usuario:', debugData);
        }
        
        // 2. Simular el flujo de verificación
        console.log('🔄 2. Ejecutando verificación de suscripción...');
        const verifyResponse = await fetch('/api/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId })
        });
        
        const verifyData = await verifyResponse.json();
        console.log('📥 Resultado de verificación:', verifyData);
        
        // 3. Verificar el estado final del usuario
        console.log('🔍 3. Verificando estado final del usuario...');
        const finalDebugResponse = await fetch('/api/debug-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        if (finalDebugResponse.ok) {
            const finalDebugData = await finalDebugResponse.json();
            console.log('📊 Estado final del usuario:', finalDebugData);
            
            // 4. Verificar si la corrección funcionó
            const hasSubscriptionId = finalDebugData.debug.hasSubscriptionId;
            const subscriptionIdValue = finalDebugData.debug.subscriptionIdValue;
            
            console.log('🎯 RESULTADO DEL TEST:');
            console.log(`✅ subscriptionId presente: ${hasSubscriptionId}`);
            console.log(`📝 Valor del subscriptionId: ${subscriptionIdValue}`);
            console.log(`💳 Créditos: ${finalDebugData.user.credits}`);
            console.log(`👤 Es miembro: ${finalDebugData.user.isMember}`);
            
            if (hasSubscriptionId && subscriptionIdValue && subscriptionIdValue.startsWith('sub_')) {
                console.log('🎉 ¡CORRECCIÓN EXITOSA! El subscriptionId se guardó correctamente.');
            } else {
                console.log('❌ La corrección necesita más trabajo.');
            }
        }
        
    } catch (error) {
        console.error('❌ Error en el test:', error);
    }
}

// Ejecutar el test
testSubscriptionFix();
