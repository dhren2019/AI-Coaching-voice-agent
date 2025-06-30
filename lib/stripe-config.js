// Configuración de precios y planes de Stripe
export const STRIPE_CONFIG = {
  // Precios (deben coincidir con los de tu dashboard de Stripe)
  PRICES: {
    MONTHLY_PRO: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_1RGap9K1jLfWhQ4KMo76VgNp'
  },
  
  // Planes y sus configuraciones
  PLANS: {
    FREE: {
      name: 'Plan Gratuito',
      credits: 5000,
      price: 0,
      features: ['5,000 tokens', 'Acceso básico']
    },
    PRO: {
      name: 'Plan Pro',
      credits: 50000,
      price: 1000, // en centavos (10 EUR)
      features: ['50,000 tokens', 'Acceso completo', 'Soporte prioritario']
    }
  },
  
  // URLs de retorno
  URLS: {
    SUCCESS: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workflow`,
    CANCEL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`
  }
};

export default STRIPE_CONFIG;
