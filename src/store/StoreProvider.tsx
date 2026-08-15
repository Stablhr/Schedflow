import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Board, Card, List, Label } from './schema'
import { BOARD_TEMPLATES, emptyData } from './schema'
import { clearData, loadData, saveData } from './storage'
import { StoreContext } from './useStore'
import type { Store } from './useStore'
import { uid } from '../utils/id'

function patchRecord<T extends { id: string }>(
  rec: Record<string, T>,
  id: string,
  patch: Partial<T>,
): Record<string, T> {
  const item = rec[id]
  if (!item) return rec
  return { ...rec, [id]: { ...item, ...patch } }
}

const now = () => new Date().toISOString()

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [error, setError] = useState<string | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        saveData(dataRef.current)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save your changes.')
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [data])

  useEffect(() => {
    const flush = () => {
      try {
        saveData(dataRef.current)
      } catch {
        // best effort on unload
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  const dismissError = () => setError(null)

  const mutate = (fn: (draft: AppData) => AppData) => setData(fn)

  const getBoard = (id: string) => data.boards[id]
  const getCard = (id: string) => data.cards[id]

  const getLists = (boardId: string): List[] => {
    const board = data.boards[boardId]
    if (!board) return []
    return board.listOrder.map((id) => data.lists[id]).filter(Boolean)
  }

  const getCards = (listId: string): Card[] => {
    const list = data.lists[listId]
    if (!list) return []
    return list.cardOrder.map((id) => data.cards[id]).filter(Boolean)
  }

  const createBoard = (templateId: string, name: string): string => {
    const template = BOARD_TEMPLATES.find((t) => t.id === templateId) ?? BOARD_TEMPLATES[0]
    const boardId = uid()
    const labels: Record<string, Label> = {}
    template.labels.forEach((l) => {
      const id = uid()
      labels[id] = { id, name: l.name, color: l.color }
    })
    const lists: Record<string, List> = {}
    const listOrder: string[] = []
    template.lists.forEach((listName, order) => {
      const id = uid()
      lists[id] = { id, boardId, name: listName, assignee: '', collapsed: false, order, cardOrder: [] }
      listOrder.push(id)
    })
    const board: Board = {
      id: boardId,
      name,
      description: template.description,
      visibility: 'private',
      starred: false,
      background: template.swatch,
      createdAt: now(),
      updatedAt: now(),
      listOrder,
      labels,
    }
    mutate((prev) => ({
      ...prev,
      boards: { ...prev.boards, [boardId]: board },
      lists: { ...prev.lists, ...lists },
      ui: { ...prev.ui, lastVisitedBoardId: boardId },
    }))
    return boardId
  }

  const deleteBoard = (id: string) => {
    mutate((prev) => {
      const board = prev.boards[id]
      if (!board) return prev
      const listIds = new Set(board.listOrder)
      const lists: Record<string, List> = {}
      for (const [k, v] of Object.entries(prev.lists)) {
        if (!listIds.has(k)) lists[k] = v
      }
      const cards: Record<string, Card> = {}
      for (const [k, v] of Object.entries(prev.cards)) {
        if (!listIds.has(v.listId)) cards[k] = v
      }
      const boards = { ...prev.boards }
      delete boards[id]
      return {
        ...prev,
        boards,
        lists,
        cards,
        ui: {
          ...prev.ui,
          lastVisitedBoardId: prev.ui.lastVisitedBoardId === id ? null : prev.ui.lastVisitedBoardId,
        },
      }
    })
  }

  const renameBoard = (id: string, name: string) =>
    mutate((prev) => ({
      ...prev,
      boards: patchRecord(prev.boards, id, { name, updatedAt: now() }),
    }))

  const toggleStar = (id: string) =>
    mutate((prev) => {
      const board = prev.boards[id]
      if (!board) return prev
      return {
        ...prev,
        boards: patchRecord(prev.boards, id, { starred: !board.starred, updatedAt: now() }),
      }
    })

  const addList = (boardId: string, name: string) => {
    const id = uid()
    mutate((prev) => {
      const board = prev.boards[boardId]
      if (!board) return prev
      const list: List = { id, boardId, name, assignee: '', collapsed: false, order: board.listOrder.length, cardOrder: [] }
      return {
        ...prev,
        lists: { ...prev.lists, [id]: list },
        boards: { ...prev.boards, [boardId]: { ...board, listOrder: [...board.listOrder, id], updatedAt: now() } },
      }
    })
  }

  const renameList = (id: string, name: string) =>
    mutate((prev) => ({ ...prev, lists: patchRecord(prev.lists, id, { name }) }))

  const setListAssignee = (id: string, name: string) =>
    mutate((prev) => ({ ...prev, lists: patchRecord(prev.lists, id, { assignee: name }) }))

  const toggleListCollapsed = (id: string) =>
    mutate((prev) => {
      const list = prev.lists[id]
      if (!list) return prev
      return { ...prev, lists: patchRecord(prev.lists, id, { collapsed: !list.collapsed }) }
    })

  const deleteList = (id: string) => {
    mutate((prev) => {
      const list = prev.lists[id]
      if (!list) return prev
      const cardIds = new Set(list.cardOrder)
      const cards: Record<string, Card> = {}
      for (const [k, v] of Object.entries(prev.cards)) {
        if (!cardIds.has(k)) cards[k] = v
      }
      const lists = { ...prev.lists }
      delete lists[id]
      const board = prev.boards[list.boardId]
      if (!board) return { ...prev, lists, cards }
      return {
        ...prev,
        lists,
        cards,
        boards: {
          ...prev.boards,
          [list.boardId]: { ...board, listOrder: board.listOrder.filter((x) => x !== id), updatedAt: now() },
        },
      }
    })
  }

  const moveList = (boardId: string, startIndex: number, endIndex: number) => {
    mutate((prev) => {
      const board = prev.boards[boardId]
      if (!board) return prev
      const order = [...board.listOrder]
      const [moved] = order.splice(startIndex, 1)
      if (!moved) return prev
      order.splice(endIndex, 0, moved)
      return { ...prev, boards: { ...prev.boards, [boardId]: { ...board, listOrder: order, updatedAt: now() } } }
    })
  }

  const addCard = (listId: string, title: string): string => {
    const id = uid()
    mutate((prev) => {
      const list = prev.lists[listId]
      if (!list) return prev
      const card: Card = {
        id,
        boardId: list.boardId,
        listId,
        title,
        desc: '',
        cover: null,
        labelIds: [],
        memberIds: [],
        dueDate: null,
        location: '',
        watching: false,
        files: [],
        comments: [],
        reactions: {},
        activity: [],
        createdAt: now(),
        updatedAt: now(),
      }
      return {
        ...prev,
        cards: { ...prev.cards, [id]: card },
        lists: { ...prev.lists, [listId]: { ...list, cardOrder: [...list.cardOrder, id] } },
      }
    })
    return id
  }

  const deleteCard = (id: string) => {
    mutate((prev) => {
      const card = prev.cards[id]
      if (!card) return prev
      const cards = { ...prev.cards }
      delete cards[id]
      const list = prev.lists[card.listId]
      if (!list) return { ...prev, cards }
      return {
        ...prev,
        cards,
        lists: { ...prev.lists, [card.listId]: { ...list, cardOrder: list.cardOrder.filter((x) => x !== id) } },
      }
    })
  }

  const updateCard = (id: string, patch: Partial<Card>) =>
    mutate((prev) => ({ ...prev, cards: patchRecord(prev.cards, id, { ...patch, updatedAt: now() }) }))

  const moveCard = (cardId: string, destListId: string, destIndex: number) => {
    mutate((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev
      const srcListId = card.listId
      const src = prev.lists[srcListId]
      const dest = prev.lists[destListId]
      if (!src || !dest) return prev
      const srcOrder = src.cardOrder.filter((id) => id !== cardId)
      const destOrder =
        srcListId === destListId ? srcOrder : dest.cardOrder.filter((id) => id !== cardId)
      destOrder.splice(destIndex, 0, cardId)
      const movedText =
        srcListId === destListId
          ? 'moved this card within the list'
          : `moved this card to ${dest.name}`
      return {
        ...prev,
        lists: {
          ...prev.lists,
          [srcListId]: { ...src, cardOrder: srcOrder },
          [destListId]: { ...dest, cardOrder: destOrder },
        },
        cards: {
          ...prev.cards,
          [cardId]: {
            ...card,
            listId: destListId,
            updatedAt: now(),
            activity: [{ id: uid(), text: movedText, createdAt: now() }, ...card.activity],
          },
        },
      }
    })
  }

  const addActivity = (cardId: string, text: string) => {
    mutate((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...card,
            updatedAt: now(),
            activity: [{ id: uid(), text, createdAt: now() }, ...card.activity],
          },
        },
      }
    })
  }

  const addInboxItem = (text: string) =>
    mutate((prev) => ({ ...prev, inbox: [{ id: uid(), text, createdAt: now() }, ...prev.inbox] }))

  const dismissInboxItem = (id: string) =>
    mutate((prev) => ({ ...prev, inbox: prev.inbox.filter((i) => i.id !== id) }))

  const resetAll = () => {
    clearData()
    setData(emptyData())
  }

  const boards = useMemo(
    () => Object.values(data.boards).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.boards],
  )
  const members = useMemo(() => Object.values(data.members), [data.members])

  const value: Store = {
    data,
    error,
    dismissError,
    boards,
    members,
    getBoard,
    getLists,
    getCards,
    getCard,
    createBoard,
    deleteBoard,
    renameBoard,
    toggleStar,
    addList,
    renameList,
    setListAssignee,
    toggleListCollapsed,
    deleteList,
    moveList,
    addCard,
    deleteCard,
    updateCard,
    moveCard,
    addActivity,
    addInboxItem,
    dismissInboxItem,
    resetAll,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
