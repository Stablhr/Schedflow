import { useMemo } from 'react'
import { getAccessibleColors } from '../utils/contrast'
import type { AdaptiveColorResult } from '../utils/contrast'

export function useAdaptiveTheme(backgroundColor: string): AdaptiveColorResult {
  return useMemo(() => getAccessibleColors(backgroundColor), [backgroundColor])
}

export function adaptiveVars(theme: AdaptiveColorResult): React.CSSProperties {
  return {
    '--surface-text': theme.foreground,
    '--surface-text-muted': theme.foregroundMuted,
    '--surface-text-faint': theme.foregroundFaint,
    '--surface-border': theme.border,
    '--surface-icon': theme.icon,
    '--surface-bg-subtle': theme.surface,
  } as React.CSSProperties
}
