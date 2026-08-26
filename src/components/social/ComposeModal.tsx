import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Calendar, Tag, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { SocialPost, SocialPostPlatform, SocialMediaAttachment, Platform } from '../../store/schema'
import { PLATFORM_COLORS, PLATFORM_DEFAULTS, PLATFORM_LIMITS } from '../../store/schema'
import Button from '../shared/Button'
import { Input, Textarea } from '../shared/Input'
import SectionLabel from '../shared/SectionLabel'
import AIGenerateModal from './AIGenerateModal'
import { uploadFile } from '../../lib/api/client'

const ALL_PLATFORMS: Platform[] = ['youtube', 'facebook', 'tiktok', 'instagram']

function PlatformChip({ platform, enabled, onToggle }: {
  platform: Platform
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={`${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${enabled ? 'enabled' : 'disabled'}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
        enabled
          ? 'border-transparent text-white shadow-subtle'
          : 'border-border bg-surface text-text-secondary hover:bg-surface-alt'
      }`}
      style={enabled ? { background: PLATFORM_COLORS[platform] } : undefined}
    >
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20 text-[8px] font-bold">
        {platform[0].toUpperCase()}
      </span>
      {platform.charAt(0).toUpperCase() + platform.slice(1)}
    </button>
  )
}

function PlatformOverridePanel({ platform, postPlatform, onChange }: {
  platform: Platform
  postPlatform: SocialPostPlatform | undefined
  onChange: (patch: Partial<SocialPostPlatform>) => void
}) {
  if (!postPlatform) return null
  const limits = PLATFORM_LIMITS[platform]

  return (
    <div className="rounded-lg border border-border bg-surface-alt p-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ background: PLATFORM_COLORS[platform] }}
        >
          {platform[0].toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-text-primary">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Override
        </span>
      </div>
      <div className="mt-2 space-y-2">
        <div>
          <label className="text-[11px] font-medium text-text-secondary">Caption</label>
          <Textarea
            rows={3}
            value={postPlatform.caption}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder={`Platform-specific caption for ${platform}...`}
            className="mt-1 text-xs"
          />
          <p className="mt-0.5 text-[10px] text-text-muted">
            {postPlatform.caption.length}/{limits.maxCaption} chars
          </p>
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-secondary">Hashtags</label>
          <Input
            value={postPlatform.hashtags.join(', ')}
            onChange={(e) => onChange({ hashtags: e.target.value.split(',').map((h) => h.trim()).filter(Boolean) })}
            placeholder="tag1, tag2, tag3"
            className="mt-1 text-xs"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-secondary">Visibility</label>
          <select
            value={postPlatform.visibility}
            onChange={(e) => onChange({ visibility: e.target.value as SocialPostPlatform['visibility'] })}
            className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="friends">Friends</option>
            <option value="unlisted">Unlisted</option>
          </select>
      </div>
      </div>
    </div>
  )
}

export default function ComposeModal({ post, initialDate, initialCardId, onClose }: { post: SocialPost | null; initialDate?: string; initialCardId?: string; onClose: () => void }) {
  const { addSocialPost, updateSocialPost, removeMediaFromPost } = useStore()

  const [title, setTitle] = useState(post?.title ?? '')
  const [caption, setCaption] = useState(post?.caption ?? '')
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<Platform>>(
    new Set(post?.platforms.filter((p) => p.enabled).map((p) => p.platform) ?? [])
  )
  const [platformOverrides, setPlatformOverrides] = useState<Map<Platform, SocialPostPlatform>>(
    new Map(post?.platforms.map((p) => [p.platform, p]) ?? [])
  )
  const [scheduledDate, setScheduledDate] = useState(post?.scheduledDate ?? initialDate ?? '')
  const [scheduledTime, setScheduledTime] = useState(post?.scheduledTime ?? '')
  const [tags, setTags] = useState(post?.tags.join(', ') ?? '')
  const [media, setMedia] = useState<SocialMediaAttachment[]>(post?.media ?? [])
  const [aiOpen, setAiOpen] = useState(false)

  const isEditing = !!post

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
  }, [handleClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const togglePlatform = (platform: Platform) => {
    setEnabledPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
        if (!platformOverrides.has(platform)) {
          const defaults = PLATFORM_DEFAULTS[platform]
          setPlatformOverrides((prevMap) => {
            const nextMap = new Map(prevMap)
            nextMap.set(platform, {
              platform,
              enabled: true,
              status: 'pending',
              caption: defaults.caption ?? '',
              hashtags: defaults.hashtags ? [...defaults.hashtags] : [],
              mentions: [],
              visibility: defaults.visibility ?? 'public',
            })
            return nextMap
          })
        }
      }
      return next
    })
  }

  const updateOverride = (platform: Platform, patch: Partial<SocialPostPlatform>) => {
    setPlatformOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(platform)
      if (existing) {
        next.set(platform, { ...existing, ...patch })
      }
      return next
    })
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const uploadPromises = Array.from(files).map(async (file) => {
      const mediaType: SocialMediaAttachment['type'] = file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
          ? 'audio'
          : 'image'
      try {
        const result = await uploadFile(file)
        return {
          id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: mediaType,
          name: file.name,
          dataUrl: result.storageUrl,
          storageUrl: result.storageUrl,
          size: file.size,
          mimeType: result.mimeType,
          platformCompat: ALL_PLATFORMS,
        } as SocialMediaAttachment
      } catch {
        // Fallback to base64 if API is unavailable
        return new Promise<SocialMediaAttachment>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: mediaType,
              name: file.name,
              dataUrl: reader.result as string,
              size: file.size,
              platformCompat: ALL_PLATFORMS,
            })
          }
          reader.readAsDataURL(file)
        })
      }
    })
    const results = await Promise.all(uploadPromises)
    setMedia((prev) => [...prev, ...results])
    e.target.value = ''
  }

  const handleSave = (status: 'draft' | 'scheduled') => {
    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const platforms: SocialPostPlatform[] = ALL_PLATFORMS
      .filter((p) => enabledPlatforms.has(p))
      .map((p) => {
        const override = platformOverrides.get(p)
        return override ?? {
          platform: p,
          enabled: true,
          status: 'pending' as const,
          caption: '',
          hashtags: [],
          mentions: [],
          visibility: 'public' as const,
        }
      })

    const postData = {
      title: title.trim() || 'Untitled Post',
      caption,
      platforms,
      media,
      cardId: isEditing ? post?.cardId : initialCardId,
      scheduledDate: status === 'scheduled' ? scheduledDate || undefined : undefined,
      scheduledTime: status === 'scheduled' ? scheduledTime || undefined : undefined,
      status,
      repeat: 'none' as const,
      tags: parsedTags,
    }

    if (isEditing && post) {
      updateSocialPost(post.id, postData)
    } else {
      addSocialPost(postData)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="compose-modal-title">
      <div className="absolute inset-0 bg-[#0f1a19]/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 flex h-full items-start justify-center overflow-y-auto p-3 pt-8 sm:pt-16">
      <div className="animate-in flex w-full max-w-2xl flex-col rounded-[14px] border border-border bg-surface shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="compose-modal-title" className="text-base font-semibold text-text-primary">
            {isEditing ? 'Edit Social Post' : 'Compose Social Post'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close compose dialog"
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="scroll-slim flex-1 overflow-y-auto p-4 space-y-5">
          {/* Platform Selector */}
          <div>
            <SectionLabel>Platforms</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <PlatformChip
                  key={p}
                  platform={p}
                  enabled={enabledPlatforms.has(p)}
                  onToggle={() => togglePlatform(p)}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <SectionLabel>Title</SectionLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Internal post title..."
              className="mt-2"
            />
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Default Caption</SectionLabel>
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                aria-label="Generate caption with AI"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary-subtle"
              >
                <Sparkles size={12} />
                AI Generate
              </button>
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption here..."
              rows={5}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-text-muted">{caption.length} characters</p>
          </div>

          {/* Media */}
          <div>
            <SectionLabel icon={<Plus size={12} />}>Media</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {media.map((m) => (
                <div key={m.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  {m.type === 'image' ? (
                    <img src={m.dataUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-alt text-[10px] text-text-muted">
                      {m.type === 'video' ? '🎬' : '🎵'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaFromPost(post?.id ?? '', m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="absolute right-0.5 top-0.5 rounded-full bg-danger p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-surface-alt transition-colors hover:border-primary">
                <input type="file" accept="image/*,video/*,audio/*" multiple onChange={handleMediaUpload} className="hidden" aria-label="Upload media file" />
                <Plus size={20} className="text-text-muted" />
              </label>
            </div>
          </div>

          {/* Per-Platform Overrides */}
          {enabledPlatforms.size > 0 && (
            <div>
              <SectionLabel>Per-Platform Overrides</SectionLabel>
              <div className="mt-2 space-y-2">
                {Array.from(enabledPlatforms).map((p) => (
                  <PlatformOverridePanel
                    key={p}
                    platform={p}
                    postPlatform={platformOverrides.get(p)}
                    onChange={(patch) => updateOverride(p, patch)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduling */}
          <div>
            <SectionLabel icon={<Calendar size={12} />}>Scheduling</SectionLabel>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-medium text-text-secondary">Date</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-text-secondary">Time</label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <SectionLabel icon={<Tag size={12} />}>Tags</SectionLabel>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="marketing, launch, promo"
              className="mt-2"
            />
            <p className="mt-1 text-[10px] text-text-muted">Comma-separated tags for filtering</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave('draft')}>Save Draft</Button>
          <Button variant="primary" onClick={() => handleSave('scheduled')}>Schedule</Button>
        </div>
      </div>
      </div>

      {aiOpen && (
        <AIGenerateModal
          onUse={(generated) => setCaption(generated)}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  )
}
