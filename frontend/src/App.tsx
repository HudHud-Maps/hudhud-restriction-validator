/**
 * Main application component
 */

import { useState, useCallback, useRef } from 'react';
import type { BaseLayerType, FilterState, ValidatedRestriction, RestrictionResponse } from './types';
import { MapContainer, MapContainerRef } from './components/Map/MapContainer';
import { LayerControl } from './components/Controls/LayerControl';
import { FilterPanel } from './components/Controls/FilterPanel';
import { SearchBox } from './components/Controls/SearchBox';
import { ErrorBanner } from './components/UI/ErrorBanner';
import { LoadingOverlay } from './components/UI/LoadingOverlay';
import { HelpButton } from './components/UI/HelpModal';
import { useRestrictions } from './hooks/useRestrictions';
import { ApiService } from './services/api';
import './styles/index.css';

export default function App() {
  // Map ref for flying to locations
  const mapRef = useRef<MapContainerRef>(null);

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

  // SA-wide issues state
  const [saIssues, setSaIssues] = useState<ValidatedRestriction[] | null>(null);
  const [saIssuesMeta, setSaIssuesMeta] = useState<RestrictionResponse['meta'] | null>(null);
  const [saLoading, setSaLoading] = useState(false);
  const [saError, setSaError] = useState<string | null>(null);

  // Fetch restrictions for current view
  const { restrictions: viewRestrictions, meta: viewMeta, loading: viewLoading, error: viewError, clearCacheAndRefetch } = useRestrictions(bbox, {
    debounceMs: 500,
  });

  // Use SA issues if loaded, otherwise use view restrictions
  const restrictions = saIssues || viewRestrictions;
  const meta = saIssuesMeta || viewMeta;
  const loading = saLoading || viewLoading;
  const error = saError || viewError;

  // Handlers
  const handleBoundsChange = useCallback((newBbox: [number, number, number, number]) => {
    setBbox(newBbox);
  }, []);

  const handleHighlightRestriction = useCallback((id: number | null) => {
    setHighlightedId(id);
  }, []);

  // Handle flying to a restriction found via search (outside current view)
  // Use zoom 19 to ensure we're past the clustering threshold (18)
  const handleFlyToRestriction = useCallback((restriction: ValidatedRestriction) => {
    if (restriction.location && mapRef.current) {
      mapRef.current.flyTo(restriction.location.lat, restriction.location.lon, 19);
      setHighlightedId(restriction.id);
    }
  }, []);

  // Fetch SA-wide issues
  const fetchSAIssues = useCallback(async (status: 'error' | 'warning' | 'all') => {
    setSaLoading(true);
    setSaError(null);
    try {
      const response = await ApiService.getSAIssues(status);
      setSaIssues(response.restrictions);
      setSaIssuesMeta(response.meta);
      // Update filters to show the relevant issues
      setFilters({
        showOk: false,
        showWarnings: status === 'warning' || status === 'all',
        showErrors: status === 'error' || status === 'all',
        restrictionType: null,
      });
      // Zoom out to show all of SA
      if (mapRef.current) {
        mapRef.current.flyTo(24.5, 45.0, 6);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch SA issues';
      setSaError(message);
    } finally {
      setSaLoading(false);
    }
  }, []);

  // Clear SA issues and return to normal view
  const clearSAIssues = useCallback(() => {
    setSaIssues(null);
    setSaIssuesMeta(null);
    setSaError(null);
    setFilters({
      showOk: true,
      showWarnings: true,
      showErrors: true,
      restrictionType: null,
    });
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
              ref={mapRef}
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
          <SearchBox 
            restrictions={restrictions} 
            onHighlight={handleHighlightRestriction}
            onFlyToRestriction={handleFlyToRestriction}
          />

          <LayerControl activeLayer={baseLayer} onLayerChange={setBaseLayer} />

          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            restrictions={restrictions}
            meta={meta}
            onClearCache={clearCacheAndRefetch}
            loading={loading}
            onFetchSAIssues={fetchSAIssues}
            onClearSAIssues={clearSAIssues}
            hasSAIssues={saIssues !== null}
          />

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

