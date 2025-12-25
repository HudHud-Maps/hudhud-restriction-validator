/**
 * Filter panel component for filtering restrictions
 */

import type { FilterState, ValidatedRestriction } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  restrictions: ValidatedRestriction[];
  meta: {
    total: number;
    errors: number;
    warnings: number;
    ok: number;
  } | null;
}

// Turn restriction types only (excluding no_entry/no_exit which are access restrictions)
const TURN_RESTRICTION_TYPES = [
  'no_left_turn',
  'no_right_turn',
  'no_straight_on',
  'no_u_turn',
  'only_left_turn',
  'only_right_turn',
  'only_straight_on',
  'only_u_turn',
];

export function FilterPanel({ filters, onFiltersChange, restrictions, meta }: FilterPanelProps) {
  // Get unique turn restriction types from current data (filter to only include turn restrictions)
  const availableTypes = [...new Set(restrictions.map((r) => r.restriction_type).filter(Boolean))]
    .filter((type) => TURN_RESTRICTION_TYPES.includes(type as string));
  
  // Combine with predefined types, keeping only turn restrictions
  const allTypes = [...new Set([...TURN_RESTRICTION_TYPES, ...availableTypes])].sort();

  // Compute filtered counts based on type filter
  const filteredRestrictions = filters.restrictionType
    ? restrictions.filter((r) => r.restriction_type === filters.restrictionType)
    : restrictions;

  const filteredCounts = {
    total: filteredRestrictions.length,
    ok: filteredRestrictions.filter((r) => r.status === 'ok').length,
    warnings: filteredRestrictions.filter((r) => r.status === 'warning').length,
    errors: filteredRestrictions.filter((r) => r.status === 'error').length,
  };

  const handleCheckboxChange = (key: keyof FilterState) => {
    if (typeof filters[key] === 'boolean') {
      onFiltersChange({
        ...filters,
        [key]: !filters[key],
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      restrictionType: e.target.value || null,
    });
  };

  return (
    <div className="filter-panel">
      <div className="control-title">Overlays</div>

      <div className="filter-section">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.showOk}
            onChange={() => handleCheckboxChange('showOk')}
          />
          <span className="checkbox-custom ok"></span>
          <span className="filter-label">
            Turn restrictions
            <span className="filter-count">({filteredCounts.total})</span>
          </span>
        </label>

        <label className="filter-checkbox sub-filter">
          <input
            type="checkbox"
            checked={filters.showWarnings}
            onChange={() => handleCheckboxChange('showWarnings')}
          />
          <span className="checkbox-custom warning"></span>
          <span className="filter-label">
            - with warnings
            <span className="filter-count">({filteredCounts.warnings})</span>
          </span>
        </label>

        <label className="filter-checkbox sub-filter">
          <input
            type="checkbox"
            checked={filters.showErrors}
            onChange={() => handleCheckboxChange('showErrors')}
          />
          <span className="checkbox-custom error"></span>
          <span className="filter-label">
            - with errors
            <span className="filter-count">({filteredCounts.errors})</span>
          </span>
        </label>
      </div>

      <div className="filter-section">
        <div className="control-subtitle">Filter by Type</div>
        <select
          className="type-select"
          value={filters.restrictionType || ''}
          onChange={handleTypeChange}
        >
          <option value="">All types</option>
          {allTypes.map((type) => (
            <option key={type} value={type || ''}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-stats">
        <div className="stat-total">
          Total: {filteredCounts.total}
          {filters.restrictionType && meta && (
            <span className="stat-of-total"> of {meta.total}</span>
          )}
        </div>
      </div>
    </div>
  );
}

