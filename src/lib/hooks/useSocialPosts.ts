import { useState, useEffect, useCallback, useRef } from 'react'
import { socialPostsApi } from '../api/social-posts'
import { uploadFile } from '../api/client'
import { loadSocialPosts, saveSocialPosts } from '../../store/storage'
import type { SocialPost, SocialPostPlatform, SocialMediaAttachment, SocialAnalytics, Platform } from '../../store/schema'

/**
 * React hook that manages social posts with API-first + localStorage fallback.
 * Provides the same interface as the store methods so StoreProvider can delegate to it.
 */
export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>(() => loadSocialPosts())
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const postsRef = useRef(posts)
  postsRef.current = posts

  // Load from API on mount, fallback to localStorage
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await socialPostsApi.list()
        if (!cancelled) {
          setPosts(data)
          saveSocialPosts(data)
          setIsOnline(true)
        }
      } catch {
        if (!cancelled) setIsOnline(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Debounced localStorage sync
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        saveSocialPosts(postsRef.current)
      } catch {
        // ignore
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [posts])

  const mutate = useCallback((fn: (prev: SocialPost[]) => SocialPost[]) => {
    setPosts(fn)
  }, [])

  const addPost = useCallback(async (input: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialPost> => {
    const optimistic: SocialPost = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mutate((prev) => [optimistic, ...prev])
    try {
      const created = await socialPostsApi.create(input)
      mutate((prev) => prev.map((p) => (p.id === optimistic.id ? created : p)))
      return created
    } catch {
      setIsOnline(false)
      return optimistic
    }
  }, [mutate])

  const updatePost = useCallback(async (id: string, patch: Partial<SocialPost>) => {
    mutate((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
    )
    try {
      await socialPostsApi.update(id, patch)
    } catch {
      setIsOnline(false)
    }
  }, [mutate])

  const deletePost = useCallback(async (id: string) => {
    mutate((p) => p.filter((x) => x.id !== id))
    try {
      await socialPostsApi.delete(id)
    } catch {
      setIsOnline(false)
    }
  }, [mutate])

  const duplicatePost = useCallback((id: string): SocialPost | null => {
    const original = postsRef.current.find((p) => p.id === id)
    if (!original) return null
    const copy: SocialPost = {
      ...original,
      id: crypto.randomUUID(),
      title: `${original.title} (copy)`,
      status: 'draft',
      scheduledDate: undefined,
      scheduledTime: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mutate((prev) => [copy, ...prev])
    // Fire-and-forget API call
    socialPostsApi.create(copy).catch(() => setIsOnline(false))
    return copy
  }, [mutate])

  const movePost = useCallback((id: string, newDate: string, newTime?: string) => {
    mutate((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, scheduledDate: newDate, scheduledTime: newTime ?? p.scheduledTime, updatedAt: new Date().toISOString() }
          : p
      )
    )
    try {
      socialPostsApi.update(id, { scheduledDate: newDate, scheduledTime: newTime }).catch(() => setIsOnline(false))
    } catch {
      setIsOnline(false)
    }
  }, [mutate])

  const getByDate = useCallback((date: string): SocialPost[] =>
    postsRef.current.filter((p) => p.scheduledDate === date), [])

  const getByPlatform = useCallback((platform: Platform): SocialPost[] =>
    postsRef.current.filter((p) => p.platforms.some((pl) => pl.platform === platform && pl.enabled)), [])

  const getByStatus = useCallback((status: SocialPost['status']): SocialPost[] =>
    postsRef.current.filter((p) => p.status === status), [])

  const getByCard = useCallback((cardId: string): SocialPost[] =>
    postsRef.current.filter((p) => p.cardId === cardId), [])

  const getUnscheduled = useCallback((): SocialPost[] =>
    postsRef.current.filter((p) => !p.scheduledDate), [])

  const addPlatform = useCallback((postId: string, platform: Platform) => {
    mutate((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        if (p.platforms.some((pl) => pl.platform === platform)) return p
        const entry: SocialPostPlatform = {
          platform,
          enabled: true,
          status: 'pending',
          caption: '',
          hashtags: [],
          mentions: [],
          visibility: 'public',
        }
        return { ...p, platforms: [...p.platforms, entry], updatedAt: new Date().toISOString() }
      })
    )
  }, [mutate])

  const removePlatform = useCallback((postId: string, platform: Platform) => {
    mutate((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, platforms: p.platforms.filter((pl) => pl.platform !== platform), updatedAt: new Date().toISOString() }
          : p
      )
    )
  }, [mutate])

  const updatePlatform = useCallback((postId: string, platform: Platform, patch: Partial<SocialPostPlatform>) => {
    mutate((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        return {
          ...p,
          platforms: p.platforms.map((pl) => (pl.platform === platform ? { ...pl, ...patch } : pl)),
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }, [mutate])

  const addMedia = useCallback((postId: string, media: Omit<SocialMediaAttachment, 'id'>) => {
    mutate((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const attachment: SocialMediaAttachment = { ...media, id: crypto.randomUUID() }
        return { ...p, media: [...p.media, attachment], updatedAt: new Date().toISOString() }
      })
    )
  }, [mutate])

  const removeMedia = useCallback((postId: string, mediaId: string) => {
    mutate((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, media: p.media.filter((m) => m.id !== mediaId), updatedAt: new Date().toISOString() }
          : p
      )
    )
  }, [mutate])

  const updateAnalytics = useCallback((postId: string, platform: Platform, analytics: SocialAnalytics) => {
    mutate((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const existing = p.analytics ?? []
        const updated = existing.filter((a) => a.platform !== platform)
        return { ...p, analytics: [...updated, analytics], updatedAt: new Date().toISOString() }
      })
    )
  }, [mutate])

  return {
    posts,
    loading,
    isOnline,
    addPost,
    updatePost,
    deletePost,
    duplicatePost,
    movePost,
    getByDate,
    getByPlatform,
    getByStatus,
    getByCard,
    getUnscheduled,
    addPlatform,
    removePlatform,
    updatePlatform,
    addMedia,
    removeMedia,
    updateAnalytics,
    uploadFile,
  }
}
