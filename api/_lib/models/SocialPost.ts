import mongoose from 'mongoose'

const SocialPostPlatformSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['youtube', 'facebook', 'tiktok', 'instagram'],
      required: true,
    },
    enabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'publishing', 'posted', 'failed', 'cancelled'],
      default: 'pending',
    },
    caption: { type: String, default: '' },
    hashtags: [String],
    mentions: [String],
    location: String,
    altText: String,
    visibility: { type: String, default: 'public' },
    externalPostId: String,
    publishedUrl: String,
    publishedAt: Date,
    error: String,
    errorCode: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastAttemptAt: Date,
    nextRetryAt: Date,
    idempotencyKey: String,
  },
  { _id: false },
)

const MediaReferenceSchema = new mongoose.Schema(
  {
    id: String,
    type: { type: String, enum: ['image', 'video', 'audio'] },
    name: String,
    storageUrl: String,
    thumbnailUrl: String,
    size: Number,
    mimeType: String,
    duration: Number,
    width: Number,
    height: Number,
    uploadedAt: Date,
    // Legacy: base64 data URL for backward compatibility with localStorage data
    dataUrl: String,
  },
  { _id: false },
)

const SocialPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    caption: { type: String, default: '' },
    scheduledAt: { type: Date },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: [
        'draft',
        'scheduled',
        'publishing',
        'posted',
        'partially_published',
        'failed',
        'cancelled',
      ],
      default: 'draft',
    },
    platforms: [SocialPostPlatformSchema],
    media: [MediaReferenceSchema],
    cardId: String,
    repeat: {
      type: String,
      enum: ['none', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly'],
      default: 'none',
    },
    repeatUntil: String,
    tags: [String],
    aiGeneration: {
      model: String,
      prompt: String,
      tokensUsed: Number,
      generatedAt: String,
      version: Number,
    },
    analytics: [
      {
        platform: String,
        reach: Number,
        likes: Number,
        comments: Number,
        shares: Number,
        clicks: Number,
        impressions: Number,
        engagementRate: Number,
        fetchedAt: String,
        isDemo: Boolean,
      },
    ],
  },
  { timestamps: true },
)

// Index for scheduler queries
SocialPostSchema.index({ scheduledAt: 1, status: 1 })
SocialPostSchema.index({ status: 1 })
SocialPostSchema.index({ cardId: 1 })

export const SocialPost =
  mongoose.models.SocialPost || mongoose.model('SocialPost', SocialPostSchema)
