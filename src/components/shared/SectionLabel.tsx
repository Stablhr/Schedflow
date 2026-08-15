import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  icon?: ReactNode
}

export default function SectionLabel({ children, icon }: SectionLabelProps) {
  return (
    <h3 className="flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
      {icon}
      {children}
    </h3>
  )
}
