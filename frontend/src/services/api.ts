/**
 * API service for communicating with the backend
 */

import type { ApiError, RestrictionResponse, SingleRestrictionResponse } from '../types';

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
   * Fetch a specific restriction by ID (works regardless of map view)
   */
  static async getRestrictionById(relationId: number): Promise<SingleRestrictionResponse> {
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

  /**
   * Clear the server-side cache to force fresh data from Overpass
   */
  static async clearCache(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE}/cache/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to clear cache');
    }

    return response.json();
  }

  /**
   * Get all restrictions with issues across Saudi Arabia
   * @param status - 'error', 'warning', or 'all'
   */
  static async getSAIssues(status: 'error' | 'warning' | 'all' = 'all'): Promise<RestrictionResponse> {
    const response = await fetch(`${API_BASE}/issues/sa?status=${status}`);

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        detail: `HTTP ${response.status}`,
      }));
      throw new Error(error.detail || error.error);
    }

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

