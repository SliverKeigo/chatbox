import { useEffect, useState } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return isVisible ? (
    <div className="error-toast">
      <p>{message}</p>
    </div>
  ) : null;
}