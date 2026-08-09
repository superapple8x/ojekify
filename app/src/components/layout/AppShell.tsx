import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ToastStack } from '../ToastStack'
import { useAppToasts } from '../../hooks/useAppToasts'

export function AppShell() {
  const { toasts, dismiss } = useAppToasts()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-6">
        <Outlet />
      </main>
      <Footer />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}