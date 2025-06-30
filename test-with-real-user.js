// Script para encontrar usuarios y probar la corrección
// Ejecutar en la consola del navegador

async function findAndTestUser() {
    console.log('🔍 Buscando usuarios en la base de datos...');
    
    try {
        // Primero, vamos a buscar todos los usuarios para ver qué IDs existen
        const response = await fetch('/api/debug-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Información de la base de datos:', data);
        } else {
            console.log('❌ No se pudo acceder al endpoint de diagnóstico');
        }
        
        // Intentar crear un usuario de prueba si no existe
        console.log('👤 Intentando crear/obtener usuario de prueba...');
        const createUserResponse = await fetch('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createUser',
                email: 'test@example.com',
                name: 'Usuario de Prueba'
            })
        });
        
        if (createUserResponse.ok) {
            const userData = await createUserResponse.json();
            console.log('👤 Usuario de prueba:', userData);
            
            if (userData.userId) {
                // Ahora probar con este usuario
                await testSubscriptionWithUser(userData.userId);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

async function testSubscriptionWithUser(userId) {
    console.log(`🧪 Probando corrección con usuario: ${userId}`);
    
    const sessionId = 'cs_test_a1Ip5p8zB9AXQlndAJoWxEttppcePcpWpjB3plx4EXrrUGAkEKnc77uRfc';
    
    try {
        // Verificar estado actual
        console.log('🔍 Estado actual...');
        let response = await fetch('/api/debug-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        console.log('Antes:', await response.json());
        
        // Ejecutar verificación
        console.log('🔄 Verificando suscripción...');
        response = await fetch('/api/verify-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId })
        });
        const result = await response.json();
        console.log('Resultado:', result);
        
        // Verificar estado final
        console.log('🔍 Estado final...');
        response = await fetch('/api/debug-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        console.log('Después:', await response.json());
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

// Ejecutar
findAndTestUser();
