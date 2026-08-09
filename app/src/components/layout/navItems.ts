export interface NavItem {
  to: string
  label: string
}

export const NAV_LINKS: NavItem[] = [
  { to: '/', label: 'Beranda' },
  { to: '/bandingkan', label: 'Bandingkan' },
  { to: '/cetak', label: 'Cetak & Antar' },
  { to: '/provider', label: 'Provider' },
  { to: '/pesanan', label: 'Pesanan' },
]