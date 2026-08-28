import crypto from 'crypto'
import { WebhookEvent, Webhook } from './models/Webhook'

export const WEBHOOK_EVENTS = [
  'post.scheduled',
  'post.published',
  'post.failed',
  'post.cancelled',
]

// Deliver an event to all enabled webhooks subscribed to that event.
export async function dispatchWebhookEvent(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const webhooks = await Webhook.find({
      enabled: true,
      events: event,
    }).lean()

    for (const webhook of webhooks) {
      const ev = await WebhookEvent.create({
        webhookId: webhook._id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
      })

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'SchedFlow-Webhook/1.0',
          'X-SchedFlow-Event': event,
        }
        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex')
          headers['X-SchedFlow-Signature'] = `sha256=${signature}`
        }

        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        })

        await WebhookEvent.findByIdAndUpdate(ev._id, {
          status: res.ok ? 'delivered' : 'failed',
          statusCode: res.status,
          attempts: 1,
          deliveredAt: res.ok ? new Date() : undefined,
        })
        await Webhook.findByIdAndUpdate(webhook._id, {
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: res.ok ? 'delivered' : 'failed',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delivery failed'
        await WebhookEvent.findByIdAndUpdate(ev._id, {
          status: 'failed',
          attempts: 1,
          payload: { error: message, ...payload },
        })
        await Webhook.findByIdAndUpdate(webhook._id, {
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: 'failed',
        })
      }
    }
  } catch {
    // never throw from dispatch — publishing must continue regardless
  }
}
