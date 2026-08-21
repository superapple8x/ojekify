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

const LIGHT_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const LIGHT_ATTRIB = '© OpenStreetMap'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_ATTRIB = '© OpenStreetMap © CARTO'

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

  // Init / destroy map
  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([center.lat, center.lng], zoom)

    const tiles = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      attribution: isDark ? DARK_ATTRIB : LIGHT_ATTRIB,
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    tileLayerRef.current = tiles

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!interactive) return
      onMarkerChange({ lat: e.latlng.lat, lng: e.latlng.lng })
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
        onMarkerChange({ lat: ll.lat, lng: ll.lng })
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
  }, [marker, interactive, onMarkerChange])

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

  // Enable/disable interaction
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (interactive) {
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      map.doubleClickZoom.enable()
    } else {
      map.dragging.disable()
      map.scrollWheelZoom.disable()
      map.doubleClickZoom.disable()
    }
  }, [interactive])

  // Invalidate size after container resizes / sheet opens
  useEffect(() => {
    const map = mapRef.current
    const el = containerRef.current
    if (!map || !el) return

    const invalidate = () => map.invalidateSize()

    // initial + after animation frame
    const raf = requestAnimationFrame(() => {
      invalidate()
      setTimeout(invalidate, 120)
    })

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => invalidate())
      observer.observe(el)
    }

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('h-64 w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800', className)}
      role="application"
      aria-label="Peta lokasi"
    />
  )
}
