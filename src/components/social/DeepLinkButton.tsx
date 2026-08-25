import { ExternalLink } from 'lucide-react'
import type { Platform } from '../../store/schema'
import { PLATFORM_COLORS } from '../../store/schema'
import { openPlatformApp, PLATFORM_LABELS } from '../../utils/deepLinks'

export default function DeepLinkButton({ platform, className = '' }: { platform: Platform; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openPlatformApp(platform)}
      aria-label={`Open in ${PLATFORM_LABELS[platform]}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] ${className}`}
      style={{ background: PLATFORM_COLORS[platform] }}
      title={`Open in ${PLATFORM_LABELS[platform]}`}
    >
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/20 text-[8px] font-bold" aria-hidden="true">
        {platform[0].toUpperCase()}
      </span>
      {PLATFORM_LABELS[platform]}
      <ExternalLink size={10} className="opacity-70" />
    </button>
  )
}
