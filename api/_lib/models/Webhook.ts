import mongoose from 'mongoose'

const WebhookEventSchema = new mongoose.Schema(
  {
    webhookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Webhook', required: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
    statusCode: Number,
    attempts: { type: Number, default: 0 },
    deliveredAt: Date,
  },
  { timestamps: true },
)

WebhookEventSchema.index({ webhookId: 1, createdAt: -1 })

export const WebhookEvent =
  mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', WebhookEventSchema)

const WebhookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    secret: { type: String, default: '' },
    events: { type: [String], default: [] },
    lastDeliveryAt: Date,
    lastDeliveryStatus: String,
  },
  { timestamps: true },
)

export const Webhook =
  mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema)
