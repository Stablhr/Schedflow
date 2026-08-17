export type Visibility = 'private' | 'workspace' | 'public'

export interface Member {
  id: string
  name: string
  color: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export type ShareRole = 'admin' | 'member' | 'observer'

export interface Share {
  id: string
  name: string
  role: ShareRole
}

export interface FileAttachment {
  id: string
  name: string
  type: 'file' | 'image'
  dataUrl: string
  size: number
  addedAt: string
}

export interface CommentItem {
  id: string
  authorId: string
  text: string
  reactions: Reactions
  createdAt: string
}

export interface ActivityItem {
  id: string
  text: string
  createdAt: string
}

export type Reactions = Record<string, number>

export type Cover = string | { type: 'image'; dataUrl: string } | null

export interface Board {
  id: string
  name: string
  description: string
  visibility: Visibility
  starred: boolean
  background: string
  createdAt: string
  updatedAt: string
  listOrder: string[]
  labels: Record<string, Label>
  shares: Share[]
}

export interface List {
  id: string
  boardId: string
  name: string
  assignee: string
  collapsed: boolean
  order: number
  cardOrder: string[]
}

export interface Card {
  id: string
  boardId: string
  listId: string
  title: string
  desc: string
  cover: Cover
  coverSize: 'large' | 'small'
  labelIds: string[]
  memberIds: string[]
  dueDate: string | null
  location: string
  watching: boolean
  archived: boolean
  done: boolean
  files: FileAttachment[]
  comments: CommentItem[]
  activity: ActivityItem[]
  createdAt: string
  updatedAt: string
}

export interface InboxItem {
  id: string
  text: string
  createdAt: string
}

export interface AppData {
  version: number
  boards: Record<string, Board>
  lists: Record<string, List>
  cards: Record<string, Card>
  inbox: InboxItem[]
  members: Record<string, Member>
  ui: {
    lastVisitedBoardId: string | null
  }
}

export const YOU_ID = 'member-you'

export const MEMBER_COLORS = ['#0DABA3', '#4AA8FF', '#FF8B5E', '#8B7CF6', '#33B27A', '#F6C453', '#FF5E6C']

export const LABEL_SWATCHES = [
  { name: 'Marketing', color: '#8B7CF6' },
  { name: 'Design', color: '#FF8B5E' },
  { name: 'Engineering', color: '#4AA8FF' },
  { name: 'Urgent', color: '#FF5E6C' },
  { name: 'Low priority', color: '#33B27A' },
] as const

export interface BoardTemplate {
  id: string
  name: string
  description: string
  swatch: string
  lists: string[]
  labels: { name: string; color: string }[]
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'A single empty list. Build whatever workflow you need.',
    swatch: '#0DABA3',
    lists: ['To Do'],
    labels: [],
  },
  {
    id: 'simple-project',
    name: 'Simple Project',
    description: 'Classic To Do → In Progress → Review → Done workflow.',
    swatch: '#4AA8FF',
    lists: ['To Do', 'In Progress', 'Review', 'Done'],
    labels: [...LABEL_SWATCHES],
  },
  {
    id: 'social-content',
    name: 'Social Media Content',
    description: 'Content approval pipeline from Pending to Done, with platform tags.',
    swatch: '#8B7CF6',
    lists: ['Pending', 'In Progress', 'Production Approval', 'Marketing Approval', 'For Posting', 'Scheduled', 'Done'],
    labels: [
      { name: 'Instagram', color: '#E1306C' },
      { name: 'Facebook', color: '#4AA8FF' },
      { name: 'Blog', color: '#8B7CF6' },
      { name: 'TikTok', color: '#7F7FD5' },
      { name: 'Story', color: '#33B27A' },
    ],
  },
]

export const BOARD_BACKGROUNDS = ['#0DABA3', '#0A8981', '#132A29', '#FF8B5E', '#33B27A', '#4AA8FF', '#8B7CF6', '#FF5E6C']

export const COVER_COLORS = ['#0DABA3', '#0A8981', '#132A29', '#FF8B5E', '#33B27A', '#4AA8FF', '#8B7CF6', '#F6C453', '#FF5E6C']

export function emptyData(): AppData {
  return {
    version: 1,
    boards: {},
    lists: {},
    cards: {},
    inbox: [],
    members: {
      [YOU_ID]: { id: YOU_ID, name: 'You', color: MEMBER_COLORS[0] },
    },
    ui: {
      lastVisitedBoardId: null,
    },
  }
}
