#!/bin/bash

# Script para testing local con Stripe CLI
# Ejecutar desde la raíz del proyecto

echo "🚀 Iniciando testing de webhooks de Stripe..."

# 1. Instalar Stripe CLI si no está instalado
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI no está instalado. Instálalo desde: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# 2. Login a Stripe (solo necesario la primera vez)
echo "🔐 Verificando login de Stripe..."
stripe auth --version

# 3. Redirigir eventos de webhook a tu aplicación local
echo "🔗 Iniciando redirección de webhooks..."
echo "📍 Webhook endpoint: http://localhost:3000/api/webhook"

stripe listen --forward-to localhost:3000/api/webhook

# Eventos importantes que se capturarán:
# - checkout.session.completed
# - customer.subscription.created  
# - customer.subscription.updated
# - customer.subscription.deleted
