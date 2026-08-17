import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useStore } from '../../store/useStore'
import BoardTopBar from './BoardTopBar'
import ListColumn from './ListColumn'
import AddListForm from './AddListForm'
import CardModal from '../card-modal/CardModal'
import BoardMenuDrawer from './BoardMenuDrawer'
import type { BoardFilter } from './FilterPanel'

const EMPTY_FILTER: BoardFilter = { labelIds: [], memberIds: [] }

export default function BoardView() {
  const { boardId = '' } = useParams()
  const store = useStore()
  const board = store.data.boards[boardId]
  const [search, setSearch] = useState('')
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [viewsOpen, setViewsOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter] = useState<BoardFilter>(EMPTY_FILTER)

  if (!board) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
        <p className="text-sm text-ink-muted">This board doesn't exist.</p>
        <Link to="/boards" className="text-sm font-semibold text-brand hover:underline">
          Back to boards
        </Link>
      </div>
    )
  }

  const lists = store.getLists(boardId)

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    if (type === 'LIST') {
      store.moveList(boardId, source.index, destination.index)
    } else {
      store.moveCard(result.draggableId, destination.droppableId, destination.index)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <BoardTopBar
        board={board}
        search={search}
        onSearch={setSearch}
        viewsOpen={viewsOpen}
        filterOpen={filterOpen}
        filter={filter}
        onOpenViews={() => setViewsOpen((o) => !o)}
        onOpenFilter={() => setFilterOpen((o) => !o)}
        onFilterChange={setFilter}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board-lists" type="LIST" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="scroll-slim flex h-full items-start gap-3 overflow-x-auto p-4"
              style={{
                background: board.background.startsWith('data:')
                  ? `url(${board.background}) center/cover no-repeat`
                  : board.background
                    ? `${board.background}`
                    : 'rgba(225,245,243,0.6)',
              }}
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(listProvided) => (
                    <div ref={listProvided.innerRef} {...listProvided.draggableProps} style={{ ...listProvided.draggableProps.style, transition: 'transform 200ms ease-out' }}>
                      <ListColumn
                        list={list}
                        dragHandleProps={listProvided.dragHandleProps}
                        search={search}
                        filter={filter}
                        onOpenCard={setOpenCardId}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <AddListForm boardId={boardId} />
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {openCardId && <CardModal cardId={openCardId} onClose={() => setOpenCardId(null)} />}
      <BoardMenuDrawer board={board} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
