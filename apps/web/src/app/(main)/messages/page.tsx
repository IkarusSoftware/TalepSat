'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search, Send, CheckCircle, ArrowLeft, MoreVertical,
  MessageSquare, Loader2,
} from 'lucide-react';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins}dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

interface ConversationItem {
  id: string;
  listingId?: string;
  listingTitle?: string;
  participantId: string;
  participantName: string;
  participantInitials: string;
  participantVerified: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = session?.user?.id;

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/conversations/${selectedId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selected = conversations.find((c) => c.id === selectedId);

  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.listingTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSelect = (conv: ConversationItem) => {
    setSelectedId(conv.id);
    setMobileShowChat(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    const text = newMessage;
    setNewMessage('');

    const res = await fetch(`/api/conversations/${selectedId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    }
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, MessageItem[]>);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <div className="py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-dark-surfaceRaised flex items-center justify-center">
            <MessageSquare size={28} className="text-neutral-400" />
          </div>
          <h3 className="text-h3 font-semibold text-neutral-700 dark:text-dark-textPrimary mb-2">Henüz mesajın yok</h3>
          <p className="text-body-lg text-neutral-500">Bir ilana teklif verdiğinde veya teklif aldığında burada mesajlaşabilirsin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200/50 dark:border-dark-border/80 overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Left: Conversation List */}
          <div className={`w-full md:w-[360px] md:border-r border-neutral-200 dark:border-dark-border flex flex-col shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-neutral-100 dark:border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-h3 font-bold text-neutral-900 dark:text-dark-textPrimary flex items-center gap-2">
                  Mesajlar
                  {totalUnread > 0 && <span className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">{totalUnread}</span>}
                </h1>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Konuşma ara..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised text-body-sm text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button key={conv.id} onClick={() => handleSelect(conv)} className={`w-full text-left px-4 py-3.5 border-b border-neutral-50 dark:border-dark-border/50 hover:bg-neutral-50 dark:hover:bg-dark-surfaceRaised transition-colors ${selectedId === conv.id ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-accent' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm">{conv.participantInitials}</div>
                      {conv.unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">{conv.unreadCount}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-body-md font-semibold truncate ${conv.unreadCount > 0 ? 'text-neutral-900 dark:text-dark-textPrimary' : 'text-neutral-700 dark:text-dark-textSecondary'}`}>{conv.participantName}</span>
                          {conv.participantVerified && <CheckCircle size={12} className="text-success shrink-0" />}
                        </div>
                        <span className="text-body-sm text-neutral-400 shrink-0 ml-2">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      {conv.listingTitle && <p className="text-body-sm text-neutral-400 truncate mb-0.5">{conv.listingTitle}</p>}
                      <p className={`text-body-sm truncate ${conv.unreadCount > 0 ? 'text-neutral-700 dark:text-dark-textPrimary font-medium' : 'text-neutral-400'}`}>{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center">
                  <MessageSquare size={24} className="mx-auto mb-2 text-neutral-300" />
                  <p className="text-body-md text-neutral-400">Konuşma bulunamadı</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Chat View */}
          <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            {selected ? (
              <>
                <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-dark-border flex items-center gap-3">
                  <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                    <ArrowLeft size={18} className="text-neutral-500" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-body-sm">{selected.participantInitials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-body-md font-semibold text-neutral-900 dark:text-dark-textPrimary truncate">{selected.participantName}</h3>
                      {selected.participantVerified && <CheckCircle size={14} className="text-success shrink-0" />}
                    </div>
                    {selected.listingId && (
                      <Link href={`/listing/${selected.listingId}`} className="text-body-sm text-accent hover:text-accent-600 transition-colors truncate block">{selected.listingTitle}</Link>
                    )}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-surfaceRaised transition-colors">
                    <MoreVertical size={18} className="text-neutral-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-neutral-100 dark:bg-dark-border" />
                        <span className="text-body-sm text-neutral-400 shrink-0">{date}</span>
                        <div className="flex-1 h-px bg-neutral-100 dark:bg-dark-border" />
                      </div>
                      {msgs.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-accent text-white rounded-br-md' : 'bg-neutral-100 dark:bg-dark-surfaceRaised text-neutral-900 dark:text-dark-textPrimary rounded-bl-md'}`}>
                              <p className="text-body-md leading-relaxed">{msg.text}</p>
                              <p className={`text-[11px] mt-1 ${isMe ? 'text-white/60' : 'text-neutral-400'}`}>{formatTime(msg.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-dark-border">
                  <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mesaj yazın..."
                      className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-surfaceRaised text-body-md text-neutral-900 dark:text-dark-textPrimary placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                    <button type="submit" disabled={!newMessage.trim()} className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-600 active:scale-[0.95] disabled:opacity-40 disabled:pointer-events-none transition-all">
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 text-neutral-200 dark:text-dark-border" />
                  <h3 className="text-h4 font-semibold text-neutral-500 mb-1">Mesaj Seçin</h3>
                  <p className="text-body-md text-neutral-400">Sol panelden bir konuşma seçerek mesajlaşmaya başlayın.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
