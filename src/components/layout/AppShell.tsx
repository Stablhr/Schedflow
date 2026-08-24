import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="min-w-0 flex-1 overflow-hidden pb-16 md:pb-0">{children}</main>
    </div>
  )
}
