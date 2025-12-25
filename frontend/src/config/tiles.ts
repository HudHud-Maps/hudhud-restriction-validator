/**
 * Tile layer configuration for the map
 */

export interface TileLayerConfig {
  url: string;
  attribution: string;
  name: string;
  maxZoom: number;
  subdomains?: string;
}

export const tileLayers: Record<string, TileLayerConfig> = {
  grayscale: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Grayscale',
    maxZoom: 20,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OSM Standard',
    maxZoom: 19,
  },
};

export const defaultLayer = 'grayscale';

// Default map center - Riyadh, Saudi Arabia
export const defaultCenter: [number, number] = [24.7136, 46.6753];
export const defaultZoom = 14;

// Saudi Arabia bounds (for reference)
export const saudiBounds = {
  north: 32.154,
  south: 16.379,
  east: 55.666,
  west: 34.495,
};

