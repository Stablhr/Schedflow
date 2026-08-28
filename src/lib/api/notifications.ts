import { api } from './client'
import type { TaskNotification } from '../../store/schema'

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
        ).toString()
      : ''
    return api.get<TaskNotification[]>(`/notifications${query}`)
  },
  markRead: (id: string) => api.post<TaskNotification>(`/notifications`, { id }),
}

export type { TaskNotification }
