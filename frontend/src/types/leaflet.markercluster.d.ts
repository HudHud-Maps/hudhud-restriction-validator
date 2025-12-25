import 'leaflet';

declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon | L.Icon;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    disableClusteringAtZoom?: number;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    spiderfyDistanceMultiplier?: number;
    spiderLegPolylineOptions?: L.PolylineOptions;
    chunkedLoading?: boolean;
    chunkInterval?: number;
    chunkDelay?: number;
    chunkProgress?: (processed: number, total: number, elapsed: number) => void;
    polygonOptions?: L.PolylineOptions;
    singleMarkerMode?: boolean;
    removeOutsideVisibleBounds?: boolean;
  }

  interface MarkerCluster extends L.Marker {
    getAllChildMarkers(): L.Marker[];
    getChildCount(): number;
    spiderfy(): void;
    unspiderfy(): void;
    zoomToBounds(): void;
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getVisibleParent(marker: L.Marker): L.Marker | MarkerCluster;
    refreshClusters(layers?: L.Marker | L.Marker[]): this;
    hasLayer(layer: L.Layer): boolean;
    zoomToShowLayer(layer: L.Marker, callback?: () => void): void;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

