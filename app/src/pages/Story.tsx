import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Modal,
  ProviderAvatar,
  SkeletonLines,
  SkeletonProviderRow,
  Slider,
  StarRating,
  Stepper,
  Tag,
  TierBadge,
  Toggle,
} from '../components'

function SectionTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  )
}

function DemoRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

export default function Story() {
  const [rating, setRating] = useState(4)
  const [raining, setRaining] = useState(true)
  const [cashless, setCashless] = useState(true)
  const [portions, setPortions] = useState(6)
  const [topup, setTopup] = useState(50_000)
  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [chipSel, setChipSel] = useState('ride')
  const [chips, setChips] = useState(['Dorm A', 'Pasar Pagi'])
  const [loading, setLoading] = useState(false)

  const services = [
    { value: 'ride', label: '🚲 Ride' },
    { value: 'food', label: '🍜 Food Delivery' },
    { value: 'send', label: '📦 Send Item' },
    { value: 'print', label: '🖨️ Print' },
    { value: 'jasa', label: '⚙️ Jasa' },
  ] as const

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          UI Kit <span className="text-brand-500">PilihJek</span>
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Komponen shared untuk seluruh alur: komparator, WhatsApp generator, cetak & antar,
          dan reputasi. Semua mendukung light/dark mode dan mobile-first.
        </p>
      </header>

      <SectionTitle title="Button">
        <DemoRow>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Besar</Button>
          <Button loading={loading} onClick={() => setTimeout(() => setLoading(false), 1500)}>
            {loading ? 'Memproses...' : 'Coba loading'}
          </Button>
          <Button variant="ghost" loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </DemoRow>
      </SectionTitle>

      <SectionTitle title="Chip">
        <DemoRow>
          {services.map((service) => (
            <Chip
              key={service.value}
              selected={chipSel === service.value}
              onClick={() => setChipSel(service.value)}
            >
              {service.label}
            </Chip>
          ))}
          <Chip
            icon="📍"
            selected={false}
            onRemove={() => undefined}
          >
            Zona, tap ✕
          </Chip>
          <div className="flex gap-2">
            {chips.map((c) => (
              <Chip key={c} selected onRemove={() => setChips(chips.filter((x) => x !== c))}>
                {c}
              </Chip>
            ))}
          </div>
        </DemoRow>
      </SectionTitle>

      <SectionTitle title="Tag & Badge">
        <DemoRow>
          <Tag variant="brand">Cheapest!</Tag>
          <Tag variant="success">Fastest Respond</Tag>
          <Tag variant="warning">Sering Telat</Tag>
          <Tag variant="danger">Suka Minta Tambahan</Tag>
          <Tag variant="info">Anti-Nyasar</Tag>
          <Tag variant="neutral">Newbie</Tag>
          <Badge tone="brand">Baru</Badge>
          <Badge tone="danger">+3</Badge>
          <Badge tone="warning" dot>Hujan</Badge>
          <Badge tone="success" dot>Dibayar</Badge>
        </DemoRow>
      </SectionTitle>

      <SectionTitle title="Card">
        <Card interactive selected={false} padding="md" className="max-w-sm">
          <div className="flex items-center gap-3">
            <ProviderAvatar name="Kuy Jek" size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Kuy Jek</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Rp 9.000 • 4.8/5</p>
            </div>
            <Tag variant="brand">Cheapest!</Tag>
          </div>
        </Card>
        <Card padding="lg" className="max-w-sm">
          <p className="font-bold">Transparent Receipt</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Base fee, cas hujan, cas transfer… semua breakdown di sini.
          </p>
        </Card>
      </SectionTitle>

      <SectionTitle title="StarRating">
        <DemoRow>
          <StarRating value={4.8} />
          <StarRating value={4.8} size="lg" />
          <StarRating value={rating} onChange={setRating} />
          <Badge tone="brand">{rating}/5</Badge>
        </DemoRow>
      </SectionTitle>

      <SectionTitle title="Toggle">
        <Card className="max-w-sm space-y-4">
          <Toggle
            checked={raining}
            onChange={setRaining}
            label="Sedang hujan?"
            description="Menambahkan Cas Hujan ke tarif"
          />
          <Toggle
            checked={cashless}
            onChange={setCashless}
            label="Bayar e-wallet?"
            description="Menambahkan Cas Non-Tunai"
          />
          <Toggle checked={false} onChange={() => {}} label="Disabled" disabled />
        </Card>
      </SectionTitle>

      <SectionTitle title="Slider">
        <Card className="max-w-sm space-y-6 pb-4">
          <Slider
            min={1}
            max={20}
            value={portions}
            onChange={setPortions}
            label="Berapa porsi?"
            format={(v) => `${v} porsi`}
          />
          <Slider
            min={10_000}
            max={300_000}
            step={5_000}
            value={topup}
            onChange={setTopup}
            label="Top-up e-wallet"
            format={(v) => `Rp ${v.toLocaleString('id-ID')}`}
          />
        </Card>
      </SectionTitle>

      <SectionTitle title="Stepper">
        <Card className="max-w-lg">
          <Stepper
            steps={['Layanan', 'Rute', 'Ketentuan', 'Hasil']}
            current={step}
            onStepClick={setStep}
          />
        </Card>
      </SectionTitle>

      <SectionTitle title="Modal">
        <DemoRow>
          <Button onClick={() => setModalOpen(true)}>Buka Transparent Receipt</Button>
        </DemoRow>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Transparent Receipt"
          footer={
            <Button block onClick={() => setModalOpen(false)}>
              Order via WhatsApp
            </Button>
          }
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Base Fare</span><span>Rp 6.000</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Cas Hujan</span><span>Rp 1.000</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Cas Transfer</span><span>Rp 1.000</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Cas Item (6)</span><span>Rp 1.000</span></div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-extrabold dark:border-neutral-700">
              <span>TOTAL</span><span>Rp 9.000</span>
            </div>
          </div>
        </Modal>
      </SectionTitle>

      <SectionTitle title="Tier & Avatar">
        <DemoRow>
          <TierBadge tier="newbie" />
          <TierBadge tier="verified" />
          <TierBadge tier="legend" />
        </DemoRow>
        <DemoRow>
          <ProviderAvatar name="Kuy Jek" />
          <ProviderAvatar name="JekNgebut" />
          <ProviderAvatar name="PrintKuy" emoji="🖨️" />
          <ProviderAvatar name="KampusJek" size="lg" />
          <ProviderAvatar name="Kampung" size="xl" />
        </DemoRow>
      </SectionTitle>

      <SectionTitle title="EmptyState">
        <EmptyState
          icon="🗺️"
          title="Belum ada pesanan"
          description="Order pertama kamu lewat WhatsApp otomatis tercatat di sini."
          action={<Button>Baru Bandingin Harga</Button>}
        />
      </SectionTitle>

      <SectionTitle title="Skeleton">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <SkeletonLines lines={4} />
          </Card>
          <SkeletonProviderRow count={2} />
        </div>
      </SectionTitle>
    </div>
  )
}