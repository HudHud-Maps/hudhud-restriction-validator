/**
 * API service for communicating with the backend
 */

import type { ApiError, RestrictionResponse, ValidatedRestriction } from '../types';

const API_BASE = '/api';

export class ApiService {
  /**
   * Fetch restrictions for a bounding box
   */
  static async getRestrictions(
    bbox: [number, number, number, number],
    filters?: { status?: string; type?: string }
  ): Promise<RestrictionResponse> {
    const params = new URLSearchParams();
    params.set('bbox', bbox.join(','));

    if (filters?.status) {
      params.set('status', filters.status);
    }
    if (filters?.type) {
      params.set('type', filters.type);
    }

    const response = await fetch(`${API_BASE}/restrictions?${params}`);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        detail: `HTTP ${response.status}`,
      }));
      throw new Error(error.detail || error.error);
    }

    return response.json();
  }

  /**
   * Fetch a specific restriction by ID
   */
  static async getRestrictionById(relationId: number): Promise<ValidatedRestriction> {
    const response = await fetch(`${API_BASE}/restriction/${relationId}`);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        detail: `HTTP ${response.status}`,
      }));
      throw new Error(error.detail || error.error);
    }

    return response.json();
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  }
}

/**
 * Generate OSM edit URL for a relation (HudHud private OSM)
 */
export function getOsmEditUrl(relationId: number): string {
  return `https://osm.hudhud.cloud/relation/${relationId}`;
}

/**
 * Generate JOSM remote control URL for a relation (HudHud private JOSM API)
 */
export function getJosmUrl(relationId: number): string {
  return `https://josm-notes-api.hudhud.cloud/load_object?objects=r${relationId}&relation_members=true`;
}

/**
 * Generate JOSM remote control URL with HTTPS
 */
export function getJosmHttpsUrl(relationId: number): string {
  return `https://josm-notes-api.hudhud.cloud/load_object?objects=r${relationId}&relation_members=true`;
}

