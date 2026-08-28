import { api } from './client'

export interface Webhook {
  _id: string
  name: string
  url: string
  enabled: boolean
  secret: string
  events: string[]
  lastDeliveryAt?: string
  lastDeliveryStatus?: string
  createdAt: string
  updatedAt: string
}

export const WEBHOOK_EVENT_OPTIONS = [
  { value: 'post.scheduled', label: 'Post Scheduled' },
  { value: 'post.published', label: 'Post Published' },
  { value: 'post.failed', label: 'Post Failed' },
  { value: 'post.cancelled', label: 'Post Cancelled' },
] as const

export const webhooksApi = {
  list: () => api.get<Webhook[]>('/webhooks'),
  create: (input: { name: string; url: string; events: string[]; secret?: string }) =>
    api.post<Webhook>('/webhooks', input),
  update: (id: string, patch: Partial<Webhook>) =>
    api.put<Webhook>(`/webhooks?id=${id}`, patch),
  remove: (id: string) => api.delete<Webhook>(`/webhooks?id=${id}`),
}
