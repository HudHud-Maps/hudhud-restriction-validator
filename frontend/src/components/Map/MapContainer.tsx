/**
 * Main map container component
 */

import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import type { BaseLayerType, FilterState, ValidatedRestriction } from '../../types';
import { tileLayers, defaultCenter, defaultZoom, saudiBounds } from '../../config/tiles';
import { MarkerCluster } from './MarkerCluster';

interface MapContainerProps {
  baseLayer: BaseLayerType;
  restrictions: ValidatedRestriction[];
  filters: FilterState;
  highlightedId: number | null;
  onBoundsChange: (bbox: [number, number, number, number]) => void;
}

export interface MapContainerRef {
  flyTo: (lat: number, lon: number, zoom?: number) => void;
}

// Component to handle map events
function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: [number, number, number, number]) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      onBoundsChange(bbox);
    },
    load: () => {
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      onBoundsChange(bbox);
    },
  });

  // Trigger initial bounds
  useEffect(() => {
    const bounds = map.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    onBoundsChange(bbox);
  }, [map, onBoundsChange]);

  return null;
}

// Component to fly to a highlighted restriction
// Uses zoom 19 to ensure individual markers are visible (clustering disables at 18)
function FlyToRestriction({
  restriction,
}: {
  restriction: ValidatedRestriction | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (restriction?.location) {
      map.flyTo([restriction.location.lat, restriction.location.lon], 19, {
        duration: 1,
      });
    }
  }, [map, restriction]);

  return null;
}

// Component to capture map instance for external control
function MapController({
  mapInstanceRef,
}: {
  mapInstanceRef: React.MutableRefObject<LeafletMap | null>;
}) {
  const map = useMap();

  useEffect(() => {
    mapInstanceRef.current = map;
  }, [map, mapInstanceRef]);

  return null;
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(function MapContainer(
  {
    baseLayer,
    restrictions,
    filters,
    highlightedId,
    onBoundsChange,
  },
  ref
) {
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileConfig = tileLayers[baseLayer] || tileLayers.grayscale;

  // Expose flyTo method via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lon: number, zoom: number = 17) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lon], zoom, { duration: 1 });
      }
    },
  }), []);

  // Filter restrictions based on filter state
  const filteredRestrictions = restrictions.filter((r) => {
    if (r.status === 'ok' && !filters.showOk) return false;
    if (r.status === 'warning' && !filters.showWarnings) return false;
    if (r.status === 'error' && !filters.showErrors) return false;
    if (filters.restrictionType && r.restriction_type !== filters.restrictionType) return false;
    return true;
  });

  const highlightedRestriction = highlightedId
    ? restrictions.find((r) => r.id === highlightedId) || null
    : null;

  // Saudi Arabia bounds for restricting the map view
  const maxBounds: [[number, number], [number, number]] = [
    [saudiBounds.south, saudiBounds.west], // Southwest corner
    [saudiBounds.north, saudiBounds.east], // Northeast corner
  ];

  return (
    <LeafletMapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="map-container"
      style={{ height: '100%', width: '100%' }}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      minZoom={6}
    >
      <TileLayer
        url={tileConfig.url}
        attribution={tileConfig.attribution}
        maxZoom={tileConfig.maxZoom}
      />
      <MapController mapInstanceRef={mapInstanceRef} />
      <MapEventHandler onBoundsChange={onBoundsChange} />
      <FlyToRestriction restriction={highlightedRestriction} />
      <MarkerCluster restrictions={filteredRestrictions} highlightedId={highlightedId} />
    </LeafletMapContainer>
  );
});

