import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong',
  onRetry,
  compact = false,
}) => (
  <div className={`error-state ${compact ? 'error-state-compact' : ''}`}>
    <AlertCircle size={compact ? 20 : 32} />
    <p>{message}</p>
    {onRetry && (
      <button className="btn btn-sm" onClick={onRetry}>
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);
