import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationsApi } from '../api/notifications'
import type { TaskNotification } from '../api/notifications'

export function useNotifications(pollIntervalMs = 15000) {
  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await notificationsApi.list({ limit: 50 })
      setNotifications(data)
      setError(null)
    } catch (e) {
      // Non-fatal: the backend may be unavailable (e.g. local demo fallback).
      setError(e instanceof Error ? e.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    try {
      await notificationsApi.markRead(id)
    } catch {
      // optimistically updated; ignore backend failure
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await Promise.allSettled(unread.map((n) => notificationsApi.markRead(n._id)))
  }, [notifications])

  useEffect(() => {
    refresh()
    timerRef.current = setInterval(refresh, pollIntervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [refresh, pollIntervalMs])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading, error, refresh, markRead, markAllRead }
}
