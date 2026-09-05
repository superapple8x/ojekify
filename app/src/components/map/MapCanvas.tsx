import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'

export interface MapCanvasProps {
  center: { lat: number; lng: number }
  zoom?: number
  marker: { lat: number; lng: number } | null
  onMarkerChange: (pos: { lat: number; lng: number }) => void
  className?: string
  interactive?: boolean
}

// CartoDB basemaps for both themes (same provider family, free with
// attribution): Voyager (light) + dark_all (dark). Both support {s}
// subdomains and {r} retina tiles — OSM's tile.openstreetmap.org supports
// neither, so it can't do retina without 404s.
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const LIGHT_ATTRIB = '© OpenStreetMap contributors © CARTO'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_ATTRIB = '© OpenStreetMap contributors © CARTO'

function createBrandIcon(): L.DivIcon {
  return L.divIcon({
    className: 'pilihjek-marker',
    html: '<span style="display:grid;place-items:center;width:32px;height:32px;background:#10b981;border:2px solid white;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:16px;line-height:1;">📍</span>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

export function MapCanvas({
  center,
  zoom = 15,
  marker,
  onMarkerChange,
  className,
  interactive = true,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const { isDark } = useTheme()

  // Latest-callback refs: Leaflet handlers are bound once (init / marker
  // creation), so they must read current props via refs instead of closures.
  const onMarkerChangeRef = useRef(onMarkerChange)
  const interactiveRef = useRef(interactive)
  useEffect(() => {
    onMarkerChangeRef.current = onMarkerChange
    interactiveRef.current = interactive
  })

  // Init / destroy map
  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      // Service area is Indralaya + surroundings — keep users from panning
      // to nowhere and getting lost. Markers themselves may still sit
      // outside (e.g. far GPS fix); the sheet's isFar guard handles that.
      minZoom: 12,
      maxBounds: L.latLngBounds(
        L.latLng(-3.3, 103.9),
        L.latLng(-2.5, 105.3),
      ),
      maxBoundsViscosity: 0.8,
    }).setView([center.lat, center.lng], zoom)

    const tiles = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: isDark ? DARK_ATTRIB : LIGHT_ATTRIB,
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    tileLayerRef.current = tiles

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!interactiveRef.current) return
      onMarkerChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', onClick)

    return () => {
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markerRef.current = null
    }
    // init once — center/zoom handled by separate effect, tiles by isDark effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tile switch on theme
  const prevIsDarkRef = useRef(isDark)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileLayerRef.current) return
    if (prevIsDarkRef.current === isDark) return
    prevIsDarkRef.current = isDark
    map.removeLayer(tileLayerRef.current)
    const next = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: isDark ? DARK_ATTRIB : LIGHT_ATTRIB,
      maxZoom: 19,
    }).addTo(map)
    tileLayerRef.current = next
  }, [isDark])

  // Marker management
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!marker) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    if (!markerRef.current) {
      const m = L.marker([marker.lat, marker.lng], {
        draggable: interactive,
        autoPan: true,
        icon: createBrandIcon(),
      }).addTo(map)
      m.on('dragend', () => {
        const ll = m.getLatLng()
        onMarkerChangeRef.current({ lat: ll.lat, lng: ll.lng })
      })
      markerRef.current = m
    } else {
      const ll = markerRef.current.getLatLng()
      if (ll.lat !== marker.lat || ll.lng !== marker.lng) {
        markerRef.current.setLatLng([marker.lat, marker.lng])
      }
      // update draggable state
      if (markerRef.current.dragging) {
        if (interactive) markerRef.current.dragging.enable()
        else markerRef.current.dragging.disable()
      }
    }
  // NOTE: onMarkerChange intentionally omitted — Leaflet handlers bound above
  // read it via onMarkerChangeRef, so including it would only churn
  // dragging state on every parent re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker, interactive])

  // Imperative setView when center prop changes externally (search/GPS)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const c = map.getCenter()
    const z = map.getZoom()
    const dLat = Math.abs(c.lat - center.lat)
    const dLng = Math.abs(c.lng - center.lng)
    if (dLat > 0.0001 || dLng > 0.0001 || z !== zoom) {
      map.setView([center.lat, center.lng], zoom, { animate: true })
    }
  }, [center.lat, center.lng, zoom])

  // Enable/disable interaction (all handlers — a partial toggle would still
  // let touch/keyboard users move a supposedly static map)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (interactive) {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
      map.touchZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
    } else {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
      map.touchZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
    }
  }, [interactive])

  // Invalidate size after container resizes / sheet opens.
  // The Modal sheet animates slide-up 0.32s — measuring mid-transform yields
  // a wrong size and grey tiles, so invalidate once early (first paint) and
  // once after the animation settles. The ResizeObserver is a debounced
  // follow-up for later resizes (keyboard, rotation).
  useEffect(() => {
    const map = mapRef.current
    const el = containerRef.current
    if (!map || !el) return

    let disposed = false
    const timeouts: number[] = []
    const invalidate = () => {
      if (disposed || document.hidden) return
      map.invalidateSize()
    }

    const raf = requestAnimationFrame(() => {
      invalidate()
      timeouts.push(window.setTimeout(invalidate, 380))
    })

    let pending = false
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (pending) return
        pending = true
        timeouts.push(
          window.setTimeout(() => {
            pending = false
            invalidate()
          }, 100),
        )
      })
      observer.observe(el)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      timeouts.forEach((t) => window.clearTimeout(t))
      observer?.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('h-64 w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800', className)}
      role="region"
      aria-label="Peta lokasi"
    />
  )
}
