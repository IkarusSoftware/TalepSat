'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const rejectReasons = [
  'Fiyat yüksek',
  'Teslimat süresi uzun',
  'Satıcı puanı düşük',
  'Ürün uygun değil',
  'Diğer',
];

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  sellerName: string;
}

export function RejectReasonModal({ open, onClose, onConfirm, sellerName }: RejectReasonModalProps) {
  const [selected, setSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selected === 'Diğer' ? customReason || 'Diğer' : selected;
    if (reason) {
      onConfirm(reason);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h4 font-semibold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
                <AlertTriangle size={18} className="text-error" />
                Teklifi Reddet
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                <X size={18} className="text-neutral-500" />
              </button>
            </div>

            <p className="text-body-md text-neutral-500 mb-5">
              <strong className="text-neutral-700 dark:text-dark-textPrimary">{sellerName}</strong> tarafından gelen teklifi reddetmek istediğinize emin misiniz? Bir sebep belirtin:
            </p>

            <div className="space-y-2 mb-5">
              {rejectReasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected === reason
                      ? 'border-accent bg-accent-lighter/30 dark:bg-accent/10 dark:border-accent/30'
                      : 'border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selected === reason}
                    onChange={(e) => setSelected(e.target.value)}
                    className="accent-accent"
                  />
                  <span className="text-body-md text-neutral-700 dark:text-dark-textPrimary">{reason}</span>
                </label>
              ))}
            </div>

            {selected === 'Diğer' && (
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Sebebinizi yazın..."
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors mb-5"
              />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-11 border border-neutral-200 dark:border-dark-border rounded-lg text-body-md font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="flex-1 h-11 bg-error text-white text-body-md font-semibold rounded-lg hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Reddet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
