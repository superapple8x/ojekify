import { Link } from 'react-router-dom'
import { Button } from '../components'
import { QuickActions } from '../flows/home/QuickActions'
import { RecentOrders } from '../flows/home/RecentOrders'
import { WallOfFame } from '../flows/home/WallOfFame'

export default function Home() {
  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-8">
      <section className="pt-4 text-center sm:pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bandingkan, kirim, <span className="text-brand-500">selesai</span> 🛺
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Harga jek, antar barang, dan cetak dokumen dari provider kampus ternama — transparan,
          tanpa biaya tersembunyi.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/bandingkan">
            <Button>💸 Bandingkan harga</Button>
          </Link>
          <Link to="/cetak">
            <Button variant="outline">🖨️ Cetak &amp; antar</Button>
          </Link>
        </div>
      </section>

      <QuickActions />

      <RecentOrders />

      <WallOfFame />
    </div>
  )
}