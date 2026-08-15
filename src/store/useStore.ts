import { createContext, useContext } from 'react'
import type { AppData, Board, Card, List, Member } from './schema'

export interface Store {
  data: AppData
  error: string | null
  dismissError: () => void
  boards: Board[]
  members: Member[]
  getBoard: (id: string) => Board | undefined
  getLists: (boardId: string) => List[]
  getCards: (listId: string) => Card[]
  getCard: (id: string) => Card | undefined
  createBoard: (templateId: string, name: string) => string
  deleteBoard: (id: string) => void
  renameBoard: (id: string, name: string) => void
  toggleStar: (id: string) => void
  addList: (boardId: string, name: string) => void
  renameList: (id: string, name: string) => void
  setListAssignee: (id: string, name: string) => void
  toggleListCollapsed: (id: string) => void
  deleteList: (id: string) => void
  moveList: (boardId: string, startIndex: number, endIndex: number) => void
  addCard: (listId: string, title: string) => string
  deleteCard: (id: string) => void
  updateCard: (id: string, patch: Partial<Card>) => void
  moveCard: (cardId: string, destListId: string, destIndex: number) => void
  addActivity: (cardId: string, text: string) => void
  addInboxItem: (text: string) => void
  dismissInboxItem: (id: string) => void
  resetAll: () => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
