/**
 * Example webhook routes for Twilio and SendGrid
 *
 * Add these routes to your Express server
 */

import express, { Request, Response } from 'express';
import { handleTwilioWebhook, handleSMSOptOut } from './sms';
import { handleSendGridWebhook } from './email';

const router = express.Router();

// =============================================================================
// Twilio Webhooks
// =============================================================================

/**
 * Twilio SMS Delivery Status Webhook
 *
 * Handles delivery status updates from Twilio:
 * - queued → sent → delivered
 * - failed → undelivered
 *
 * Configure in Twilio Console:
 * Phone Numbers → [Your Number] → Messaging Configuration
 * Status Callback URL: https://api.cleartalk.com/webhooks/twilio/status
 */
router.post('/twilio/status', async (req: Request, res: Response) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = req.body;

    console.log(`[Twilio Webhook] ${MessageSid}: ${MessageStatus}`);

    await handleTwilioWebhook({
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Twilio SMS Reply Webhook
 *
 * Handles incoming SMS replies (STOP for opt-out)
 *
 * Configure in Twilio Console:
 * Phone Numbers → [Your Number] → Messaging Configuration
 * A Message Comes In: https://api.cleartalk.com/webhooks/twilio/reply
 */
router.post('/twilio/reply', async (req: Request, res: Response) => {
  try {
    const { From, Body } = req.body;

    console.log(`[Twilio Reply] From ${From}: ${Body}`);

    // Handle STOP/UNSUBSCRIBE keywords
    const normalizedBody = Body.trim().toLowerCase();
    if (['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'].includes(normalizedBody)) {
      await handleSMSOptOut(From);

      // Twilio auto-responds with confirmation, no need to send our own
      res.sendStatus(200);
      return;
    }

    // Ignore other replies (ClearTalk is one-way notification only)
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling Twilio reply webhook:', error);
    res.sendStatus(500);
  }
});

// =============================================================================
// SendGrid Webhooks
// =============================================================================

/**
 * SendGrid Event Webhook
 *
 * Handles email events from SendGrid:
 * - delivered
 * - open
 * - click
 * - bounce
 * - dropped
 * - deferred
 * - unsubscribe
 *
 * Configure in SendGrid:
 * Settings → Mail Settings → Event Webhook
 * HTTP POST URL: https://api.cleartalk.com/webhooks/sendgrid/events
 * Select events: Delivered, Opened, Clicked, Bounced, Unsubscribed
 */
router.post('/sendgrid/events', async (req: Request, res: Response) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      console.error('Invalid SendGrid webhook payload (not array)');
      res.sendStatus(400);
      return;
    }

    console.log(`[SendGrid Webhook] Processing ${events.length} events`);

    await handleSendGridWebhook(events);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling SendGrid webhook:', error);
    res.sendStatus(500);
  }
});

// =============================================================================
// Webhook Signature Verification (Security)
// =============================================================================

/**
 * Verify Twilio request signature
 * Middleware to add to Twilio routes for security
 */
import twilio from 'twilio';

function verifyTwilioSignature(req: Request, res: Response, next: Function) {
  const signature = req.headers['x-twilio-signature'] as string;
  const url = `${process.env.SERVER_BASE_URL}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN || '',
    signature,
    url,
    req.body
  );

  if (!isValid) {
    console.error('Invalid Twilio signature');
    res.sendStatus(403);
    return;
  }

  next();
}

/**
 * Verify SendGrid webhook signature
 * Middleware to add to SendGrid routes for security
 */
import crypto from 'crypto';

function verifySendGridSignature(req: Request, res: Response, next: Function) {
  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

  if (!signature || !timestamp) {
    console.error('Missing SendGrid signature headers');
    res.sendStatus(403);
    return;
  }

  // SendGrid uses ECDSA verification
  // Public key is provided by SendGrid in dashboard
  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '';

  try {
    const verify = crypto.createVerify('sha256');
    verify.update(timestamp + req.rawBody);

    const isValid = verify.verify(publicKey, signature, 'base64');

    if (!isValid) {
      console.error('Invalid SendGrid signature');
      res.sendStatus(403);
      return;
    }

    next();
  } catch (error) {
    console.error('Error verifying SendGrid signature:', error);
    res.sendStatus(403);
  }
}

// =============================================================================
// Apply signature verification (uncomment in production)
// =============================================================================

// router.post('/twilio/status', verifyTwilioSignature, async (req, res) => { ... });
// router.post('/twilio/reply', verifyTwilioSignature, async (req, res) => { ... });
// router.post('/sendgrid/events', verifySendGridSignature, async (req, res) => { ... });

// =============================================================================
// Export
// =============================================================================

export default router;

// Usage in main Express app:
// import webhookRoutes from './notifications/webhooks.example';
// app.use('/webhooks', webhookRoutes);
