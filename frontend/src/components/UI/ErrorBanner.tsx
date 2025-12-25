/**
 * Error banner component for displaying API errors
 */

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <div className="error-title">Error loading restrictions</div>
        <div className="error-message">{message}</div>
      </div>
      {onDismiss && (
        <button className="error-dismiss" onClick={onDismiss} title="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

