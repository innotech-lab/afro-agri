import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12)
    } else {
      map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [40, 40] })
    }
  }, [points, map])
  return null
}

export default function MapWidget({ points = [], height = 420, defaultCenter = [-3.38, 29.36], defaultZoom = 7 }) {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-terra-border dark:border-terra-forest">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 0 && <FitBounds points={points} />}
        {points.map((point, i) => (
          <Marker key={point.id ?? i} position={[point.lat, point.lng]}>
            <Popup>
              <div className="text-xs">
                {point.label && <p className="font-semibold">{point.label}</p>}
                {point.detail && <p className="text-gray-500 mt-0.5">{point.detail}</p>}
                <p className="text-gray-400 mt-0.5">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
