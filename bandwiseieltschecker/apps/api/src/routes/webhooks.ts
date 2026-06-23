import { Router, Request, Response } from 'express';
import { constructWebhookEvent, CREDIT_PACKS } from '../services/stripe.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../middleware/logger.js';
import type Stripe from 'stripe';

const router = Router();

// Raw body required for Stripe webhook signature verification
router.post(
  '/stripe',
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      res.status(400).json({ success: false, error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature' } });
      return;
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(req.body as Buffer, signature as string);
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed', { error: err });
      res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const user_id = session.metadata?.user_id;
          if (!user_id) break;

          if (session.mode === 'subscription') {
            await prisma.user.update({
              where: { id: user_id },
              data: {
                plan: 'pro',
                stripe_customer_id: session.customer as string,
              },
            });
            logger.info('User upgraded to Pro', { user_id });
          } else if (session.mode === 'payment') {
            const credit_pack = session.payment_intent
              ? ((await prisma.user.findUnique({ where: { id: user_id } })) ?? null)
              : null;
            void credit_pack;
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const user_id = pi.metadata?.user_id;
          const credits_str = pi.metadata?.credits;
          if (!user_id || !credits_str) break;

          const credits = parseInt(credits_str);
          await prisma.user.update({
            where: { id: user_id },
            data: {
              credits: { increment: credits },
              plan: 'credits',
              stripe_customer_id: pi.customer as string | null ?? undefined,
            },
          });
          logger.info('Credits added', { user_id, credits });
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: sub.customer as string },
          });
          if (!user) break;

          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'free' },
          });
          logger.info('User subscription cancelled', { user_id: user.id });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          logger.warn('Invoice payment failed', { customer: invoice.customer });
          break;
        }

        default:
          logger.debug('Unhandled Stripe event', { type: event.type });
      }

      res.json({ received: true });
    } catch (err) {
      logger.error('Stripe webhook handler error', { event_type: event.type, error: err });
      res.status(500).json({ success: false, error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
    }
  },
);

export default router;
