/**
 * Loading overlay component
 */

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading restrictions...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <div className="loading-message">{message}</div>
    </div>
  );
}

