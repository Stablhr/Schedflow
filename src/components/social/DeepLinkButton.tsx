import { ExternalLink } from 'lucide-react'
import type { Platform } from '../../store/schema'
import { PLATFORM_COLORS } from '../../store/schema'
import { openPlatformApp, PLATFORM_LABELS } from '../../utils/deepLinks'
import PlatformIcon from './PlatformIcon'

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
      <PlatformIcon platform={platform} size={13} />
      {PLATFORM_LABELS[platform]}
      <ExternalLink size={10} className="opacity-70" />
    </button>
  )
}
