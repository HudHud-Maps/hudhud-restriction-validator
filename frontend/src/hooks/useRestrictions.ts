/**
 * Custom hook for fetching and managing restrictions
 */

import { useCallback, useEffect, useState } from 'react';
import type { RestrictionResponse, ValidatedRestriction } from '../types';
import { ApiService } from '../services/api';
import { useDebounce } from './useDebounce';

interface UseRestrictionsOptions {
  debounceMs?: number;
}

interface UseRestrictionsResult {
  restrictions: ValidatedRestriction[];
  meta: RestrictionResponse['meta'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRestrictions(
  bbox: [number, number, number, number] | null,
  options: UseRestrictionsOptions = {}
): UseRestrictionsResult {
  const { debounceMs = 500 } = options;

  const [restrictions, setRestrictions] = useState<ValidatedRestriction[]>([]);
  const [meta, setMeta] = useState<RestrictionResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Debounce the bbox to avoid too many API calls
  const debouncedBbox = useDebounce(bbox, debounceMs);

  const fetchRestrictions = useCallback(async () => {
    if (!debouncedBbox) {
      setRestrictions([]);
      setMeta(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getRestrictions(debouncedBbox);
      setRestrictions(response.restrictions);
      setMeta(response.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch restrictions';
      setError(message);
      setRestrictions([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedBbox]);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((t) => t + 1);
  }, []);

  return {
    restrictions,
    meta,
    loading,
    error,
    refetch,
  };
}

