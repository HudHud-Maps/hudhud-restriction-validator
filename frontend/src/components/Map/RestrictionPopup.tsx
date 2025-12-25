/**
 * Popup component for displaying restriction details
 */

import type { ValidatedRestriction } from '../../types';
import { getOsmEditUrl, getJosmUrl } from '../../services/api';

interface RestrictionPopupProps {
  restriction: ValidatedRestriction;
}

export function RestrictionPopup({ restriction }: RestrictionPopupProps) {
  const restrictionType = restriction.restriction_type || 'unknown';
  const hasIssues = restriction.issues.length > 0;

  return (
    <div className="restriction-popup">
      <div className="popup-header">
        <span className="popup-icon">
          <RestrictionIcon type={restrictionType} />
        </span>
        <div className="popup-title">
          <strong>Turn restriction</strong>
          <span className="restriction-type">"{restrictionType}"</span>
        </div>
      </div>

      <div className="popup-id">
        Id = <a href={getOsmEditUrl(restriction.id)} target="_blank" rel="noopener noreferrer">
          {restriction.id}
        </a>
      </div>

      <div className="popup-links">
        Edit in{' '}
        <a href={getOsmEditUrl(restriction.id)} target="_blank" rel="noopener noreferrer">
          OSM
        </a>
        {' or '}
        <a href={getJosmUrl(restriction.id)} target="_blank" rel="noopener noreferrer">
          JOSM
        </a>
        {' '}
        <span className="josm-note">(https)</span>
      </div>

      {hasIssues && (
        <div className={`popup-issues ${restriction.status === 'warning' ? 'has-warnings' : ''}`}>
          <strong>
            {restriction.status === 'error' ? 'Errors' : 'Warnings'}:
          </strong>
          <ul>
            {restriction.issues.map((issue, index) => (
              <li key={index} className={`issue-${issue.severity}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasIssues && (
        <div className="popup-ok">
          <span className="ok-icon">✓</span> No issues found
        </div>
      )}
    </div>
  );
}

/**
 * SVG icon component for restriction types
 */
function RestrictionIcon({ type }: { type: string }) {
  const size = 32;
  
  // No left turn
  if (type === 'no_left_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <path d="M50 25 L50 50 L30 50" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="30,40 20,50 30,60" fill="white"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // No right turn
  if (type === 'no_right_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <path d="M50 25 L50 50 L70 50" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="70,40 80,50 70,60" fill="white"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // No straight on
  if (type === 'no_straight_on') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <line x1="50" y1="75" x2="50" y2="35" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        <polygon points="40,35 50,20 60,35" fill="white"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // No U-turn
  if (type === 'no_u_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <path d="M35 70 L35 45 Q35 30 50 30 Q65 30 65 45 L65 55" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
        <polygon points="55,55 65,70 75,55" fill="white"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // No entry
  if (type === 'no_entry') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <rect x="20" y="42" width="60" height="16" rx="3" fill="white"/>
      </svg>
    );
  }
  
  // No exit
  if (type === 'no_exit') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <line x1="50" y1="30" x2="50" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        <line x1="30" y1="50" x2="70" y2="50" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // Only left turn
  if (type === 'only_left_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"/>
        <path d="M50 75 L50 50 L30 50" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="30,40 15,50 30,60" fill="white"/>
      </svg>
    );
  }
  
  // Only right turn
  if (type === 'only_right_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"/>
        <path d="M50 75 L50 50 L70 50" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <polygon points="70,40 85,50 70,60" fill="white"/>
      </svg>
    );
  }
  
  // Only straight on
  if (type === 'only_straight_on') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"/>
        <line x1="50" y1="75" x2="50" y2="35" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        <polygon points="40,35 50,15 60,35" fill="white"/>
      </svg>
    );
  }
  
  // Only U-turn
  if (type === 'only_u_turn') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"/>
        <path d="M35 70 L35 45 Q35 30 50 30 Q65 30 65 45 L65 55" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"/>
        <polygon points="55,55 65,70 75,55" fill="white"/>
      </svg>
    );
  }
  
  // Default/unknown - generic restriction sign
  if (type.startsWith('no_')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#991b1b" strokeWidth="4"/>
        <line x1="25" y1="25" x2="75" y2="75" stroke="white" strokeWidth="8" strokeLinecap="round"/>
      </svg>
    );
  }
  
  if (type.startsWith('only_')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#2563eb" stroke="#1d4ed8" strokeWidth="4"/>
        <polygon points="50,20 70,50 50,80 30,50" fill="white"/>
      </svg>
    );
  }
  
  // Unknown type - warning sign
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,10 95,85 5,85" fill="#f59e0b" stroke="#b45309" strokeWidth="4"/>
      <text x="50" y="70" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold">?</text>
    </svg>
  );
}

