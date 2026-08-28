import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['publish_success', 'publish_failed', 'retry_scheduled', 'token_expired', 'token_revoked', 'partial_success', 'all_failed', 'info'],
      required: true,
    },
    message: { type: String, required: true },
    // Optional linkage to a social post / platform / account
    socialPostId: String,
    platform: String,
    accountId: String,
    read: { type: Boolean, default: false },
    severity: {
      type: String,
      enum: ['success', 'error', 'warning', 'info'],
      default: 'info',
    },
  },
  { timestamps: true },
)

NotificationSchema.index({ read: 1, createdAt: -1 })

export const TaskNotification =
  mongoose.models.TaskNotification || mongoose.model('TaskNotification', NotificationSchema)

export async function createNotification(
  input: {
    type: string
    message: string
    socialPostId?: string
    platform?: string
    accountId?: string
    severity?: 'success' | 'error' | 'warning' | 'info'
  },
): Promise<InstanceType<typeof TaskNotification>> {
  const doc = await TaskNotification.create({
    ...input,
    read: false,
  })
  return doc as unknown as InstanceType<typeof TaskNotification>
}
