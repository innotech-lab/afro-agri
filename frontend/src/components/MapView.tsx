import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// Fix default icon paths (not used here but avoids leaflet warnings)
delete (L.Icon.Default.prototype as any)._getIconUrl;

type Scan = { id: string; latitude: number; longitude: number; predicted_label: string; corrected_label: string | null; crop: string; created_at: string };

export default function MapView({ scans }: { scans: Scan[] }) {
  // Center on Burundi/Rwanda border region
  const center: [number, number] = [-2.6, 29.9];

  useEffect(() => {
    // ensure leaflet css loads
  }, []);

  return (
    <MapContainer center={center} zoom={7} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='© OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {scans.map((s) => {
        const label = s.corrected_label || s.predicted_label;
        const color = /healthy/i.test(label) ? "#3a7d44" : /blight|rust|mosaic|anthrac/i.test(label) ? "#c0392b" : "#e67e22";
        return (
          <CircleMarker key={s.id} center={[s.latitude, s.longitude]} radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 1 }}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{label}</div>
                <div>{s.crop}</div>
                <div className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
