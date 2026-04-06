import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal, Pressable, Alert, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/contexts/ThemeContext';
import { normalizeAppAttachments, resolveAppMediaUrl } from '../../src/lib/media';
import { Button } from '../../src/components/ui';
import { Conversation, Message, MessageAttachment } from '../../src/types';
import { borderRadius, fontFamily, space } from '../../src/theme';

type ChatMessage = Message & { sender?: { id: string; name: string } };
type ReportReason = 'spam' | 'harassment' | 'fraud' | 'inappropriate' | 'other';
type UploadAsset = { uri: string; name: string; type: string; size: number };

const AVATARS = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'];

const avatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATARS[Math.abs(hash) % AVATARS.length];
};

const isOnline = (lastSeen: string | null) => !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 60000;
const formatTime = (date: string) => new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const formatSize = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`);
const isImage = (type: string) => /^image\//i.test(type);

function dateLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const scrollRef = useRef<ScrollView>(null);
  const lastIncomingMessageIdRef = useRef<string | null>(null);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reportDetail, setReportDetail] = useState('');
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const messagePlayer = useAudioPlayer(require('../../assets/sounds/message-in.wav'));

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const data = (await api.get('/api/conversations')).data as Conversation[];
      return data.map((item) => ({
        ...item,
        participantImage: resolveAppMediaUrl(item.participantImage ?? null),
      }));
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const conversation = useMemo(() => conversations.find((item) => item.id === id) || null, [conversations, id]);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['conversation-messages', id],
    queryFn: async () => {
      const data = (await api.get(`/api/conversations/${id}/messages`)).data as ChatMessage[];
      return data.map((message) => ({
        ...message,
        attachments: normalizeAppAttachments(message.attachments),
      }));
    },
    enabled: !!id && !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!user) return;
    const ping = () => api.post('/api/users/heartbeat').catch(() => {});
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['conversations'] });
    qc.invalidateQueries({ queryKey: ['unread-count'] });
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 40);
    return () => clearTimeout(t);
  }, [messages.length, qc]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    const previousMessageId = lastIncomingMessageIdRef.current;
    lastIncomingMessageIdRef.current = latestMessage.id;

    if (!previousMessageId || latestMessage.id === previousMessageId) return;
    if (latestMessage.senderId === user?.id) return;

    try {
      messagePlayer.seekTo(0);
      messagePlayer.play();
    } catch {}
  }, [messagePlayer, messages, user?.id]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: ChatMessage[] }[] = [];
    let currentKey = '';
    for (const message of messages) {
      const key = new Date(message.createdAt).toDateString();
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label: dateLabel(message.createdAt), items: [message] });
      } else {
        groups[groups.length - 1].items.push(message);
      }
    }
    return groups;
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (payload: { text?: string; attachments?: MessageAttachment[] }) =>
      (await api.post(`/api/conversations/${id}/messages`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-messages', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const muteConversation = useMutation({
    mutationFn: async () => (await api.post(`/api/conversations/${id}/mute`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const reportUser = useMutation({
    mutationFn: async () => {
      if (!conversation?.participantId || !reportReason) throw new Error('Eksik bilgi');
      return api.post(`/api/users/${conversation.participantId}/report`, { reason: reportReason, detail: reportDetail || undefined });
    },
    onSuccess: () => {
      setReportOpen(false);
      setReportReason(null);
      setReportDetail('');
      Alert.alert('Gönderildi', 'Şikayetiniz alındı.');
    },
  });

  async function handleSend() {
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;
    setDraft('');
    await sendMessage.mutateAsync({ text });
  }

  async function uploadSelectedAssets(assets: UploadAsset[], loadingLabel: string, fallbackError: string) {
    if (!assets.length) return;

    const formData = new FormData();
    assets.forEach((asset) => {
      formData.append('files', asset as any);
    });

    setUploadingLabel(loadingLabel);
    try {
      const { data } = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const attachments = assets.map((item, index) => ({
        name: item.name,
        type: item.type,
        size: item.size,
        url: data.urls[index],
      }));
      await sendMessage.mutateAsync({ attachments });
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.error || fallbackError);
    } finally {
      setUploadingLabel(null);
    }
  }

  async function handlePickImages() {
    setAttachmentSheetOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Görsel göndermek için galeri izni vermen gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const assets: UploadAsset[] = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `image-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || 'image/jpeg',
      size: asset.fileSize || 0,
    }));

    await uploadSelectedAssets(assets, 'Görsel yükleniyor...', 'Görsel yüklenemedi.');
  }

  async function handlePickDocuments() {
    setAttachmentSheetOpen(false);
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/octet-stream',
      ],
    });
    if (result.canceled || !result.assets?.length) return;

    const assets: UploadAsset[] = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.name || `file-${Date.now()}-${index}`,
      type: asset.mimeType || 'application/octet-stream',
      size: asset.size || 0,
    }));

    await uploadSelectedAssets(assets, 'Dosya yukleniyor...', 'Dosya yuklenemedi.');
  }

  function handleDelete() {
    setMenuOpen(false);
    Alert.alert('Sohbeti sil', 'Bu sohbeti silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/api/conversations/${id}`);
          qc.invalidateQueries({ queryKey: ['conversations'] });
          qc.invalidateQueries({ queryKey: ['unread-count'] });
          router.back();
        },
      },
    ]);
  }

  function handleBlock() {
    setMenuOpen(false);
    Alert.alert('Kullanıcıyı engelle', `${conversation?.participantName} adlı kullanıcıyı engellemek istiyor musun?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          if (!conversation?.participantId) return;
          await api.post(`/api/users/${conversation.participantId}/block`);
          qc.invalidateQueries({ queryKey: ['conversations'] });
          router.back();
        },
      },
    ]);
  }

  const avatar = avatarColor(conversation?.participantName || 'Kullanıcı');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerMain}
            activeOpacity={0.8}
            onPress={() => conversation?.participantId && router.push(`/user/${conversation.participantId}` as any)}
          >
            <View style={[styles.avatar, { backgroundColor: avatar }]}>
              {conversation?.participantImage ? (
                <Image source={{ uri: conversation.participantImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{conversation?.participantInitials || 'K'}</Text>
              )}
              {isOnline(conversation?.participantLastSeen || null) && <View style={styles.onlineDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName} numberOfLines={1}>{conversation?.participantName || 'Mesaj'}</Text>
                {conversation?.participantVerified && (
                  <Ionicons name="checkmark-circle" size={15} color={colors.success.DEFAULT} />
                )}
              </View>
              <Text style={styles.headerMeta} numberOfLines={1}>
                {isOnline(conversation?.participantLastSeen || null)
                  ? 'çevrimiçi'
                  : conversation?.listingTitle || 'çevrimdışı'}
              </Text>
            </View>
          </TouchableOpacity>

          {conversation?.listingId && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push(`/listing/${conversation.listingId}` as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="briefcase-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.headerBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.8}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {conversation?.acceptedOfferId && conversation.acceptedOfferStatus === 'accepted' && (
          <TouchableOpacity style={styles.banner} onPress={() => router.push('/orders' as any)} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent.DEFAULT} />
            <Text style={styles.bannerText}>Teslimat tamamlandıysa siparişlerden onaylayın</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent.DEFAULT} />
          </TouchableOpacity>
        )}

        <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.accent.DEFAULT} /></View>
          ) : grouped.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>Mesajlaşmaya başlayın</Text></View>
          ) : (
            grouped.map((group) => (
              <View key={group.label}>
                <View style={styles.dateWrap}><Text style={styles.dateText}>{group.label}</Text></View>
                {group.items.map((message, index) => {
                  const mine = message.senderId === user?.id;
                  const roundedTail = index === group.items.length - 1 || group.items[index + 1]?.senderId !== message.senderId;
                  return (
                    <View key={message.id} style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowOther]}>
                      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, roundedTail && (mine ? styles.mineTail : styles.otherTail)]}>
                        {message.attachments?.map((att, idx) => (
                          isImage(att.type) ? (
                            <TouchableOpacity key={`${message.id}-${idx}`} onPress={() => Linking.openURL(att.url)} activeOpacity={0.9}>
                              <Image source={{ uri: att.url }} style={styles.preview} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity key={`${message.id}-${idx}`} style={styles.fileBox} onPress={() => Linking.openURL(att.url)} activeOpacity={0.85}>
                              <Ionicons name="attach-outline" size={16} color={colors.textPrimary} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.fileName} numberOfLines={1}>{att.name}</Text>
                                <Text style={styles.fileMeta}>{formatSize(att.size)}</Text>
                              </View>
                            </TouchableOpacity>
                          )
                        ))}
                        {!!message.text && (
                          <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextOther]}>
                            {message.text}
                          </Text>
                        )}
                        <View style={[styles.metaRow, mine && styles.metaRowMine]}>
                          <Text style={styles.metaText}>{formatTime(message.createdAt)}</Text>
                          {mine && <Ionicons name="checkmark-done" size={14} color="#38bdf8" />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.composer}>
          {uploadingLabel && (
            <View style={styles.uploadRow}>
              <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
              <Text style={styles.uploadText}>{uploadingLabel}</Text>
            </View>
          )}
          <View style={styles.composerRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachmentSheetOpen(true)} activeOpacity={0.8}>
              <Ionicons name="attach" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Mesaj yazın..."
              placeholderTextColor={colors.textTertiary}
              multiline
              selectionColor={colors.accent.DEFAULT}
            />
            <TouchableOpacity style={[styles.sendBtn, !draft.trim() && styles.disabledBtn]} onPress={handleSend} disabled={!draft.trim() || sendMessage.isPending} activeOpacity={0.85}>
              {sendMessage.isPending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={attachmentSheetOpen} transparent animationType="fade" onRequestClose={() => setAttachmentSheetOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setAttachmentSheetOpen(false)}>
            <View style={styles.sheet}>
              <TouchableOpacity style={styles.sheetItem} onPress={handlePickImages} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={18} color={colors.textPrimary} />
                <View style={styles.sheetCopy}>
                  <Text style={styles.sheetText}>Galeriden Görsel</Text>
                  <Text style={styles.sheetSubtext}>Bir veya daha fazla gorsel sec.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={handlePickDocuments} activeOpacity={0.8}>
                <Ionicons name="document-attach-outline" size={18} color={colors.textPrimary} />
                <View style={styles.sheetCopy}>
                  <Text style={styles.sheetText}>Belge Sec</Text>
                  <Text style={styles.sheetSubtext}>PDF, Word, Excel, TXT, ZIP ve benzeri dosyalar.</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
            <View style={styles.sheet}>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setMenuOpen(false); muteConversation.mutate(); }} activeOpacity={0.8}>
                <Ionicons name={conversation?.muted ? 'volume-high-outline' : 'volume-mute-outline'} size={18} color={colors.textPrimary} />
                <Text style={styles.sheetText}>{conversation?.muted ? 'Sesi Aç' : 'Sessize Al'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={() => { setMenuOpen(false); setReportOpen(true); }} activeOpacity={0.8}>
                <Ionicons name="flag-outline" size={18} color={colors.warning.DEFAULT} />
                <Text style={styles.sheetText}>Şikayet Et</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={handleBlock} activeOpacity={0.8}>
                <Ionicons name="ban-outline" size={18} color={colors.error.DEFAULT} />
                <Text style={[styles.sheetText, { color: colors.error.DEFAULT }]}>Engelle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={handleDelete} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={18} color={colors.error.DEFAULT} />
                <Text style={[styles.sheetText, { color: colors.error.DEFAULT }]}>Sohbeti Sil</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
          <Pressable style={styles.overlay} onPress={() => setReportOpen(false)}>
            <Pressable style={styles.reportCard}>
              <Text style={styles.reportTitle}>Kullanıcıyı Şikayet Et</Text>
              <View style={styles.reasons}>
                {[
                  { value: 'spam', label: 'Spam / İstenmeyen mesaj' },
                  { value: 'harassment', label: 'Taciz / Kötüye kullanım' },
                  { value: 'fraud', label: 'Dolandırıcılık' },
                  { value: 'inappropriate', label: 'Uygunsuz içerik' },
                  { value: 'other', label: 'Diğer' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.reasonBtn, reportReason === item.value && styles.reasonBtnActive]}
                    onPress={() => setReportReason(item.value as ReportReason)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.reasonText, reportReason === item.value && styles.reasonTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reportInput}
                value={reportDetail}
                onChangeText={setReportDetail}
                placeholder="Ek detay (isteğe bağlı)"
                placeholderTextColor={colors.textTertiary}
                multiline
                selectionColor={colors.accent.DEFAULT}
              />
              <View style={styles.reportActions}>
                <Button title="İptal" variant="secondary" onPress={() => setReportOpen(false)} style={{ flex: 1 }} />
                <Button title="Gönder" onPress={() => reportUser.mutate()} disabled={!reportReason} loading={reportUser.isPending} style={{ flex: 1 }} />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 20 },
  avatarText: { fontSize: 14, fontFamily: fontFamily.bold, color: colors.white },
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success.DEFAULT, borderWidth: 2, borderColor: colors.surface },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerName: { fontSize: 15, fontFamily: fontFamily.semiBold, color: colors.textPrimary, flexShrink: 1 },
  headerMeta: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.md, paddingVertical: space.sm + 2, backgroundColor: colors.accent.lighter, borderBottomWidth: 1, borderBottomColor: colors.accent.DEFAULT + '22' },
  bannerText: { flex: 1, fontSize: 12, fontFamily: fontFamily.semiBold, color: colors.accent.DEFAULT },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: space.md, paddingVertical: space.md, paddingBottom: space.lg },
  center: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center' },
  empty: { alignSelf: 'center', marginTop: 80, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: borderRadius.xl, backgroundColor: colors.surface },
  emptyText: { fontSize: 14, fontFamily: fontFamily.medium, color: colors.textSecondary },
  dateWrap: { alignItems: 'center', marginVertical: space.md },
  dateText: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textSecondary, backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 999 },
  msgRow: { flexDirection: 'row', marginBottom: 6 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: borderRadius.xl },
  bubbleMine: { backgroundColor: '#d9fdd3' },
  bubbleOther: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mineTail: { borderTopRightRadius: borderRadius.sm },
  otherTail: { borderTopLeftRadius: borderRadius.sm },
  preview: { width: 220, height: 170, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceRaised, marginBottom: 6 },
  fileBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: space.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceRaised, marginBottom: 6 },
  fileName: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textPrimary },
  fileMeta: { fontSize: 11, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  msgText: { fontSize: 15, fontFamily: fontFamily.regular, lineHeight: 21 },
  msgTextMine: { color: '#111827' },
  msgTextOther: { color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaRowMine: { alignSelf: 'flex-end' },
  metaText: { fontSize: 10, fontFamily: fontFamily.regular, color: colors.textSecondary },
  composer: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: Platform.OS === 'ios' ? space.md : space.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: space.sm, paddingBottom: space.sm },
  uploadText: { fontSize: 12, fontFamily: fontFamily.medium, color: colors.accent.DEFAULT },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  attachBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  input: { flex: 1, maxHeight: 120, minHeight: 42, paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: borderRadius.xl, backgroundColor: colors.surfaceRaised, fontSize: 15, fontFamily: fontFamily.regular, color: colors.textPrimary },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent.DEFAULT },
  disabledBtn: { opacity: 0.5 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', padding: space.md },
  sheet: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetCopy: { flex: 1 },
  sheetText: { fontSize: 15, fontFamily: fontFamily.medium, color: colors.textPrimary },
  sheetSubtext: { fontSize: 12, fontFamily: fontFamily.regular, color: colors.textSecondary, marginTop: 2 },
  reportCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  reportTitle: { fontSize: 18, fontFamily: fontFamily.bold, color: colors.textPrimary, marginBottom: space.md },
  reasons: { gap: 8, marginBottom: space.md },
  reasonBtn: { paddingHorizontal: space.md, paddingVertical: space.sm + 2, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  reasonBtnActive: { borderColor: colors.accent.DEFAULT, backgroundColor: colors.accent.lighter },
  reasonText: { fontSize: 13, fontFamily: fontFamily.medium, color: colors.textPrimary },
  reasonTextActive: { color: colors.accent.DEFAULT },
  reportInput: { minHeight: 90, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceRaised, paddingHorizontal: space.md, paddingVertical: space.sm + 2, fontSize: 14, fontFamily: fontFamily.regular, color: colors.textPrimary, textAlignVertical: 'top' },
  reportActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});



