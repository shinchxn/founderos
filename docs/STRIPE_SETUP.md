# Stripe Setup Guide

1. **Create a Stripe Account**: Go to stripe.com and create an account.
2. **Configure Webhooks**: 
   - Go to Developers -> Webhooks.
   - Add endpoint targeting `https://<your-domain>/api/webhooks/stripe`.
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env`.
3. **Configure Products**:
   - Create a Pro Plan product with a recurring price.
   - Copy the Price ID to `STRIPE_PRICE_ID_PRO` in `.env`.
4. **Stripe Connect** (Phase 2):
   - In Settings -> Connect, configure an OAuth application.
   - Add redirect URI `https://<your-domain>/api/integrations/stripe-connect/callback`.
   - Set `STRIPE_CONNECT_CLIENT_ID` in `.env`.
