import type { ReactNode } from 'react'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'

interface AdaptiveSurfaceProps {
  background: string
  children: ReactNode
  className?: string
  as?: keyof React.JSX.IntrinsicElements
  style?: React.CSSProperties
}

export default function AdaptiveSurface({
  background,
  children,
  className = '',
  as: Tag = 'div',
  style,
}: AdaptiveSurfaceProps) {
  const theme = useAdaptiveTheme(background)

  return (
    <Tag
      className={className}
      style={{ ...adaptiveVars(theme), background, ...style }}
    >
      {children}
    </Tag>
  )
}
