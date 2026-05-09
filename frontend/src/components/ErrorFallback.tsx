import React from 'react';
import type { FallbackProps } from 'react-error-boundary';

/**
 * Accepts both `react-error-boundary`'s {error, resetErrorBoundary} contract
 * and ad-hoc standalone use (e.g. Sentry fallback without props). The handler
 * guards against `resetErrorBoundary` being absent.
 *
 * Register as ErrorBoundary's FallbackComponent via a cast:
 *   <ErrorBoundary FallbackComponent={ErrorFallback as React.ComponentType<FallbackProps>} />
 */
type ErrorFallbackProps = Partial<FallbackProps>;

/**
 * Minimal error boundary fallback rendered by Sentry.ErrorBoundary and
 * react-error-boundary when an uncaught render-time error bubbles up.
 * Sentry has already captured the exception by the time this displays.
 *
 * Accepts the standard react-error-boundary shape
 * (`{ error, resetErrorBoundary }`), but all props are optional so the
 * same component can be used as a Sentry `fallback={<ErrorFallback />}`.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ resetErrorBoundary }) => {
  const handleReload = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
      return;
    }
    window.location.reload();
  };

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
        Something went wrong
      </h1>
      <p style={{ marginBottom: '1.5rem', maxWidth: 480, color: '#555' }}>
        Our team has been notified and is looking into it. Please try reloading
        the page — if the problem persists, contact support.
      </p>
      <button
        onClick={handleReload}
        style={{
          padding: '0.6rem 1.4rem',
          fontSize: '1rem',
          border: 'none',
          borderRadius: 6,
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Reload
      </button>
    </div>
  );
};

export { ErrorFallback };
export default ErrorFallback;
