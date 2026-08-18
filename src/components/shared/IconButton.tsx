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
      className={`neu-compact inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand ${
        active
          ? 'neu-compact-pressed bg-brand-light text-brand-dark'
          : 'text-ink-muted hover:bg-brand-light hover:text-brand-dark hover:neu-compact-hover'
      } ${className}`}
    >
      {children}
    </button>
  )
}
