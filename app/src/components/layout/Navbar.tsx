import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../Button'
import { KampusKoinBadge } from './KampusKoinBadge'
import { NAV_LINKS } from './navItems'
import { cn } from '../../lib/cn'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg shadow-md shadow-brand-500/30"
        aria-hidden
      >
        🛺
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Pilih<span className="text-brand-500">Jek</span>
      </span>
    </Link>
  )
}

export function Navbar() {
  const { isDark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md dark:border-neutral-800/70 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/profil"
            aria-label="Profil — saldo KampusKoin & voucher"
            className="transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            <KampusKoinBadge compact />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="h-10 w-10 rounded-full p-0"
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full p-0 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h10" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-neutral-200/70 px-4 pb-4 pt-2 animate-fade-in lg:hidden dark:border-neutral-800/70"
          aria-label="Menu seluler"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}