'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowRightLeft } from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

interface CounterOfferFormProps {
  open: boolean;
  onClose: () => void;
  originalPrice: number;
  originalDeliveryDays: number;
  sellerName: string;
}

export function CounterOfferForm({ open, onClose, originalPrice, originalDeliveryDays, sellerName }: CounterOfferFormProps) {
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [note, setNote] = useState('');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-dark-surface border-l border-neutral-200 dark:border-dark-border shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h3 font-semibold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
                  <ArrowRightLeft size={20} className="text-accent" />
                  Karşı Teklif
                </h3>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                  <X size={20} className="text-neutral-500" />
                </button>
              </div>

              {/* Original offer reference */}
              <div className="p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg mb-6">
                <p className="text-body-sm text-neutral-400 mb-2">Mevcut Teklif — {sellerName}</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-body-sm text-neutral-400">Fiyat</p>
                    <p className="text-body-lg font-bold text-neutral-900 dark:text-dark-textPrimary">{formatCurrency(originalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-body-sm text-neutral-400">Teslimat</p>
                    <p className="text-body-lg font-bold text-neutral-900 dark:text-dark-textPrimary">{originalDeliveryDays} gün</p>
                  </div>
                </div>
              </div>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Önerdiğiniz Fiyat (₺)
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={`Örn: ${Math.round(originalPrice * 0.9).toLocaleString('tr-TR')}`}
                    className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Teslimat Süresi (Gün) — Opsiyonel
                  </label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                    placeholder={`Mevcut: ${originalDeliveryDays} gün`}
                    className="w-full h-11 px-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-md font-medium text-neutral-700 dark:text-dark-textPrimary">
                    Not
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Karşı teklifinizle ilgili bir not ekleyin..."
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                  />
                  <p className="text-body-sm text-neutral-400 text-right">{note.length}/500</p>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-accent text-white text-body-lg font-semibold rounded-lg hover:bg-accent-600 active:scale-[0.98] transition-all duration-fast shadow-sm flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Karşı Teklifi Gönder
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
