import { Link } from 'react-router-dom'
import { NAV_LINKS } from './navItems'

const COMMUNITY_LINKS = [
  { label: 'Wall of Fame', to: '/provider' },
  { label: 'Dispute & Bantuan', to: '/pesanan' },
]

export function Footer() {
  return (
    <footer className="border-t border-neutral-200/70 bg-white dark:border-neutral-800/70 dark:bg-neutral-950">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="flex items-center gap-2 text-lg font-extrabold">
            <span aria-hidden>🛺</span> Pilih<span className="text-brand-500">Jek</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Komparator harga pintar untuk ojek, cetak & antar, dan jasa di lingkungan kampus.
            Bandingkan, hitung cas-nya, dan order lewat WhatsApp — tanpa ribet.
          </p>
        </div>

        <nav aria-label="Layanan">
          <p className="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Layanan
          </p>
          <ul className="mt-3 space-y-2">
            {NAV_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Komunitas
          </p>
          <ul className="mt-3 space-y-2">
            {COMMUNITY_LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-600 dark:text-neutral-300 dark:hover:text-brand-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-200/70 dark:border-neutral-800/70">
        <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-neutral-400 dark:text-neutral-500 sm:px-6">
          © 2026 PilihJek. Dibuat dengan ❤️ untuk kehidupan kampus.
        </p>
      </div>
    </footer>
  )
}