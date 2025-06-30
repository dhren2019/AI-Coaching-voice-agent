import Stripe from 'stripe';

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Helper functions for common Stripe operations
export const stripeHelpers = {
  // Find or create customer
  async findOrCreateCustomer(email, userId) {
    // First, try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      
      // Update metadata if needed
      await stripe.customers.update(customer.id, {
        metadata: {
          convexUserId: userId
        }
      });
      
      return customer;
    }

    // Create new customer
    return await stripe.customers.create({
      email: email,
      metadata: {
        convexUserId: userId
      }
    });
  },

  // Get subscription details
  async getSubscriptionDetails(subscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  },

  // Get customer details
  async getCustomerDetails(customerId) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
};

export default stripe;
