import { useState, useRef } from 'react'
import { Download, Upload, FileJson, CheckCircle2, XCircle, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { SocialPost } from '../../store/schema'
import Button from '../shared/Button'

interface ImportResult {
  success: number
  skipped: number
  errors: string[]
}

export default function ImportExportPanel({ onClose }: { onClose: () => void }) {
  const { socialPosts, addSocialPost } = useStore()
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportAll = () => {
    setExporting(true)
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      posts: socialPosts,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedflow-social-posts-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleExportSingle = (post: SocialPost) => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      posts: [post],
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `social-post-${post.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!data || typeof data !== 'object' || !Array.isArray(data.posts)) {
          setImportResult({ success: 0, skipped: 0, errors: ['Invalid file format. Expected { posts: SocialPost[] }'] })
          return
        }

        let success = 0
        let skipped = 0
        const errors: string[] = []
        const existingIds = new Set(socialPosts.map((p) => p.id))

        for (const post of data.posts) {
          if (existingIds.has(post.id)) {
            skipped++
            continue
          }
          try {
            addSocialPost({
              ...post,
              id: undefined as unknown as string, // Let addSocialPost generate new ID
              status: 'draft',
              createdAt: post.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            success++
          } catch (err) {
            errors.push(`Failed to import "${post.title ?? 'untitled'}": ${err instanceof Error ? err.message : 'unknown error'}`)
          }
        }

        setImportResult({ success, skipped, errors })
      } catch {
        setImportResult({ success: 0, skipped: 0, errors: ['Could not parse JSON file.'] })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-[#0f1a19]/50" onClick={onClose} />
      <div className="animate-in relative z-10 w-full max-w-md rounded-[14px] border border-border bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Import / Export</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Export */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">Export</h3>
            <div className="mt-2 space-y-2">
              <Button variant="secondary" onClick={handleExportAll} disabled={exporting} className="w-full">
                <Download size={14} />
                Export All ({socialPosts.length} posts)
              </Button>
              {socialPosts.length > 0 && (
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {socialPosts.slice(0, 10).map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => handleExportSingle(post)}
                      className="flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-left transition-colors hover:bg-surface-alt"
                    >
                      <FileJson size={13} className="shrink-0 text-text-muted" />
                      <span className="truncate text-[12px] text-text-primary">{post.title || 'Untitled'}</span>
                      <Download size={11} className="ml-auto shrink-0 text-text-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Import */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">Import</h3>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload size={14} />
                Import from JSON
              </Button>
              <p className="mt-1 text-[10px] text-text-muted">
                Imported posts are saved as drafts to prevent accidental publishing.
              </p>
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`rounded-lg border p-3 ${
              importResult.errors.length > 0 ? 'border-warning bg-warning-subtle' : 'border-success bg-success-subtle'
            }`}>
              <div className="flex items-center gap-2">
                {importResult.errors.length > 0 ? (
                  <XCircle size={14} className="text-warning-text" />
                ) : (
                  <CheckCircle2 size={14} className="text-success-text" />
                )}
                <span className="text-xs font-medium text-text-primary">Import Complete</span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">
                {importResult.success} imported, {importResult.skipped} skipped (duplicates)
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-[10px] text-danger-text">{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
