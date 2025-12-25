/**
 * Search box component for finding restrictions by ID
 * Supports searching both in current view and globally via API
 */

import { useState, useCallback } from 'react';
import type { ValidatedRestriction } from '../../types';
import { ApiService } from '../../services/api';

interface SearchBoxProps {
  restrictions: ValidatedRestriction[];
  onHighlight: (id: number | null) => void;
  onFlyToRestriction: (restriction: ValidatedRestriction) => void;
}

export function SearchBox({ restrictions, onHighlight, onFlyToRestriction }: SearchBoxProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    setSearchError(null);

    if (!searchValue.trim()) {
      onHighlight(null);
      return;
    }

    const id = parseInt(searchValue.trim(), 10);
    if (isNaN(id)) {
      setSearchError('Please enter a valid relation ID');
      return;
    }

    // First, check if the restriction is in the current view
    const found = restrictions.find((r) => r.id === id);
    if (found) {
      onHighlight(id);
      return;
    }

    // If not found in current view, fetch from API
    setIsSearching(true);
    try {
      const response = await ApiService.getRestrictionById(id);
      if (response.restriction) {
        // Fly to the restriction's location
        onFlyToRestriction(response.restriction);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to find restriction';
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }, [searchValue, restrictions, onHighlight, onFlyToRestriction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchError(null);
    onHighlight(null);
  };

  return (
    <div className="search-box">
      <div className="control-title">Search</div>
      <div className="search-input-group">
        <input
          type="text"
          className="search-input"
          placeholder="Relation ID..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
        />
        <button 
          className="search-btn" 
          onClick={handleSearch} 
          title="Search"
          disabled={isSearching}
        >
          {isSearching ? '⏳' : '🔍'}
        </button>
        {searchValue && !isSearching && (
          <button className="clear-btn" onClick={handleClear} title="Clear">
            ✕
          </button>
        )}
      </div>
      {searchError && <div className="search-error">{searchError}</div>}
    </div>
  );
}

