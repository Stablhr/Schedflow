import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function Modal({ open, onClose, children, className = '' }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4 sm:py-16">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-md" onClick={onClose} />
      <div className={`animate-in relative w-full ${className}`}>{children}</div>
    </div>
  )
}
