# PilihJek — Map-based Location Picker ("Jemput dari" / "Antar ke")

**Status:** In progress — §1 done, §2 done (2026-08-21), §3 done (2026-08-21), §4 done (2026-08-21), §5 done (2026-08-21), §6 done (2026-08-21), §7.1–7.6 done (2026-08-21), §8 done (2026-08-21), §9 done (2026-08-21), §10 remaining
**Scope:** Comparator `RouteStep`, Print flow `SummaryStep`, saved places, WA message generator
**Approved approach:** **Hybrid snap-to-zone** — free-form map + search + draggable pin + GPS; exact coords/label are kept for display & WhatsApp (incl. Google Maps link), while fares stay anchored to the nearest known zone so the pricing model is untouched structurally.

---

## 0. Context (why)

- Current selectors are native `<select>` dropdowns over 10 hardcoded zones (`app/src/api/zones.ts`) with **fake grid coords** `x`/`y`; distance = euclidean on that grid (`priceEngine.distanceKm`).
- Reference poster (`concept_and_design/price reference and location/locations_and_price.jpg`) is the real **Kuy Jek UNSRI Indralaya** tariff: route tiers 6K → 25K with real Indralaya-area place names (Griya Sejahtera, Pasar Pagi, Mutiara Indah, RS Arrayan, Stasiun Payakabung, Sakatiga…). Campus = **Universitas Sriwijaya, Indralaya** (~`-2.9117, 104.6471`).
- `whatsapp_generator.txt` §4 already specifies this feature: *"Students drop a pin for their location or choose from Saved Places… converts into a short text description and appends a Google Maps short-link directly into the WhatsApp message."*

### Key design decisions

| Decision | Choice | Rationale |
|---|---|---|
| Map library | `leaflet` + plain wrapper component (no react-leaflet) | No API key, ~40 KB, zero peer-dep friction with React 19 |
| Tiles | OSM standard (light) + CartoDB `dark_all` (dark mode via existing `useTheme`) | Free, no key |
| Geocoding | Photon (`photon.komoot.io`) — search + reverse | Free, CORS-enabled, no key, `lang=id`; wrapped as backend swap point |
| Pricing anchor | Snap every pick to nearest known zone (`zoneId`) | Fare tables per provider stay valid; pin position never changes price |
| Exact coords | Stored on the selection, used for display distance + WA maps link | Drivers get a real pinpoint in WhatsApp |

### New core type

```ts
export type PlaceSource = 'zone' | 'search' | 'pin' | 'gps' | 'saved'

export interface SelectedPlace {
  label: string    // primary line, e.g. "Griya Sejahtera" or POI name
  detail?: string  // secondary line from reverse geocode (street, city)
  lat: number
  lng: number
  zoneId: string   // nearest zone — pricing anchor
  source: PlaceSource
}
```

State migration rule of thumb: anywhere a raw `zoneId: string` was held for a user-chosen location → hold `SelectedPlace | null` instead. `QuoteRequest.pickupZoneId/dropoffZoneId` **stays as-is** (fed `place.zoneId`).

---

## 1. Dependencies

- [x] `npm install leaflet`
- [x] `npm install -D @types/leaflet`
- [x] Import `leaflet/dist/leaflet.css` once globally (e.g. top of `app/src/index.css` via `@import` or in `main.tsx`) and verify marker/popup styles render inside modals (Leaflet panes have low z-index by default — may need `.leaflet-pane { z-index: 1 }` guard inside our own stacking context so it stays under Modal's `z-50`).

## 2. Data model & mock data

- [x] `app/src/api/types.ts` — replace `Zone.x/y` with `lat: number; lng: number`; add `SelectedPlace` + `PlaceSource` types above.
- [x] `app/src/api/zones.ts` — real lat/lng for all 10 zones around UNSRI Indralaya; add exported `CAMPUS_CENTER = { lat: -2.9117, lng: 104.6471 }`. Suggested mapping (plausible coords, adjust freely):
  - `kampus-utama` 🏛️ Dalam Kampus → campus center
  - `fak-ekonomi` 💹 Fakultas Ekonomi (FEB) → ~-2.9085, 104.6505
  - `fak-teknik` 🔧 Fakultas Teknik → ~-2.9148, 104.6453
  - `perpustakaan` 📚 Perpustakaan Pusat → near center
  - `asrama-putih` 🛏️ Asrama (Dorm) → north edge of campus
  - `pasar-pagi` 🥬 Pasar Pagi → Pasar Indralaya area ~-2.925, 104.654
  - `alun-alun` 🌳 Alun-Alun Kota → Indralaya town ~-2.928, 104.657
  - `kost-mutiara` 🌸 Kost Mutiara Indah → Jln Mutiara Indah area
  - `griya-sejahtera` 🏠 Griya Sejahtera → Perum Griya Sejahtera
  - `rs-kampus` 🏥 RS Kampus → RS Unsrat/RS Arrayang area
- [x] Sanity-check: haversine between on-campus zones ≈ 0.3–1.5 km; to `luar` zones ≈ 1–15 km. Verified 2026-08-21: on-campus 0.40–0.91 km (kampus-utama→perpustakaan 0.06 near-center outlier), campus→luar 1.67–2.92 km; `npm run build` + `lint` clean.

## 3. Geo helpers & pricing recalibration

- [x] New `app/src/lib/geo.ts`: — done 2026-08-21
  - `distanceMeters(a: {lat,lng}, b: {lat,lng}): number` — haversine `R=6_371_000`.
  - `nearestZone(zones: Zone[], point: {lat,lng}): { zone: Zone; meters: number }` + `distanceKm` alias. Single source of truth; `priceEngine` re-exports.
- [x] `app/src/api/priceEngine.ts` — `distanceKm(from: Zone, to: Zone)` switches to haversine on `lat/lng` (signature unchanged; all call sites keep working). — done early in §2 for build viability (2026-08-21); refactored 2026-08-21 to import from `lib/geo.ts` (re-export for compat).
- [x] Recalibrate `FareBand.maxKm` in `app/src/api/providers.ts` — `1.2/2.5/INF` → `1.5/4/10/INF` to match haversine. Kuy Jek ride `6K/8K/15K/25K` + bumps (JekNgebut +500, KampusJek/PrintKuy/Bunda +1000, Mitra cheapest). Verified: kampus-utama→perpustakaan 0.06→6K, kampus→pasar-pagi 1.67→8K, campus→far 3.24→8K (Sakatiga >10km →15K/25K ready); `npm run build`+`lint` clean.
- [x] `estimatePrintDeliveryFee` (`app/src/api/print.ts`) — no signature change needed (still takes snapped `Zone | undefined`); confirmed kampus 6K+2K=8K, luar 8K+2K=10K 2026-08-21.

## 4. Geocoding service

- [x] New `app/src/lib/geocode.ts`: — done 2026-08-21
  - `searchPlaces(query: string, opts?: { signal?: AbortSignal; limit?: number; lat?: number; lng?: number }): Promise<GeocodeResult[]>` → `GET https://photon.komoot.io/api/?q=<q>&lat&lon&limit=6&lang=id` (bias near `CAMPUS_CENTER` when map context exists; `lat`/`lng` override for future map-center bias).
  - `reverseGeocode(lat: number, lng: number, opts?: { signal?: AbortSignal }): Promise<GeocodeResult | null>` → `/reverse?lat=&lon=&lang=id`.
  - Normalize Photon features → `{ label, detail, lat, lng }` (label = name/housenumber+street/street, detail = district/city|county/state, coords `geometry.coordinates=[lng,lat]` swapped).
  - Header comment: swap point for future backend geocoder proxy (public instance rate limits OK for demo).
  - Never throw to UI: catch network errors → return `[]` / `null`; empty/invalid inputs short-circuit. Verified: `npm run build`+`lint` clean, tsx smoke 9 asserts PASS (label fallback, error paths, limit/bias params).

## 5. Map components (`app/src/components/map/`)

- [x] New `MapCanvas.tsx` — thin Leaflet wrapper: — done 2026-08-21
  - Props: `center`, `zoom`, `marker: {lat,lng} | null`, `onMarkerChange(pos)`, `className`, `interactive?`.
  - Init `L.map` in effect; destroy on unmount; `invalidateSize()` after container resizes / when sheet opens.
  - TileLayer switch on `useTheme().isDark`: light `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, dark `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (+ attribution strings).
  - Draggable marker with custom brand-green `divIcon` (avoids default-marker asset URL issues under Vite); map click also moves marker; emit new position on `dragend`/click.
  - Imperative `setView` when `center` prop changes externally (search result selected, GPS acquired).
- [x] New `LocationPickerSheet.tsx` — picker UI rendered in existing `Modal` (bottom-sheet on mobile for free): — done 2026-08-21
  - Search input, debounced ~300 ms + AbortController; result rows show `label` + muted `detail`; Enter/click selects → moves marker, sets pending place.
  - Empty-query state: saved places list + "Zona populer" quick picks (tap = select that zone's coords, `source: 'zone'`).
  - "📍 Gunakan lokasi saya" button → `navigator.geolocation.getCurrentPosition` → move marker + reverse geocode; handle denied/unavailable with inline hint (no toast spam).
  - While dragging: debounce reverse geocode (~500 ms) → address caption under map ("📍 Jln. …").
  - Nearest-zone hint chip, live-updated: "Tarif dihitung dari zona terdekat: 🔧 Fakultas Teknik (± 350 m)".
  - Footer primary button "Gunakan lokasi ini" (disabled until position set) → `onChange({label, detail, lat, lng, zoneId, source})` → close.
- [x] New `LocationPicker.tsx` — trigger field styled exactly like current selects (`h-12 rounded-xl border-2 …`): shows `📍 {label}` + muted `detail` when set, placeholder otherwise; chevron; keyboard accessible (`<button>`); opens sheet. — done 2026-08-21
- [x] Export all three from `app/src/components/index.ts` + `app/src/components/map/index.ts`. — done 2026-08-21 (MapCanvas, LocationPicker, LocationPickerSheet)

## 6. Saved places

- [x] `app/src/hooks/useSavedPlaces.ts`: — done 2026-08-21
  - Extend `SavedPlace` to carry full place info: `{ id, label, detail?, lat, lng, zoneId }` (drop reliance on `source`).
  - `savePlace(label, place: SelectedPlace)`; dedupe by proximity (<50 m) instead of only `zoneId` so two pins in one zone can coexist if meaningfully different. (Keeps `string` zoneId overload for build-green until §7; strict `SelectedPlace` in §7.)
  - Migration: entries missing `lat/lng` resolve coords from `ZONES_BY_ID[zoneId]` at read time (fallback `CAMPUS_CENTER`; empty `[]` stays empty).
  - Update `DEFAULT_SAVED_PLACES` accordingly. Verified: `npm run build`+`lint` clean, smoke 14/14 PASS.
  - Also: `app/src/components/map/LocationPickerSheet.tsx:184` saved pick now uses `saved.lat/lng`+`detail`.

## 7. Comparator flow integration

- [x] `app/src/flows/comparator/types.ts` — draft becomes `pickup: SelectedPlace | null; dropoff: SelectedPlace | null`. Keep helper `conditionsFromDraft` untouched. — done 2026-08-21 (shim kept `conditionsFromDraft` untouched; `SelectedPlace` imported from `api/types.ts:30`)
- [x] `app/src/pages/Comparator.tsx` — update `EMPTY_DRAFT`, `canContinue` (both set && `pickup.zoneId !== dropoff.zoneId`), continue hint text, `<RouteStep>` props. — done 2026-08-21 (`EMPTY_DRAFT` → `pickup/dropoff: null`, subtitle → "tarif tetap dihitung dari zona terdekat", `RouteStep` now `pickup/dropoff: SelectedPlace | null`)
- [x] `app/src/flows/comparator/steps/RouteStep.tsx` — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-7c.md`):
  - Replace both `<select>` blocks with `<LocationPicker>` (grid `sm:grid-cols-2` preserved).
  - Same-zone validation now compares `pickup.zoneId === dropoff.zoneId` (message unchanged; maybe append "— geser pin sedikit atau pilih zona lain").
  - Route summary line uses resolved points (`distanceMeters` between actual selections, fallback zone coords): `{pickup.label} → {dropoff.label} ± X km`.
  - Swap button swaps whole `SelectedPlace` objects.
  - Save-place form saves the current pickup `SelectedPlace` (label editable as today).
- [x] `app/src/flows/comparator/ResultsView.tsx` — request builds `pickupZoneId: draft.pickup.zoneId`; summary strip shows `draft.pickup.label → draft.dropoff.label`; pass places down. — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-7d.md`)
- [x] `app/src/flows/comparator/ReceiptModal.tsx` — accepts zones today; switch to showing place labels (keep zone lookup for fare-band context if displayed). — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-7e.md`): destructure `pickupPlace/dropoffPlace`, resolve `pickupLabel/dropoffLabel` with zone fallback, strip now `{service.label} · {label} → {label} · {km}` ; `npm run build`+`lint` clean.
- [x] `app/src/flows/comparator/ProviderSheet.tsx` — build WA message with rich location lines (see §9); order history `pickupName/dropoffName` become `"{label} ({detail})"` or label-only fallback. — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-7f.md`): destructure `pickupPlace/dropoffPlace`, rich WA via `lib/waMessage.ts:pickupPlace/dropoffPlace` (`Jemput: {label} — {detail}\n🗺️ https://maps.google.com/?q=lat,lng`), history names `"{label} ({detail})"` fallback, strip+toast use `pickupUiLabel/dropoffUiLabel` with zone emoji fallback; `npm run build`+`lint` clean, smoke 14 asserts PASS.

## 8. Print flow integration

- [x] `app/src/flows/print/types.ts` — `deliverToZoneId: string` → `deliverTo: SelectedPlace | null`. — done 2026-08-21 (import `SelectedPlace` from `api/types.ts:30`; `EMPTY_PRINT_DRAFT.deliverTo: null`; see `Inbox/pilihjek-location-picker-tick-8a.md`)
- [x] `app/src/pages/Print.tsx` — prop rename passthrough. — done 2026-08-21 (`deliverToZoneId` → `deliverTo`; see `Inbox/pilihjek-location-picker-tick-8a.md`)
- [x] `app/src/flows/print/steps/SummaryStep.tsx`: — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-8b.md`)
  - Replace `<select>` with `<LocationPicker>`.
  - Estimate still calls `estimatePrintJob(draft, getZone(deliverTo.zoneId))` (snapped zone drives `area` fee tier — unchanged math).
  - "Ongkir ke …" line uses `deliverTo.label`.
  - Order/toast/WA use label + detail; disable state checks `!deliverTo`.

## 9. WA message enhancements (the payoff)

- [x] `app/src/lib/waMessage.ts` — done 2026-08-21: comparator side in §7.6 (see `Inbox/pilihjek-location-picker-tick-7f.md`), verified via tsx smoke 6/6 asserts PASS (rich link lines, detail-less head, byte-compat legacy across dash/pipe separators, dot-glue rule, fare-summary block) — see `Inbox/pilihjek-location-picker-tick-9a.md`; `formatPlaceWithMapsLink` exported at `app/src/lib/waMessage.ts:27` as shared helper.
- [x] `app/src/lib/printWaMessage.ts` — same treatment for `Antar ke` line. — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-9a.md`): optional `deliverToPlace?: SelectedPlace | null` (`printWaMessage.ts:8`), `Deliver To:` renders shared `formatPlaceWithMapsLink` when present, nil → byte-compat `deliverToName`; `SummaryStep.tsx:102` passes `deliverTo`; smoke 5/5 + `npm run build`/`lint` clean.
- [x] Manual diff-check of preview against each provider template style (`kuy-dash`, `ngebut-pipe`, `kampus-strict`, `print-pipe`, `bunda-arrow`, `mitra-dot`). — done 2026-08-21 (see `Inbox/pilihjek-location-picker-tick-9b.md`): 144/144 asserts PASS across 6 comparator templates + print fixed template; rich `— detail` + maps link, dot-glue/arrow/slash/dash/pipe all correct, legacy fallback byte-compat, detail-less head, fare-summary block.

## 10. Verification

- [ ] `npm run build` clean (tsc + vite).
- [ ] `npm run lint` clean.
- [ ] Manual matrix (`npm run dev`):
  - [ ] Comparator: pick via search / map tap+drag / GPS / saved place / quick-pick zone; confirm nearest-zone hint updates; confirm quote stable regardless of small pin moves within one zone.
  - [ ] Same-zone guard still triggers when both pins snap to one zone.
  - [ ] Print flow: picker works, estimate updates by snapped zone area, order records correct names.
  - [ ] WA preview contains Google Maps links; deep-link opens correctly.
  - [ ] Dark mode: dark tiles load; no z-index bleed over modal; sheet scroll OK on mobile viewport.
  - [ ] localStorage migration: old `pilihjek-saved-places` payload loads without crash.
  - [ ] Offline/error path: geocode failure degrades gracefully (empty results + hint), picker still usable via map/zones/GPS-less manual drag.

## Out of scope (explicitly)

- Review form free-text zone inputs (`ReviewForm.tsx`) — metadata only.
- Real routing/ETA (OSRM etc.), live driver tracking, address book sync.
- Backend geocoder proxy — documented as swap point in `geocode.ts`.
