import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, LocateOff, Loader2 } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#3b82f6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 3px rgba(59,130,246,0.35);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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

function FlyToUser({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 14, { duration: 1.2 })
  }, [position, map])
  return null
}

export default function MapWidget({ points = [], height = 420, defaultCenter = [-3.38, 29.36], defaultZoom = 7 }) {
  const [userPos, setUserPos] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [showUser, setShowUser] = useState(false)

  const toggleLocation = () => {
    if (showUser) {
      setShowUser(false)
      setUserPos(null)
      setLocError('')
      return
    }
    if (!navigator.geolocation) {
      setLocError('Géolocalisation non supportée')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy })
        setShowUser(true)
        setLocating(false)
      },
      () => {
        setLocError('Position refusée ou indisponible')
        setLocating(false)
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Toggle button */}
      <button
        onClick={toggleLocation}
        title={showUser ? 'Masquer ma position' : 'Me localiser'}
        className={`absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all
          ${showUser
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-white dark:bg-terra-dark text-terra-dark dark:text-terra-light hover:bg-terra-bg dark:hover:bg-terra-forest border border-terra-border dark:border-terra-forest'
          }`}
      >
        {locating
          ? <Loader2 size={13} className="animate-spin" />
          : showUser
            ? <LocateOff size={13} />
            : <LocateFixed size={13} />
        }
        {locating ? 'Localisation…' : showUser ? 'Ma position' : 'Me localiser'}
      </button>

      {/* Error */}
      {locError && (
        <div className="absolute top-14 right-3 z-[1000] bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded-lg shadow">
          {locError}
        </div>
      )}

      <div className="w-full h-full rounded-xl overflow-hidden border border-terra-border dark:border-terra-forest">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {points.length > 0 && !userPos && <FitBounds points={points} />}
          {userPos && <FlyToUser position={userPos} />}

          {/* Data markers */}
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

          {/* User location */}
          {showUser && userPos && (
            <>
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={userPos.acc}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
              />
              <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold text-blue-600">Ma position</p>
                    <p className="text-gray-500 mt-0.5">Précision : ~{Math.round(userPos.acc)} m</p>
                    <p className="text-gray-400">{userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
