/**
 * Main map container component
 */

import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { BaseLayerType, FilterState, ValidatedRestriction } from '../../types';
import { tileLayers, defaultCenter, defaultZoom } from '../../config/tiles';
import { MarkerCluster } from './MarkerCluster';

interface MapContainerProps {
  baseLayer: BaseLayerType;
  restrictions: ValidatedRestriction[];
  filters: FilterState;
  highlightedId: number | null;
  onBoundsChange: (bbox: [number, number, number, number]) => void;
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
function FlyToRestriction({
  restriction,
}: {
  restriction: ValidatedRestriction | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (restriction?.location) {
      map.flyTo([restriction.location.lat, restriction.location.lon], 17, {
        duration: 1,
      });
    }
  }, [map, restriction]);

  return null;
}

export function MapContainer({
  baseLayer,
  restrictions,
  filters,
  highlightedId,
  onBoundsChange,
}: MapContainerProps) {
  const tileConfig = tileLayers[baseLayer] || tileLayers.grayscale;

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

  return (
    <LeafletMapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="map-container"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url={tileConfig.url}
        attribution={tileConfig.attribution}
        maxZoom={tileConfig.maxZoom}
      />
      <MapEventHandler onBoundsChange={onBoundsChange} />
      <FlyToRestriction restriction={highlightedRestriction} />
      <MarkerCluster restrictions={filteredRestrictions} highlightedId={highlightedId} />
    </LeafletMapContainer>
  );
}

