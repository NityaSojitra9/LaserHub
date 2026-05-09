/**
 * Unobtrusive notification permission prompt.
 *
 * Shown to logged-in users who have not yet been asked for notification
 * permission and who have not previously dismissed the banner. Appears
 * only after the user has been on the site for a short delay so it
 * doesn't interrupt the initial page load.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isNotificationSupported, subscribeToPush } from '../services/notifications';

const DISMISSED_KEY = 'laserhub-notifications-dismissed';
const SHOW_DELAY_MS = 10_000;

export function NotificationPrompt() {
  const { isAuthenticated } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !isNotificationSupported() ||
      Notification.permission !== 'default' ||
      localStorage.getItem(DISMISSED_KEY) === 'true'
    ) {
      setVisible(false);
      return;
    }

    // Delay showing the banner so it doesn't interrupt the first view.
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  if (!visible) return null;

  const handleEnable = async () => {
    setVisible(false);
    await subscribeToPush();
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="notification-prompt" role="banner" aria-live="polite">
      <span className="notification-prompt-icon" aria-hidden="true">🔔</span>
      <span className="notification-prompt-text">
        Get notified about your order updates
      </span>
      <div className="notification-prompt-actions">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleEnable}
          aria-label="Enable order notifications"
        >
          Enable
        </button>
      </div>
      <button
        type="button"
        className="notification-prompt-close"
        onClick={handleDismiss}
        aria-label="Dismiss notification prompt"
      >
        <X size={16} />
      </button>
    </div>
  );
}
