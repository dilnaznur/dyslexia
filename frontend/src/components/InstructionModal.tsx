import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        >
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white w-full relative text-center"
            style={{ maxWidth: 500, borderRadius: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
