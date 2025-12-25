/**
 * Main application component
 */

import { useState, useCallback } from 'react';
import type { BaseLayerType, FilterState } from './types';
import { MapContainer } from './components/Map/MapContainer';
import { LayerControl } from './components/Controls/LayerControl';
import { FilterPanel } from './components/Controls/FilterPanel';
import { SearchBox } from './components/Controls/SearchBox';
import { ErrorBanner } from './components/UI/ErrorBanner';
import { LoadingOverlay } from './components/UI/LoadingOverlay';
import { HelpButton } from './components/UI/HelpModal';
import { useRestrictions } from './hooks/useRestrictions';
import './styles/index.css';

export default function App() {
  // Map state
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('grayscale');
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [mapError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    showOk: true,
    showWarnings: true,
    showErrors: true,
    restrictionType: null,
  });

  // Fetch restrictions
  const { restrictions, meta, loading, error } = useRestrictions(bbox, {
    debounceMs: 500,
  });

  // Handlers
  const handleBoundsChange = useCallback((newBbox: [number, number, number, number]) => {
    setBbox(newBbox);
  }, []);

  const handleHighlightRestriction = useCallback((id: number | null) => {
    setHighlightedId(id);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">Turn Restriction Validator</h1>
        <div className="app-subtitle">OSM turn restriction analysis tool</div>
      </header>

      {/* Main content */}
      <div className="app-content">
        {/* Map */}
        <div className="map-wrapper">
          {mapError ? (
            <div style={{ padding: '20px', color: 'red' }}>Map Error: {mapError}</div>
          ) : (
            <MapContainer
              baseLayer={baseLayer}
              restrictions={restrictions}
              filters={filters}
              highlightedId={highlightedId}
              onBoundsChange={handleBoundsChange}
            />
          )}

          {/* Help button */}
          <HelpButton />

          {/* Loading overlay */}
          {loading && <LoadingOverlay />}

          {/* Error banner */}
          {error && <ErrorBanner message={error} />}
        </div>

        {/* Sidebar controls */}
        <aside className="sidebar">
          <LayerControl activeLayer={baseLayer} onLayerChange={setBaseLayer} />

          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            restrictions={restrictions}
            meta={meta}
          />

          <SearchBox restrictions={restrictions} onHighlight={handleHighlightRestriction} />

          {/* Info section */}
          <div className="info-section">
            <div className="control-title">About</div>
            <p className="info-text">
              This tool validates OSM turn restrictions in the current map view and highlights
              potential errors and warnings.
            </p>
            <p className="info-text">
              Click on a marker to see details and links to edit in OSM or JOSM.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

