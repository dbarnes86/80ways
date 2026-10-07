import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { GameSync } from '@/components/GameSync'
import { Toaster } from '@/components/toast'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import Landing from './pages/Landing'
import Onboard from './pages/Onboard'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import ActivityHistory from './pages/ActivityHistory'
import Leaderboard from './pages/Leaderboard'
import Raids from './pages/Raids'
import Store from './pages/Store'
import Profile from './pages/Profile'
import Membership from './pages/Membership'
import ResetPassword from './pages/ResetPassword'
import { Privacy, Terms } from './pages/Legal'
import NotFound from './pages/NotFound'

const app = (page: JSX.Element) => (
  <ProtectedRoute>
    <Layout>{page}</Layout>
  </ProtectedRoute>
)

const App = () => (
  <AuthProvider>
    <GameSync />
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

        <Route path="/dashboard" element={app(<Dashboard />)} />
        <Route path="/map" element={app(<MapPage />)} />
        <Route path="/activity-history" element={app(<ActivityHistory />)} />
        <Route path="/leaderboard" element={app(<Leaderboard />)} />
        <Route path="/raids" element={app(<Raids />)} />
        <Route path="/store" element={app(<Store />)} />
        <Route path="/profile" element={app(<Profile />)} />
        <Route path="/membership" element={app(<Membership />)} />
        <Route path="/stages" element={<Navigate to="/leaderboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
