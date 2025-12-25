/**
 * Shared types for the Turn Restriction Validator
 */

export type IssueSeverity = 'error' | 'warning';

export interface Issue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface RestrictionMember {
  id: number;
  type: 'node' | 'way' | 'relation';
  role: string;
  ref: number | null;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export type RestrictionStatus = 'ok' | 'warning' | 'error';

export interface ValidatedRestriction {
  id: number;
  restriction_type: string | null;
  members: RestrictionMember[];
  tags: Record<string, string>;
  issues: Issue[];
  status: RestrictionStatus;
  location: Coordinates | null;
}

export interface RestrictionResponse {
  restrictions: ValidatedRestriction[];
  meta: {
    total: number;
    errors: number;
    warnings: number;
    ok: number;
    bbox: [number, number, number, number];
    osm_timestamp?: string;
  };
}

export interface SingleRestrictionResponse {
  restriction: ValidatedRestriction;
  osm_timestamp?: string;
}

export interface ApiError {
  error: string;
  detail?: string;
}

export type BaseLayerType = 'grayscale' | 'osm';

export interface FilterState {
  showOk: boolean;
  showWarnings: boolean;
  showErrors: boolean;
  restrictionType: string | null;
}

