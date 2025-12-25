/**
 * Restriction marker icons and utilities
 * Used by MarkerCluster for creating individual marker icons
 */

import L from 'leaflet';

// SVG icons for each restriction type
const RESTRICTION_SVGS: Record<string, string> = {
  // "only" restrictions - blue circle with white arrow
  only_left_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/><path d="M12 18V10M12 10L8 14M12 10C12 10 12 8 10 8H8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  only_right_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/><path d="M12 18V10M12 10L16 14M12 10C12 10 12 8 14 8H16" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  only_straight_on: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/><path d="M12 18V6M12 6L8 10M12 6L16 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  only_u_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/><path d="M8 18V12C8 9 10 7 12 7C14 7 16 9 16 12V14M16 14L14 12M16 14L18 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  
  // "no" restrictions - red circle with white symbol and red slash
  no_left_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M12 17V11M12 11L9 14M12 11C12 11 12 9 10 9H9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="5" y1="5" x2="19" y2="19" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  no_right_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M12 17V11M12 11L15 14M12 11C12 11 12 9 14 9H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="5" y1="5" x2="19" y2="19" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  no_straight_on: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M12 17V7M12 7L9 10M12 7L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="5" y1="5" x2="19" y2="19" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  no_u_turn: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/><path d="M8 17V12C8 10 10 8 12 8C14 8 16 10 16 12V13M16 13L14 11M16 13L18 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="5" y1="5" x2="19" y2="19" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
};

// Get SVG for restriction type, with fallback
function getRestrictionSvg(restrictionType: string | null | undefined): string {
  if (restrictionType && RESTRICTION_SVGS[restrictionType]) {
    return RESTRICTION_SVGS[restrictionType];
  }
  // Default unknown restriction icon
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#6b7280" stroke="#4b5563" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?</text></svg>`;
}

// Create icon with restriction type SVG and status indicator
export function createRestrictionIcon(
  status: string, 
  isHighlighted: boolean, 
  restrictionType?: string | null
): L.DivIcon {
  const size = isHighlighted ? 32 : 26;
  const svg = getRestrictionSvg(restrictionType);
  
  // Status indicator colors and symbols
  let statusIndicator = '';
  if (status === 'error') {
    // Red exclamation mark badge
    statusIndicator = `
      <div style="
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        background: #fef08a;
        border: 2px solid #dc2626;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #dc2626;
      ">!</div>
    `;
  } else if (status === 'warning') {
    // Yellow background indicator (like reference site)
    statusIndicator = `
      <div style="
        position: absolute;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        background: #fef08a;
        border: 2px solid #ca8a04;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: bold;
        color: #ca8a04;
      ">?</div>
    `;
  }

  return L.divIcon({
    className: 'restriction-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        ${isHighlighted ? 'animation: pulse 1s infinite;' : ''}
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      ">
        ${svg}
        ${statusIndicator}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}


