import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Use solid background instead of glass — for modals nested inside glass panels */
  solid?: boolean
}

export default function Modal({ open, onClose, children, className = '', solid = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6 md:p-8">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`animate-in relative z-10 flex h-full w-full flex-col overflow-hidden ${solid ? 'bg-surface shadow-lg' : 'glass-panel'} ${className}`}>{children}</div>
    </div>
  )
}
