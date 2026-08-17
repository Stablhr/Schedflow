import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { StoreProvider } from './store/StoreProvider'
import { useStore } from './store/useStore'
import AppShell from './components/layout/AppShell'
import { LazyLoad } from './components/shared/LazyLoad'
import DashboardView from './components/dashboard/DashboardView'
import DashboardSkeleton from './components/dashboard/DashboardSkeleton'
import InboxView from './components/inbox/InboxView'
import InboxViewSkeleton from './components/inbox/InboxViewSkeleton'
import BoardsHome from './components/boards/BoardsHome'
import BoardsHomeSkeleton from './components/boards/BoardsHomeSkeleton'
import BoardView from './components/boards/BoardView'
import BoardViewSkeleton from './components/boards/BoardViewSkeleton'
import PlannerView from './components/planner/PlannerView'
import PlannerViewSkeleton from './components/planner/PlannerViewSkeleton'
import ContrastTestPage from './components/dev/ContrastTestPage'

function ErrorToast() {
  const { error, dismissError } = useStore()
  if (!error) return null
  return (
    <div className="animate-in fixed bottom-4 left-1/2 z-[60] flex max-w-md -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
      <AlertTriangle size={16} className="shrink-0 text-warn" />
      <span className="flex-1">{error}</span>
      <button
        type="button"
        onClick={dismissError}
        className="shrink-0 text-white/60 transition hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppShell>
          <Routes>
            <Route
              path="/"
              element={
                <LazyLoad skeleton={<DashboardSkeleton />}>
                  <DashboardView />
                </LazyLoad>
              }
            />
            <Route
              path="/inbox"
              element={
                <LazyLoad skeleton={<InboxViewSkeleton />}>
                  <InboxView />
                </LazyLoad>
              }
            />
            <Route
              path="/boards"
              element={
                <LazyLoad skeleton={<BoardsHomeSkeleton />}>
                  <BoardsHome />
                </LazyLoad>
              }
            />
            <Route
              path="/boards/:boardId"
              element={
                <LazyLoad skeleton={<BoardViewSkeleton />}>
                  <BoardView />
                </LazyLoad>
              }
            />
            <Route
              path="/planner"
              element={
                <LazyLoad skeleton={<PlannerViewSkeleton />}>
                  <PlannerView />
                </LazyLoad>
              }
            />
            <Route path="/dev/contrast" element={<ContrastTestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <ErrorToast />
      </StoreProvider>
    </BrowserRouter>
  )
}
