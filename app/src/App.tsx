import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Skeleton } from './components/Skeleton'
import { ComingSoon } from './pages/ComingSoon'

const Home = lazy(() => import('./pages/Home'))
const Story = lazy(() => import('./pages/Story'))
const Comparator = lazy(() => import('./pages/Comparator'))
const Print = lazy(() => import('./pages/Print'))
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'))
const Providers = lazy(() => import('./pages/Providers'))
const Orders = lazy(() => import('./pages/Orders'))
const Profile = lazy(() => import('./pages/Profile'))

function lazyPageFallback() {
  return (
    <div className="space-y-4" role="status" aria-label="Memuat halaman">
      <Skeleton className="h-10 w-1/2" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} variant="card" className="h-36" />
      ))}
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="story"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Story />
              </Suspense>
            }
          />
          <Route
            path="bandingkan"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Comparator />
              </Suspense>
            }
          />
          <Route
            path="cetak"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Print />
              </Suspense>
            }
          />
          <Route
            path="provider"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Providers />
              </Suspense>
            }
          />
          <Route
            path="provider/:id"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <ProviderProfile />
              </Suspense>
            }
          />
          <Route
            path="pesanan"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Orders />
              </Suspense>
            }
          />
          <Route
            path="profil"
            element={
              <Suspense fallback={lazyPageFallback()}>
                <Profile />
              </Suspense>
            }
          />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}