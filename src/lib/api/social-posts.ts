import { api } from './client'
import type { SocialPost } from '../../store/schema'

export const socialPostsApi = {
  list: (params?: { status?: string; platform?: string; date?: string }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<SocialPost[]>(`/social-posts${query}`)
  },
  get: (id: string) => api.get<SocialPost>(`/social-posts/${id}`),
  create: (post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<SocialPost>('/social-posts', post),
  update: (id: string, patch: Partial<SocialPost>) =>
    api.put<SocialPost>(`/social-posts/${id}`, patch),
  delete: (id: string) => api.delete(`/social-posts/${id}`),
}
