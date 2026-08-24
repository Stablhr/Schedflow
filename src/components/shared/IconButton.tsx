import type { ReactNode } from 'react'

interface IconButtonProps {
  children: ReactNode
  onClick?: () => void
  title?: string
  className?: string
  disabled?: boolean
  ariaLabel?: string
  active?: boolean
  style?: React.CSSProperties
}

/** Shared square icon button — Design.md §15.5/§15.7. Flat, subtle hover, semantic active state. */
export default function IconButton({
  children,
  onClick,
  title,
  className = '',
  disabled,
  ariaLabel,
  active,
  style,
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
      onClick={onClick}
      disabled={disabled}
      style={style}
      aria-pressed={active || undefined}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
        active
          ? 'bg-primary-subtle text-primary-hover'
          : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
      } ${className}`}
    >
      {children}
    </button>
  )
}
