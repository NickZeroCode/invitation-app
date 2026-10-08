import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext.tsx'
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute.tsx'
import { AppShell } from './layout/AppShell.tsx'
import { ApiError } from './lib/api.ts'
import { LandingPage } from './pages/LandingPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { OverviewPage } from './pages/OverviewPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SignupPage } from './pages/SignupPage.tsx'
import { TemplatesPage } from './pages/TemplatesPage.tsx'
import { EventsPage } from './pages/EventsPage.tsx'
import { EventEditorPage } from './pages/EventEditorPage.tsx'
import { GuestsPage } from './pages/GuestsPage.tsx'
import { ResponsesPage } from './pages/ResponsesPage.tsx'
import { PublicInvitationPage } from './pages/PublicInvitationPage.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Client-side failures (4xx) are definitive — don't hammer the API.
        if (error instanceof ApiError && error.status < 500 && error.status !== 0) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/connexion"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/inscription"
              element={
                <GuestRoute>
                  <SignupPage />
                </GuestRoute>
              }
            />
            <Route path="/i/:token" element={<PublicInvitationPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/accueil" element={<OverviewPage />} />
              <Route path="/evenements" element={<EventsPage />} />
              <Route path="/evenements/nouveau" element={<EventEditorPage />} />
              <Route path="/evenements/:id" element={<EventEditorPage />} />
              <Route path="/evenements/:id/invitations" element={<GuestsPage />} />
              <Route path="/evenements/:id/reponses" element={<ResponsesPage />} />
              <Route path="/modeles" element={<TemplatesPage />} />
              <Route path="/parametres" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
