import type { ReactNode } from 'react'

interface IconButtonProps {
  children: ReactNode
  onClick?: () => void
  title?: string
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

export default function IconButton({
  children,
  onClick,
  title,
  className = '',
  disabled,
  ariaLabel,
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}
