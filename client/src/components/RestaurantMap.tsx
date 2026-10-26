import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { MapView } from "@/components/Map";

interface RestaurantMapProps {
  address: string;
}

export function RestaurantMap({ address }: RestaurantMapProps) {
  const [located, setLocated] = useState(false);
  const [failed, setFailed] = useState(false);
  const cleanAddress = address.trim();

  useEffect(() => {
    setLocated(false);
    setFailed(false);
    if (!cleanAddress) return;
    const timeout = window.setTimeout(() => setFailed((current) => current || !located), 12000);
    return () => window.clearTimeout(timeout);
  }, [cleanAddress, located]);

  if (!cleanAddress) {
    return (
      <div className="map-placeholder" role="img" aria-label="Map area awaiting Sobha Restaurant's exact address">
        <div className="map-placeholder-lines" aria-hidden="true" />
        <div className="map-placeholder-note"><span className="map-pin-icon"><MapPin size={19} /></span><span>EXACT ADDRESS<br />TO BE ADDED</span></div>
        <p>Share Sobha’s address to place the map and directions here.</p>
      </div>
    );
  }

  return (
    <div className="map-stage">
      <div className={`map-canvas-shell${located ? " map-is-ready" : ""}`} aria-hidden={!located}>
        <MapView
          initialCenter={{ lat: 0, lng: 0 }}
          initialZoom={3}
          className="restaurant-google-map"
          onMapReady={(map) => {
            const maps = window.google?.maps;
            if (!maps) {
              setFailed(true);
              return;
            }
            const geocoder = new maps.Geocoder();
            geocoder.geocode({ address: cleanAddress }, (results, status) => {
              const result = results?.[0];
              if (status !== "OK" || !result?.geometry?.location) {
                setFailed(true);
                return;
              }
              map.setCenter(result.geometry.location);
              map.setZoom(15);
              new maps.marker.AdvancedMarkerElement({
                map,
                position: result.geometry.location,
                title: "Sobha Restaurant",
              });
              setLocated(true);
            });
          }}
        />
      </div>
      {!located && <div className="map-status-layer"><span className="map-pin-icon"><MapPin size={19} /></span><span>{failed ? "MAP COULD NOT FIND THIS ADDRESS" : "FINDING THE SOBHA TABLE"}</span>{failed && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`} target="_blank" rel="noreferrer">SEARCH MAPS <ArrowUpRight size={12} /></a>}</div>}
    </div>
  );
}
