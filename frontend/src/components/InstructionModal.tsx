import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InstructionModalProps {
  open: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  instructions: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
  onSkip?: () => void;
  /** Optional extra content (e.g. error banners) rendered before the action button */
  children?: React.ReactNode;
  /** Gradient for the action button, defaults to blue→green */
  actionGradient?: string;
}

export default function InstructionModal({
  open,
  icon,
  title,
  description,
  instructions,
  actionLabel,
  onAction,
  onClose,
  onSkip,
  children,
  actionGradient,
}: InstructionModalProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return;
    }

    // Remove active class (triggers fade out)
    setIsActive(false);

    // CRITICAL: Wait for animation to finish before hiding/unmounting
    const timer = window.setTimeout(() => {
      const overlay = overlayRef.current;
      if (overlay) overlay.style.display = 'none';
      setShouldRender(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!shouldRender || !open) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    // Show element first (display: flex)
    overlay.style.display = 'flex';

    // CRITICAL: Force reflow before adding 'active' class
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    overlay.offsetHeight;

    // Then add active class for animation
    setIsActive(true);
  }, [shouldRender, open]);

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${isActive ? 'active' : ''}`}
      onClick={onClose}
      style={{ display: 'none' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('modal.close')}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Body */}
            <div className="p-8 pt-10">
              {/* Icon */}
              <div className="mb-4 flex justify-center">{icon}</div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-gray-800">{title}</h2>

              {/* Description */}
              <p className="text-lg mb-5 text-gray-600 leading-relaxed">
                {description}
              </p>

              {/* Instructions box */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-5 text-left">
                <p className="text-base text-yellow-800">
                  <strong>🎯 {instructions.includes(':') ? '' : ''}</strong>{instructions}
                </p>
              </div>

              {/* Optional extra content (errors, etc.) */}
              {children}

              {/* Action button */}
              <div className="flex justify-center gap-4 flex-wrap mt-2">
                <button
                  onClick={onAction}
                  className={`${
                    actionGradient ??
                    'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600'
                  } text-white font-bold py-3 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-lg`}
                >
                  {actionLabel}
                </button>
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-gray-400 hover:text-gray-600 underline text-sm self-center"
                  >
                    {t('common.skipStep')}
                  </button>
                )}
              </div>
            </div>
      </div>
    </div>
  );
}
