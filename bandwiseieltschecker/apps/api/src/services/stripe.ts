import Stripe from 'stripe';
import { logger } from '../middleware/logger.js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const CREDIT_PACKS: Record<string, { credits: number; price_cents: number }> = {
  '5': { credits: 5, price_cents: 1000 },
  '10': { credits: 10, price_cents: 1800 },
  '20': { credits: 20, price_cents: 3200 },
};

export async function createCheckoutSession(params: {
  user_id: string;
  email: string;
  plan: 'pro' | 'credits';
  credit_pack?: '5' | '10' | '20';
  customer_id?: string | null;
  success_url: string;
  cancel_url: string;
}): Promise<string> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: params.customer_id ?? undefined,
    customer_email: params.customer_id ? undefined : params.email,
    metadata: { user_id: params.user_id },
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    mode: params.plan === 'pro' ? 'subscription' : 'payment',
    line_items: [],
  };

  if (params.plan === 'pro') {
    sessionParams.line_items = [
      { price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 },
    ];
    sessionParams.subscription_data = { metadata: { user_id: params.user_id } };
  } else {
    const pack = CREDIT_PACKS[params.credit_pack ?? '5'];
    sessionParams.line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pack.credits} Essay Credits`,
            description: 'Never expire. Use anytime.',
          },
          unit_amount: pack.price_cents,
        },
        quantity: 1,
      },
    ];
    sessionParams.payment_intent_data = {
      metadata: {
        user_id: params.user_id,
        credit_pack: params.credit_pack ?? '5',
        credits: String(pack.credits),
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

export async function createPortalSession(params: {
  customer_id: string;
  return_url: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customer_id,
    return_url: params.return_url,
  });
  return session.url;
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
