/**
 * Marker cluster component for grouping nearby restriction markers
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { ValidatedRestriction } from '../../types';
import { createRestrictionIcon } from './RestrictionMarker';
import { RestrictionPopup } from './RestrictionPopup';
import { createRoot } from 'react-dom/client';

interface MarkerClusterProps {
  restrictions: ValidatedRestriction[];
  highlightedId: number | null;
}

// Custom cluster icon that shows count with color based on worst status
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  
  // Determine cluster color based on worst status in cluster
  let hasError = false;
  let hasWarning = false;
  
  markers.forEach((marker) => {
    const status = (marker as L.Marker & { restriction?: ValidatedRestriction }).restriction?.status;
    if (status === 'error') hasError = true;
    if (status === 'warning') hasWarning = true;
  });
  
  let bgColor = '#22c55e'; // green for ok
  let borderColor = '#15803d';
  
  if (hasError) {
    bgColor = '#dc2626';
    borderColor = '#991b1b';
  } else if (hasWarning) {
    bgColor = '#f59e0b';
    borderColor = '#b45309';
  }
  
  // Size based on count
  let size = 36;
  if (count >= 100) size = 50;
  else if (count >= 10) size = 44;
  
  return L.divIcon({
    html: `
      <div class="cluster-marker" style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${count >= 100 ? '14px' : '16px'};
        font-weight: bold;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        ${count}
      </div>
    `,
    className: 'marker-cluster-custom',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

export function MarkerCluster({ restrictions, highlightedId }: MarkerClusterProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    // Create cluster group if not exists
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        iconCreateFunction: createClusterIcon,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 18,
        animate: true,
        animateAddingMarkers: false,
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;
    const currentMarkers = markersRef.current;
    const newRestrictionIds = new Set(restrictions.map((r) => r.id));

    // Remove markers that are no longer in the data
    currentMarkers.forEach((marker, id) => {
      if (!newRestrictionIds.has(id)) {
        clusterGroup.removeLayer(marker);
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    restrictions.forEach((restriction) => {
      if (!restriction.location) return;

      const isHighlighted = restriction.id === highlightedId;
      const existingMarker = currentMarkers.get(restriction.id);

      if (existingMarker) {
        // Update existing marker icon if highlight status changed
        const icon = createRestrictionIcon(restriction.status, isHighlighted, restriction.restriction_type);
        existingMarker.setIcon(icon);
      } else {
        // Create new marker with restriction type icon
        const icon = createRestrictionIcon(restriction.status, isHighlighted, restriction.restriction_type);
        const marker = L.marker([restriction.location.lat, restriction.location.lon], {
          icon,
        }) as L.Marker & { restriction?: ValidatedRestriction };

        // Store restriction data on marker for cluster icon coloring
        marker.restriction = restriction;

        // Create popup content
        const popupContainer = document.createElement('div');
        const root = createRoot(popupContainer);
        root.render(<RestrictionPopup restriction={restriction} />);

        marker.bindPopup(popupContainer, {
          maxWidth: 350,
          minWidth: 280,
        });

        clusterGroup.addLayer(marker);
        currentMarkers.set(restriction.id, marker);
      }
    });

    return () => {
      // Cleanup on unmount
    };
  }, [map, restrictions, highlightedId]);

  // Cleanup on component unmount
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    const markers = markersRef.current;
    return () => {
      if (clusterGroup) {
        map.removeLayer(clusterGroup);
        clusterGroupRef.current = null;
      }
      markers.clear();
    };
  }, [map]);

  return null;
}

