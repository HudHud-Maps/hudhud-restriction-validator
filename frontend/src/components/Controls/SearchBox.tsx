/**
 * Search box component for finding restrictions by ID
 */

import { useState, useCallback } from 'react';
import type { ValidatedRestriction } from '../../types';

interface SearchBoxProps {
  restrictions: ValidatedRestriction[];
  onHighlight: (id: number | null) => void;
}

export function SearchBox({ restrictions, onHighlight }: SearchBoxProps) {
  const [searchValue, setSearchValue] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(() => {
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

    const found = restrictions.find((r) => r.id === id);
    if (found) {
      onHighlight(id);
    } else {
      setSearchError(`Relation ${id} not found in current view`);
    }
  }, [searchValue, restrictions, onHighlight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
        />
        <button className="search-btn" onClick={handleSearch} title="Search">
          🔍
        </button>
        {searchValue && (
          <button className="clear-btn" onClick={handleClear} title="Clear">
            ✕
          </button>
        )}
      </div>
      {searchError && <div className="search-error">{searchError}</div>}
    </div>
  );
}

