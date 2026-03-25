'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bell, MessageSquare, CheckCircle, XCircle, ArrowRightLeft,
  Clock, Settings, Check, Trash2,
} from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

const typeConfig = {
  offer_received: { icon: MessageSquare, color: 'text-accent', bg: 'bg-accent-lighter dark:bg-accent/10' },
  offer_accepted: { icon: CheckCircle, color: 'text-success', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  offer_rejected: { icon: XCircle, color: 'text-error', bg: 'bg-red-50 dark:bg-red-500/10' },
  counter_offer: { icon: ArrowRightLeft, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  message: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary-50 dark:bg-primary/10' },
  listing_expiry: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  system: { icon: Settings, color: 'text-neutral-500', bg: 'bg-neutral-100 dark:bg-neutral-500/10' },
};

const tabs = [
  { value: 'all', label: 'Tümü' },
  { value: 'unread', label: 'Okunmamış' },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const filtered = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-3">
            Bildirimler
            {unreadCount > 0 && (
              <span className="w-7 h-7 rounded-full bg-accent text-white text-body-sm font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-body-lg text-neutral-500">Teklifler, mesajlar ve sistem bildirimleri.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="h-9 px-4 rounded-lg border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors flex items-center gap-2"
          >
            <Check size={14} /> Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-body-md font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised'
            }`}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span className={`ml-1.5 text-body-sm ${activeTab === tab.value ? 'text-white/70' : 'text-neutral-400'}`}>
                ({unreadCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((notification, index) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            const content = (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                onClick={() => markAsRead(notification.id)}
                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                  notification.read
                    ? 'bg-white dark:bg-dark-surface border-neutral-200/50 dark:border-dark-border/80'
                    : 'bg-accent-lighter/20 dark:bg-accent/5 border-accent/20 dark:border-accent/15'
                }`}
              >
                {/* Unread dot */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-accent" />
                )}

                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon size={18} className={config.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-body-md font-semibold mb-0.5 ${
                    notification.read ? 'text-neutral-700 dark:text-dark-textSecondary' : 'text-neutral-900 dark:text-dark-textPrimary'
                  }`}>
                    {notification.title}
                  </h4>
                  <p className={`text-body-sm mb-1.5 ${
                    notification.read ? 'text-neutral-400' : 'text-neutral-600 dark:text-dark-textSecondary'
                  }`}>
                    {notification.description}
                  </p>
                  <span className="text-body-sm text-neutral-400">{timeAgo(notification.createdAt)}</span>
                </div>
              </motion.div>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <Bell size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">
            {activeTab === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim yok'}
          </h3>
          <p className="text-body-lg text-neutral-500">
            {activeTab === 'unread' ? 'Tüm bildirimlerin okunmuş.' : 'Henüz bildirim almadın.'}
          </p>
        </div>
      )}
    </div>
  );
}
