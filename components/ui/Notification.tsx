import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
  isVisible: boolean;
}

const typeStyles = {
  success: 'bg-green-100 border-green-400 text-green-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700',
};

const iconMap = {
  success: <CheckCircle className="h-6 w-6" />,
  error: <AlertTriangle className="h-6 w-6" />,
  info: <AlertTriangle className="h-6 w-6" />,
};

/**
 * Custom, non-blocking toast notification component.
 * Ensures we avoid native browser alerts in the iFrame environment.
 */
export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onDismiss,
  isVisible,
}) => {
  if (!isVisible || !message) {
    return null;
  }

  const baseClasses =
    'fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-xl z-50 transition-opacity duration-300 flex items-center space-x-3 max-w-sm w-full border-l-4';
  const combinedClasses = `${baseClasses} ${typeStyles[type]}`;

  return (
    <div className={combinedClasses} role="alert">
      <div className="flex-shrink-0">{iconMap[type]}</div>
      <div className="flex-grow">
        <p className="font-medium text-sm sm:text-base">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 focus:ring-2 ${
          type === 'error'
            ? 'hover:bg-red-200'
            : type === 'success'
            ? 'hover:bg-green-200'
            : 'hover:bg-blue-200'
        }`}
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};
