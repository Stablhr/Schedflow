import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useStore } from '../../store/useStore'
import BoardTopBar from './BoardTopBar'
import ListColumn from './ListColumn'
import AddListForm from './AddListForm'
import CardModal from '../card-modal/CardModal'

export default function BoardView() {
  const { boardId = '' } = useParams()
  const store = useStore()
  const board = store.data.boards[boardId]
  const [search, setSearch] = useState('')
  const [openCardId, setOpenCardId] = useState<string | null>(null)

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
      <BoardTopBar board={board} search={search} onSearch={setSearch} />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board-lists" type="LIST" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="scroll-slim flex h-full items-start gap-3 overflow-x-auto p-4"
              style={{ background: 'rgba(225,245,243,0.6)' }}
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(listProvided) => (
                    <div ref={listProvided.innerRef} {...listProvided.draggableProps}>
                      <ListColumn
                        list={list}
                        dragHandleProps={listProvided.dragHandleProps}
                        search={search}
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
    </div>
  )
}
