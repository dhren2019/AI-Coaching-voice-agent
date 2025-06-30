// Script para simular webhook manualmente en desarrollo
// Ejecutar en la consola del navegador

async function simulateWebhookForSession(sessionId, userId) {
    console.log('🎭 Iniciando simulación manual de webhook...');
    
    try {
        // 1. Ejecutar simulador
        console.log('🔄 Ejecutando simulador de webhook...');
        const response = await fetch('/api/webhook-simulator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId })
        });
        
        const result = await response.json();
        console.log('📋 Resultado del simulador:', result);
        
        if (result.success) {
            console.log('✅ Webhook simulado exitosamente!');
            console.log(`📝 Subscription ID: ${result.data.subscriptionId}`);
            console.log(`👤 Usuario ID: ${result.data.userId}`);
            console.log(`💳 Créditos: ${result.data.credits}`);
            console.log(`📧 Email: ${result.data.customerEmail}`);
            
            // 2. Verificar estado final
            console.log('🔍 Verificando estado final del usuario...');
            const debugResponse = await fetch('/api/debug-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: result.data.userId })
            });
            
            if (debugResponse.ok) {
                const debugData = await debugResponse.json();
                console.log('📊 Estado final verificado:', debugData);
                
                if (debugData.debug?.hasSubscriptionId) {
                    console.log('🎉 ¡PERFECTO! El webhook simulado funcionó correctamente.');
                } else {
                    console.log('⚠️ Algo salió mal en la simulación.');
                }
            }
            
        } else {
            console.error('❌ Error en simulación:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error ejecutando simulación:', error);
    }
}

// Función para simular con la última sesión creada
async function simulateLastSession() {
    const sessionId = localStorage.getItem('checkoutSessionId');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (!sessionId) {
        console.error('❌ No hay sessionId en localStorage');
        return;
    }
    
    if (!userId) {
        console.error('❌ No hay userId en la URL');
        return;
    }
    
    console.log(`🎯 Simulando webhook para sesión: ${sessionId}`);
    console.log(`👤 Usuario: ${userId}`);
    
    await simulateWebhookForSession(sessionId, userId);
}

// Auto-ejecutar si estamos en la página de workflow
if (window.location.pathname === '/workflow') {
    console.log('🎭 Auto-ejecutando simulación de webhook en página de workflow...');
    simulateLastSession();
} else {
    console.log('📝 Para simular webhook manualmente, ejecuta: simulateLastSession()');
    console.log('📝 O usa: simulateWebhookForSession("session_id", "user_id")');
}

// Exportar funciones para uso manual
window.simulateWebhookForSession = simulateWebhookForSession;
window.simulateLastSession = simulateLastSession;
