import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Full-screen subtle backdrop with slight blur */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-xl bg-white p-6 text-left shadow-2xl transition-all w-full max-w-md border border-[#E5E9E3] z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-full shrink-0 ${
                isDestructive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-warm-50 text-warm-700 border border-warm-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#252B27]">{title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#737C74] leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={isDestructive ? 'danger' : 'primary'}
              size="sm"
              isLoading={isLoading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

