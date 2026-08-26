import mongoose from 'mongoose'

const SocialAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['youtube', 'facebook', 'instagram', 'tiktok'],
      required: true,
    },
    platformAccountId: { type: String, required: true },
    accountName: { type: String, required: true },
    accountUsername: String,
    profileImageUrl: String,
    accessToken: { type: String, required: true },
    refreshToken: String,
    tokenExpiresAt: Date,
    scopes: [String],
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'error'],
      default: 'active',
    },
    lastUsedAt: Date,
  },
  { timestamps: true },
)

SocialAccountSchema.index({ platform: 1, platformAccountId: 1 }, { unique: true })

export const SocialAccount =
  mongoose.models.SocialAccount || mongoose.model('SocialAccount', SocialAccountSchema)
