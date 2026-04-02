'use client';

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, Send, CheckCheck, ArrowLeft, MoreVertical,
  MessageSquare, Loader2, Smile, Paperclip,
  ChevronDown, VolumeX, Volume2, Flag, ShieldBan, Trash2, X, AlertTriangle, CheckCircle, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { realtimeWindowEventName } from '@/components/realtime-provider';

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g`;
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / 86400000);

  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function getDateKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */

interface ConversationItem {
  id: string;
  listingId?: string;
  listingTitle?: string;
  participantId: string;
  participantName: string;
  participantInitials: string;
  participantVerified: boolean;
  participantLastSeen: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  muted: boolean;
  acceptedOfferId?: string | null;
  acceptedOfferStatus?: string | null;
  isBuyerInOffer?: boolean;
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 60000; // 60 seconds
}

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MessageItem {
  id: string;
  text: string;
  attachments?: Attachment[] | null;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
  _optimistic?: boolean;
}

function isImage(type: string) {
  return /^image\/(jpeg|jpg|png|gif|webp|svg)$/i.test(type);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EMOJI_LIST = [
  '😀', '😂', '😊', '😍', '🥰', '😎', '🤔', '😅',
  '👍', '👎', '❤️', '🔥', '✅', '🎉', '💯', '🙏',
  '👋', '🤝', '💪', '⭐', '📦', '🚚', '💰', '📄',
  '✍️', '📌', '🔗', '📷', '👀', '💬', '🏷️', '🛒',
];

/* ─────────────────────────────────────────
   SVG chat background pattern (WhatsApp-style)
   ───────────────────────────────────────── */

const chatBgLight = `
  background-color: #efeae2;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d5cfc4' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
`;

const chatBgDark = `
  background-color: #0b141a;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
`;

/* ─────────────────────────────────────────
   Avatar colors
   ───────────────────────────────────────── */

const avatarColors = [
  'from-emerald-400 to-emerald-600',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
  'from-pink-400 to-pink-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

/* ═════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════ */

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <MessagesPage />
    </Suspense>
  );
}

function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = useRef(0);
  // Sound notification tracking: -1 = initial load (no sound), ≥0 = known count
  const lastMsgCountRef = useRef<Record<string, number>>({});

  const currentUserId = session?.user?.id;

  /* ── URL-based conversation selection ── */
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && convId !== selectedId) {
      setSelectedId(convId);
      setMobileShowChat(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Fetch conversations (initial + polling) ── */
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchConversations().then(() => setLoading(false));
    const interval = setInterval(fetchConversations, 60000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  /* ── Heartbeat: tell server we're online ── */
  useEffect(() => {
    const sendHeartbeat = () => fetch('/api/users/heartbeat', { method: 'POST' }).catch(() => {});
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(hbInterval);
  }, []);

  /* ── Notification sound ── */
  const playMessageSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* unsupported */ }
  }, []);

  /* ── Fetch messages (when conversation selected + polling) ── */
  const fetchMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const prevCount = lastMsgCountRef.current[selectedId];
        if (prevCount !== undefined && data.length > prevCount) {
          // New messages arrived — play sound if any are from other user
          const newMsgs = data.slice(prevCount);
          if (newMsgs.some((m: MessageItem) => m.senderId !== currentUserId)) {
            playMessageSound();
          }
        }
        lastMsgCountRef.current[selectedId] = data.length;
        setMessages((prev) => {
          // Keep optimistic messages that haven't been confirmed yet
          const serverIds = new Set(data.map((m: MessageItem) => m.id));
          const optimistic = prev.filter((m) => m._optimistic && !serverIds.has(m.id));
          return [...data, ...optimistic];
        });
      }
    } catch { /* silent */ }
  }, [selectedId, currentUserId, playMessageSound]);

  useEffect(() => {
    if (!selectedId) return;
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    const handleRealtime = (event: Event) => {
      const payload = (event as CustomEvent<{
        type?: string;
        conversationId?: string | null;
        entityId?: string;
      }>).detail;

      if (!payload?.type) return;

      if (
        payload.type === 'message.created' ||
        payload.type === 'conversation.updated' ||
        payload.type === 'presence.updated'
      ) {
        fetchConversations();
      }

      if (
        selectedId &&
        (payload.type === 'message.created' || payload.type === 'conversation.updated') &&
        (!payload.conversationId || payload.conversationId === selectedId || payload.entityId === selectedId)
      ) {
        fetchMessages();
      }
    };

    window.addEventListener(realtimeWindowEventName, handleRealtime as EventListener);
    return () => {
      window.removeEventListener(realtimeWindowEventName, handleRealtime as EventListener);
    };
  }, [fetchConversations, fetchMessages, selectedId]);

  /* ── Scroll chat container to bottom (without moving the page) ── */
  const userSentRef = useRef(false);
  const scrollChatToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      const el = messagesContainerRef.current;
      const isNearBottom = el
        ? el.scrollHeight - el.scrollTop - el.clientHeight < 150
        : true;
      if (userSentRef.current || isNearBottom) {
        scrollChatToBottom(true);
        userSentRef.current = false;
      }
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages.length, scrollChatToBottom]);

  /* ── Scroll-down button visibility ── */
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distFromBottom > 200);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollChatToBottom(true);
  }, [scrollChatToBottom]);

  /* ── Derived state ── */
  const selected = conversations.find((c) => c.id === selectedId);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participantName.toLowerCase().includes(q) ||
        (c.listingTitle || '').toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations]
  );

  const groupedMessages = useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; messages: MessageItem[] }[] = [];
    let currentKey = '';
    for (const msg of messages) {
      const key = getDateKey(msg.createdAt);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ dateKey: key, dateLabel: getDateLabel(msg.createdAt), messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  /* ── Handlers ── */
  const handleSelect = useCallback(
    (conv: ConversationItem) => {
      setSelectedId(conv.id);
      setMobileShowChat(true);
      // Update URL without full navigation
      const url = new URL(window.location.href);
      url.searchParams.set('conversation', conv.id);
      window.history.replaceState(null, '', url.toString());
      // Focus input after selecting
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    []
  );

  const handleBack = useCallback(() => {
    setMobileShowChat(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('conversation');
    window.history.replaceState(null, '', url.toString());
  }, []);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedId || sending) return;
      const text = newMessage.trim();
      setNewMessage('');
      setSending(true);

      // Mark that user sent — so auto-scroll triggers
      userSentRef.current = true;

      // Optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: MessageItem = {
        id: optimisticId,
        text,
        senderId: currentUserId || '',
        createdAt: new Date().toISOString(),
        sender: { id: currentUserId || '', name: session?.user?.name || '' },
        _optimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch(`/api/conversations/${selectedId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? { ...msg } : m))
          );
          // Update conversation list optimistically
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedId
                ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
                : c
            )
          );
        }
      } catch {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [newMessage, selectedId, sending, currentUserId, session?.user?.name]
  );

  /* ── File upload handler ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const convId = selectedId; // capture current value
    if (!files?.length || !convId) {
      console.warn('[FileUpload] No files or no conversation selected', { fileCount: files?.length, convId });
      return;
    }
    setUploading(true);
    userSentRef.current = true;

    try {
      // Upload files
      const formData = new FormData();
      const attachments: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} dosyası 5MB limitini aşıyor`);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        formData.append('files', file);
        attachments.push({
          url: '',
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      }

      // Step 1: Upload to server
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('[FileUpload] Upload failed:', uploadRes.status, errText);
        try {
          const err = JSON.parse(errText);
          alert(err.error || 'Dosya yüklenemedi');
        } catch {
          alert('Dosya yüklenemedi');
        }
        return;
      }
      const uploadData = await uploadRes.json();
      const urls: string[] = uploadData.urls;
      if (!urls?.length) {
        console.error('[FileUpload] No URLs returned from upload');
        alert('Dosya URL alınamadı');
        return;
      }
      const finalAttachments = attachments.map((a, i) => ({ ...a, url: urls[i] }));

      // Step 2: Send message with attachments
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', attachments: finalAttachments }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, lastMessage: `📎 ${finalAttachments[0].name}`, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        const errText = await res.text();
        console.error('[FileUpload] Message send failed:', res.status, errText);
        try {
          const err = JSON.parse(errText);
          alert(err.error || 'Mesaj gönderilemedi');
        } catch {
          alert('Mesaj gönderilemedi');
        }
      }
    } catch (err) {
      console.error('[FileUpload] Error:', err);
      alert('Dosya gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Emoji insert ── */
  const insertEmoji = useCallback((emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, []);

  /* ── Close menu on outside click ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  /* ── Mute toggle ── */
  const handleMuteToggle = async () => {
    if (!selectedId) return;
    setShowMenu(false);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/mute`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, muted: data.muted } : c))
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Report user ── */
  const handleReport = async () => {
    const selected = conversations.find((c) => c.id === selectedId);
    if (!selected?.participantId || !reportReason) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${selected.participantId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, detail: reportDetail || undefined }),
      });
      if (res.ok) {
        setShowReportModal(false);
        setReportReason('');
        setReportDetail('');
        alert('Şikayetiniz alındı. En kısa sürede incelenecektir.');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Şikayet gönderilemedi');
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Block user ── */
  const handleBlock = async () => {
    const selected = conversations.find((c) => c.id === selectedId);
    if (!selected?.participantId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${selected.participantId}/block`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setShowBlockConfirm(false);
        if (data.blocked) {
          alert(`${selected.participantName} engellendi.`);
        } else {
          alert(`${selected.participantName} engeli kaldırıldı.`);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete conversation ── */
  const handleDeleteConversation = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== selectedId));
        setSelectedId(null);
        setMessages([]);
        setMobileShowChat(false);
        setShowDeleteConfirm(false);
        router.push('/messages');
      }
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-[3px] border-neutral-200 dark:border-dark-border" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
          </div>
          <p className="text-body-md text-neutral-400 animate-pulse">Mesajlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  /* ── Empty state: no conversations at all ── */
  if (conversations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <div className="py-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center"
          >
            <MessageSquare size={40} className="text-accent/60" />
          </motion.div>
          <motion.h3
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-h3 font-bold text-neutral-800 dark:text-dark-textPrimary mb-3"
          >
            Henüz mesajın yok
          </motion.h3>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-body-lg text-neutral-500 dark:text-dark-textSecondary max-w-md mx-auto"
          >
            Bir ilana teklif verdiğinde veya teklif aldığında burada mesajlaşabilirsin.
          </motion.p>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-600 transition-colors"
            >
              İlanları Keşfet
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════
     MAIN RENDER
     ═════════════════════════════════════════ */
  return (
    <div className="max-w-7xl mx-auto px-0 md:px-6 md:py-6">
      <div
        className="bg-white dark:bg-dark-surface md:rounded-2xl md:border border-neutral-200/60 dark:border-dark-border/60 overflow-hidden md:shadow-lg"
        style={{ height: 'calc(100vh - 80px)', minHeight: '500px' }}
      >
        <div className="flex h-full">
          {/* ════════════════════════════════
             LEFT PANEL: Conversation List
             ════════════════════════════════ */}
          <div
            className={`w-full md:w-[380px] lg:w-[420px] md:border-r border-neutral-200/80 dark:border-dark-border/80 flex flex-col shrink-0 bg-white dark:bg-dark-surface ${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2.5">
                  Mesajlar
                  <AnimatePresence>
                    {totalUnread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold"
                      >
                        {totalUnread}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </h1>
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Konuşma veya kişi ara..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => {
                const isActive = selectedId === conv.id;
                const colorClass = getAvatarColor(conv.participantName);
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv)}
                    className={`w-full text-left px-5 py-3.5 flex items-center gap-3.5 transition-all duration-150 relative group ${
                      isActive
                        ? 'bg-accent/[0.08] dark:bg-accent/[0.12]'
                        : 'hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised/50'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeConv"
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent"
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-body-md shadow-sm`}
                      >
                        {conv.participantInitials}
                      </div>
                      {conv.unreadCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-surface"
                        >
                          {conv.unreadCount}
                        </motion.div>
                      )}
                      {isOnline(conv.participantLastSeen) && conv.unreadCount === 0 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-white dark:ring-dark-surface" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-body-md font-semibold truncate ${
                              conv.unreadCount > 0
                                ? 'text-neutral-900 dark:text-dark-textPrimary'
                                : 'text-neutral-700 dark:text-dark-textSecondary'
                            }`}
                          >
                            {conv.participantName}
                          </span>
                          {conv.participantVerified && (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                              <circle cx="8" cy="8" r="8" fill="#1A8754" />
                              <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {conv.muted && (
                            <VolumeX size={14} className="text-neutral-400 shrink-0" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] shrink-0 ml-2 ${
                            conv.unreadCount > 0
                              ? 'text-accent font-semibold'
                              : 'text-neutral-400'
                          }`}
                        >
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>
                      {conv.listingTitle && (
                        <p className="text-[11px] text-accent/70 truncate mb-0.5 font-medium">
                          {conv.listingTitle}
                        </p>
                      )}
                      <p
                        className={`text-body-sm truncate ${
                          conv.unreadCount > 0
                            ? 'text-neutral-700 dark:text-dark-textPrimary font-medium'
                            : 'text-neutral-400 dark:text-dark-textSecondary'
                        }`}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* No search results */}
              {filteredConversations.length === 0 && (
                <div className="p-10 text-center">
                  <Search size={32} className="mx-auto mb-3 text-neutral-200 dark:text-dark-border" />
                  <p className="text-body-md text-neutral-400">Konuşma bulunamadı</p>
                  <p className="text-body-sm text-neutral-300 mt-1">Farklı bir arama deneyin</p>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════
             RIGHT PANEL: Chat View
             ════════════════════════════════ */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${
              !mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selected ? (
              <>
                {/* Chat Header */}
                <div className="px-4 md:px-5 py-3 border-b border-neutral-100 dark:border-dark-border/80 bg-white dark:bg-dark-surface flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleBack}
                    className="md:hidden p-2 -ml-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors"
                  >
                    <ArrowLeft size={20} className="text-neutral-600 dark:text-dark-textSecondary" />
                  </button>

                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                        selected.participantName
                      )} flex items-center justify-center text-white font-bold text-body-sm shadow-sm`}
                    >
                      {selected.participantInitials}
                    </div>
                    {isOnline(selected.participantLastSeen) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success ring-2 ring-white dark:ring-dark-surface" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/profile/${selected.participantId}`} className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate hover:text-accent transition-colors">
                        {selected.participantName}
                      </Link>
                      {selected.participantVerified && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                          <circle cx="8" cy="8" r="8" fill="#1A8754" />
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isOnline(selected.participantLastSeen) ? (
                        <span className="text-[12px] text-success font-medium">çevrimiçi</span>
                      ) : (
                        <span className="text-[12px] text-neutral-400">çevrimdışı</span>
                      )}
                      {selected.listingId && (
                        <>
                          <span className="text-neutral-300 mx-0.5">·</span>
                          <Link
                            href={`/listing/${selected.listingId}`}
                            className="text-[12px] text-accent hover:text-accent-600 transition-colors truncate font-medium"
                          >
                            {selected.listingTitle}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={`p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors ${showMenu ? 'bg-neutral-100 dark:bg-dark-surfaceRaised' : ''}`}
                    >
                      <MoreVertical size={18} className="text-neutral-400" />
                    </button>

                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-dark-surfaceRaised rounded-xl border border-neutral-200 dark:border-dark-border shadow-xl z-50 overflow-hidden"
                        >
                          {/* Sessize Al */}
                          <button
                            onClick={handleMuteToggle}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            {selected.muted ? (
                              <Volume2 size={17} className="text-neutral-500 dark:text-neutral-400" />
                            ) : (
                              <VolumeX size={17} className="text-neutral-500 dark:text-neutral-400" />
                            )}
                            <span className="text-body-sm text-neutral-700 dark:text-dark-textPrimary">
                              {selected.muted ? 'Sesi Aç' : 'Sessize Al'}
                            </span>
                          </button>

                          <div className="h-px bg-neutral-100 dark:bg-dark-border" />

                          {/* Şikayet Et */}
                          <button
                            onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <Flag size={17} className="text-amber-500" />
                            <span className="text-body-sm text-neutral-700 dark:text-dark-textPrimary">Şikayet Et</span>
                          </button>

                          <div className="h-px bg-neutral-100 dark:bg-dark-border" />

                          {/* Engelle */}
                          <button
                            onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <ShieldBan size={17} className="text-red-500" />
                            <span className="text-body-sm text-red-600 dark:text-red-400">Engelle</span>
                          </button>

                          <div className="h-px bg-neutral-100 dark:bg-dark-border" />

                          {/* Sil */}
                          <button
                            onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                          >
                            <Trash2 size={17} className="text-red-500" />
                            <span className="text-body-sm text-red-600 dark:text-red-400">Sohbeti Sil</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Order action banner */}
                {selected.acceptedOfferId && selected.acceptedOfferStatus === 'accepted' && (
                  <Link
                    href={`/orders`}
                    className="flex items-center justify-between px-4 py-2.5 bg-accent/10 border-b border-accent/20 hover:bg-accent/15 transition-colors shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-accent" />
                      <span className="text-body-sm font-medium text-accent">Teslimat tamamlandıysa siparişlerimden onaylayın</span>
                    </div>
                    <span className="text-body-sm font-semibold text-accent">Siparişlerim &rarr;</span>
                  </Link>
                )}
                {selected.acceptedOfferId && selected.isBuyerInOffer && selected.acceptedOfferStatus === 'completed' && (
                  <Link
                    href={`/offers/${selected.acceptedOfferId}`}
                    className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      <span className="text-body-sm font-medium text-amber-700 dark:text-amber-400">Satıcıyı değerlendirin</span>
                    </div>
                    <span className="text-body-sm font-semibold text-amber-600 dark:text-amber-400">Puan Ver &rarr;</span>
                  </Link>
                )}

                {/* Messages Area */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-3 md:px-6 py-4 relative chat-messages-bg"
                >
                  {/* Chat background style (applied via inline for SSR compat) */}
                  <style>{`
                    .chat-messages-bg { ${chatBgLight} }
                    .dark .chat-messages-bg { ${chatBgDark} }
                  `}</style>

                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl px-6 py-4 text-center shadow-sm"
                      >
                        <p className="text-body-md text-neutral-500">
                          Mesajlaşmaya başlayın
                        </p>
                      </motion.div>
                    </div>
                  )}

                  {groupedMessages.map((group) => (
                    <div key={group.dateKey}>
                      {/* Date separator */}
                      <div className="flex justify-center my-4">
                        <span className="px-4 py-1.5 rounded-lg bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm text-[11px] font-medium text-neutral-500 dark:text-dark-textSecondary shadow-sm">
                          {group.dateLabel}
                        </span>
                      </div>

                      {/* Messages */}
                      {group.messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUserId;
                        const isOptimistic = msg._optimistic;
                        const showTail =
                          idx === group.messages.length - 1 ||
                          group.messages[idx + 1]?.senderId !== msg.senderId;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'} ${
                              showTail ? 'mb-2.5' : ''
                            }`}
                          >
                            <div
                              className={`relative max-w-[80%] md:max-w-[65%] px-3.5 py-2 shadow-sm ${
                                isMe
                                  ? showTail
                                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-2xl rounded-tr-md'
                                    : 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-2xl'
                                  : showTail
                                  ? 'bg-white dark:bg-dark-surfaceRaised rounded-2xl rounded-tl-md'
                                  : 'bg-white dark:bg-dark-surfaceRaised rounded-2xl'
                              } ${isOptimistic ? 'opacity-70' : ''}`}
                            >
                              {/* Bubble tail */}
                              {showTail && isMe && (
                                <div className="absolute top-0 -right-2 w-3 h-3 overflow-hidden">
                                  <div className="w-4 h-4 bg-[#d9fdd3] dark:bg-[#005c4b] rotate-45 transform origin-bottom-left" />
                                </div>
                              )}
                              {showTail && !isMe && (
                                <div className="absolute top-0 -left-2 w-3 h-3 overflow-hidden">
                                  <div className="w-4 h-4 bg-white dark:bg-dark-surfaceRaised rotate-45 transform origin-bottom-right" />
                                </div>
                              )}

                              {/* Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="space-y-2 mb-1">
                                  {msg.attachments.map((att, ai) =>
                                    isImage(att.type) ? (
                                      <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          className="max-w-[260px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        key={ai}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                                          isMe
                                            ? 'bg-[#c5f0c0] dark:bg-[#004a3f] hover:bg-[#b8e8b1] dark:hover:bg-[#005c4b]'
                                            : 'bg-neutral-100 dark:bg-dark-border hover:bg-neutral-200 dark:hover:bg-dark-surfaceRaised'
                                        }`}
                                      >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                          isMe ? 'bg-[#a8dfa0] dark:bg-[#006a54]' : 'bg-neutral-200 dark:bg-neutral-600'
                                        }`}>
                                          <Paperclip size={18} className={isMe ? 'text-green-800 dark:text-green-300' : 'text-neutral-500 dark:text-neutral-300'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-body-sm font-medium text-neutral-900 dark:text-dark-textPrimary truncate">{att.name}</p>
                                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{formatFileSize(att.size)}</p>
                                        </div>
                                      </a>
                                    )
                                  )}
                                </div>
                              )}

                              {msg.text && (
                                <p className="text-body-md text-neutral-900 dark:text-dark-textPrimary leading-relaxed break-words whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              )}
                              <div
                                className={`flex items-center gap-1 mt-0.5 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-none">
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMe && (
                                  <CheckCheck
                                    size={14}
                                    className={
                                      isOptimistic
                                        ? 'text-neutral-300'
                                        : 'text-blue-500'
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />

                  {/* Scroll to bottom button */}
                  <AnimatePresence>
                    {showScrollDown && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={scrollToBottom}
                        className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-dark-surfaceRaised shadow-lg flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-dark-border transition-colors z-10"
                      >
                        <ChevronDown size={20} className="text-neutral-500" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Message Input Area */}
                <div className="px-3 md:px-5 py-3 border-t border-neutral-100 dark:border-dark-border/80 bg-neutral-50/50 dark:bg-dark-surface shrink-0">
                  {/* Emoji picker */}
                  <AnimatePresence>
                    {showEmoji && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-2 p-3 bg-white dark:bg-dark-surfaceRaised rounded-2xl border border-neutral-200 dark:border-dark-border shadow-lg"
                      >
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="w-9 h-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-border flex items-center justify-center text-xl transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upload progress */}
                  {uploading && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-xl">
                      <Loader2 size={16} className="animate-spin text-accent" />
                      <span className="text-body-sm text-accent font-medium">Dosya yükleniyor...</span>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className={`p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors shrink-0 hidden md:flex items-center justify-center ${showEmoji ? 'bg-neutral-100 dark:bg-dark-surfaceRaised' : ''}`}
                    >
                      <Smile size={22} className={showEmoji ? 'text-accent' : 'text-neutral-400'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors shrink-0 hidden md:flex items-center justify-center disabled:opacity-50"
                    >
                      <Paperclip size={22} className="text-neutral-400" />
                    </button>

                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                        onFocus={() => setShowEmoji(false)}
                        placeholder="Mesaj yazın..."
                        className="w-full h-12 pl-4 pr-12 rounded-2xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all duration-200"
                      />
                      {/* Mobile emoji + attach inside input */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:hidden">
                        <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 rounded-lg">
                          <Smile size={18} className="text-neutral-400" />
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-1.5 rounded-lg">
                          <Paperclip size={18} className="text-neutral-400" />
                        </button>
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                        newMessage.trim()
                          ? 'bg-accent text-white shadow-md shadow-accent/25 hover:bg-accent-600'
                          : 'bg-neutral-200 dark:bg-dark-surfaceRaised text-neutral-400 dark:text-dark-textSecondary'
                      }`}
                    >
                      {sending ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} className={newMessage.trim() ? '' : ''} />
                      )}
                    </motion.button>
                  </form>

                  {/* Typing indicator placeholder */}
                  <div className="h-5 mt-1 px-2">
                    {/* Can be populated when typing indicators are implemented */}
                  </div>
                </div>
              </>
            ) : (
              /* ── No conversation selected ── */
              <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-dark-bg/50">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="text-center px-6"
                >
                  <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center">
                      <MessageSquare size={36} className="text-accent/50" />
                    </div>
                  </div>
                  <h3 className="text-h4 font-bold text-neutral-600 dark:text-dark-textSecondary mb-2">
                    TalepSat Mesajlar
                  </h3>
                  <p className="text-body-md text-neutral-400 dark:text-dark-textSecondary max-w-xs mx-auto leading-relaxed">
                    Sol panelden bir konuşma seçerek mesajlaşmaya başlayın
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-body-sm text-neutral-300">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.1L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                        fill="currentColor"
                      />
                    </svg>
                    Uçtan uca şifrelenmiş mesajlaşma
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODALS
          ══════════════════════════════════════════ */}

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-surfaceRaised rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Flag size={20} className="text-amber-500" />
                  </div>
                  <h3 className="text-h5 font-bold text-neutral-900 dark:text-dark-textPrimary">Kullanıcıyı Şikayet Et</h3>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-border transition-colors">
                  <X size={18} className="text-neutral-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 dark:text-dark-textSecondary mb-2">Şikayet Nedeni</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'spam', label: 'Spam / İstenmeyen mesaj' },
                      { value: 'harassment', label: 'Taciz / Kötüye kullanım' },
                      { value: 'fraud', label: 'Dolandırıcılık' },
                      { value: 'inappropriate', label: 'Uygunsuz içerik' },
                      { value: 'other', label: 'Diğer' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setReportReason(r.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-body-sm transition-all ${
                          reportReason === r.value
                            ? 'border-accent bg-accent/5 text-accent font-medium'
                            : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-border/50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-neutral-700 dark:text-dark-textSecondary mb-2">
                    Detay <span className="text-neutral-400 font-normal">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    rows={3}
                    placeholder="Ek bilgi ekleyebilirsiniz..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-body-sm text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-5 pt-0">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason || actionLoading}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-body-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                  Şikayet Et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Confirm Modal */}
      <AnimatePresence>
        {showBlockConfirm && (() => {
          const sel = conversations.find((c) => c.id === selectedId);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowBlockConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-dark-surfaceRaised rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <ShieldBan size={28} className="text-red-500" />
                </div>
                <h3 className="text-h5 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
                  Kullanıcıyı Engelle
                </h3>
                <p className="text-body-sm text-neutral-500 dark:text-dark-textSecondary mb-6">
                  <strong>{sel?.participantName}</strong> adlı kullanıcıyı engellemek istediğinize emin misiniz? Bu kullanıcı size mesaj gönderemeyecek.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBlockConfirm(false)}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={actionLoading}
                    className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-body-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldBan size={16} />}
                    Engelle
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-surfaceRaised rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-h5 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
                Sohbeti Sil
              </h3>
              <p className="text-body-sm text-neutral-500 dark:text-dark-textSecondary mb-6">
                Bu sohbeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-dark-border text-body-sm font-medium text-neutral-600 dark:text-dark-textSecondary hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteConversation}
                  disabled={actionLoading}
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-body-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
