import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from '@/contexts/AuthContext'
import { GameSync } from '@/components/GameSync'
import { Toaster } from '@/components/toast'
import { RewardLayer } from '@/game/RewardLayer'
import { Gate } from '@/game/Gate'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

const Onboard = lazy(() => import('./pages/Onboard'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MapPage = lazy(() => import('./pages/MapPage'))
const ActivityHistory = lazy(() => import('./pages/ActivityHistory'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Raids = lazy(() => import('./pages/Raids'))
const Store = lazy(() => import('./pages/Store'))
const Profile = lazy(() => import('./pages/Profile'))
const Membership = lazy(() => import('./pages/Membership'))
const Quests = lazy(() => import('./pages/Quests'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })))

function PageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading" />
    </div>
  )
}

const app = (page: JSX.Element) => (
  <ProtectedRoute>
    <Layout>{page}</Layout>
  </ProtectedRoute>
)

const App = () => (
  <AuthProvider>
    <GameSync />
    <Toaster />
    <RewardLayer />
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

        <Route path="/dashboard" element={app(<Dashboard />)} />
        <Route path="/map" element={app(<Gate feature="map"><MapPage /></Gate>)} />
        <Route path="/activity-history" element={app(<ActivityHistory />)} />
        <Route path="/leaderboard" element={app(<Gate feature="ranks"><Leaderboard /></Gate>)} />
        <Route path="/raids" element={app(<Gate feature="raids"><Raids /></Gate>)} />
        <Route path="/store" element={app(<Gate feature="store"><Store /></Gate>)} />
        <Route path="/profile" element={app(<Profile />)} />
        <Route path="/membership" element={app(<Membership />)} />
        <Route path="/quests" element={app(<Gate feature="quests"><Quests /></Gate>)} />
        <Route path="/stages" element={<Navigate to="/leaderboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  </AuthProvider>
)

export default App
