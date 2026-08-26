import mongoose from 'mongoose'

const PublishingJobSchema = new mongoose.Schema(
  {
    socialPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialPost', required: true },
    platform: {
      type: String,
      enum: ['youtube', 'facebook', 'tiktok', 'instagram'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'locked', 'publishing', 'completed', 'failed'],
      default: 'queued',
    },
    lockedAt: Date,
    lockedBy: String,
    startedAt: Date,
    completedAt: Date,
    error: String,
    errorCode: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 5 },
    nextRetryAt: { type: Date, default: Date.now },
    idempotencyKey: { type: String, required: true, unique: true },
    publishResult: {
      externalPostId: String,
      publishedUrl: String,
    },
  },
  { timestamps: true },
)

// Index for scheduler queries: find queued jobs that are due
PublishingJobSchema.index({ status: 1, nextRetryAt: 1 })
PublishingJobSchema.index({ socialPostId: 1 })
PublishingJobSchema.index({ idempotencyKey: 1 }, { unique: true })

export const PublishingJob =
  mongoose.models.PublishingJob || mongoose.model('PublishingJob', PublishingJobSchema)
