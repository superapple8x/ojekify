import { EmptyState } from '../components/EmptyState'

export function ComingSoon() {
  return (
    <EmptyState
      icon="🚧"
      title="Fitur ini sedang dibangun"
      description="Alur komparator, cetak & antar, provider, dan riwayat pesanan akan hadir di milestone berikutnya. Sementara itu, lihat-lihat UI kit di /story."
    />
  )
}