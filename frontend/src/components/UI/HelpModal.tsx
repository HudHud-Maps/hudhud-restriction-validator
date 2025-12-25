/**
 * Help modal explaining turn restriction icons and meanings
 */

import { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <button className="help-modal-close" onClick={onClose}>
          ✕
        </button>

        <h2>About this map of turn restrictions</h2>

        <p className="help-intro">
          <a href="https://wiki.openstreetmap.org/wiki/Relation:restriction" target="_blank" rel="noopener noreferrer">
            Turn restrictions
          </a>{' '}
          are{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">
            OpenStreetMap's
          </a>{' '}
          way of telling you where you aren't allowed to go or where you have to go when you're at a
          junction. We have two different main kinds of turn restrictions:{' '}
          <span className="text-blue">only-restrictions</span> and{' '}
          <span className="text-red">no-restrictions</span>.
        </p>

        <h3>Icons</h3>

        <div className="help-icons-grid">
          <div className="help-icon-section">
            <h4 className="text-blue">only-restrictions are</h4>
            <div className="help-icon-list">
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
                  <path d="M12 18V10M12 10L8 14M12 10C12 10 12 8 10 8H8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>only_left_turn</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
                  <path d="M12 18V10M12 10L16 14M12 10C12 10 12 8 14 8H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>only_right_turn</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
                  <path d="M12 18V6M12 6L8 10M12 6L16 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>only_straight_on</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
                  <path d="M8 18V12C8 9 10 7 12 7C14 7 16 9 16 12V14M16 14L14 12M16 14L18 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                <span>only_u_turn</span>
              </div>
            </div>
          </div>

          <div className="help-icon-section">
            <h4 className="text-red">no-restrictions are</h4>
            <div className="help-icon-list">
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5"/>
                  <path d="M12 17V11M12 11L9 14M12 11C12 11 12 9 10 9H9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <line x1="5" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span>no_left_turn</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5"/>
                  <path d="M12 17V11M12 11L15 14M12 11C12 11 12 9 14 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <line x1="5" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span>no_right_turn</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5"/>
                  <path d="M12 17V7M12 7L9 10M12 7L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <line x1="5" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span>no_straight_on</span>
              </div>
              <div className="help-icon-item">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5"/>
                  <path d="M8 17V12C8 10 10 8 12 8C14 8 16 10 16 12V13M16 13L14 11M16 13L18 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <line x1="5" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span>no_u_turn</span>
              </div>
            </div>
          </div>

          <div className="help-icon-section">
            <h4>special icons on this map</h4>
            <div className="help-icon-list">
              <div className="help-icon-item">
                <div className="help-special-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="11" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5"/>
                    <path d="M12 17V11M12 11L15 14M12 11C12 11 12 9 14 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <line x1="5" y1="5" x2="19" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <div className="help-badge error">!</div>
                </div>
                <span>turn restriction with errors</span>
              </div>
              <div className="help-icon-item">
                <div className="help-special-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="11" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5"/>
                    <path d="M12 18V6M12 6L8 10M12 6L16 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <div className="help-badge warning">?</div>
                </div>
                <span>turn restriction with warnings</span>
              </div>
              <div className="help-icon-item">
                <div className="help-cluster-icon">27</div>
                <span>cluster of multiple restrictions (click to zoom)</span>
              </div>
            </div>
          </div>
        </div>

        <h3>How turn restrictions work</h3>

        <div className="help-explanation">
          <div className="help-explanation-item">
            <h4 className="text-blue">only-restrictions:</h4>
            <p>
              Moving along the <span className="text-green">from</span>-way to the{' '}
              <span className="text-purple">via</span>-node (or the <span className="text-purple">via</span>-way) you are{' '}
              <u>only</u> allowed to continue on the <span className="text-red">to</span>-way.
            </p>
          </div>

          <div className="help-explanation-item">
            <h4 className="text-red">no-restrictions:</h4>
            <p>
              Moving along the <span className="text-green">from</span>-way to the{' '}
              <span className="text-purple">via</span>-node (or the <span className="text-purple">via</span>-way) you are{' '}
              <u>not</u> allowed to continue on the <span className="text-red">to</span>-way.
            </p>
          </div>
        </div>

        <h3>A note on the reported errors and warnings</h3>

        <p className="help-note">
          Please keep in mind: Errors or warnings shown on this map are not necessarily caused by errors
          of the turn restriction. Maybe the tagging of the ways is invalid or maybe this map doesn't
          work correctly. Also keep in mind that warnings are subjective according to the interpretation
          of turn restrictions - your rating may vary.
        </p>
      </div>
    </div>
  );
}

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="help-button"
        onClick={() => setIsOpen(true)}
        title="About this map"
        aria-label="Help and information"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
      </button>
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

