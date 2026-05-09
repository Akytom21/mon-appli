import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useChat, type ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';

const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

function formatMsgTime(ts: { toMillis: () => number } | null): string {
  if (!ts?.toMillis) return '';
  return new Date(ts.toMillis()).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

export default function ChatScreen() {
  const { appointmentId, recipientId, name } = useLocalSearchParams<{
    appointmentId: string;
    recipientId: string;
    name: string;
  }>();

  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAllRead } = useChat(
    appointmentId ?? '',
    recipientId ?? '',
  );
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    markAllRead();
  }, [messages.length, markAllRead]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
  }, [input, sending, sendMessage]);

  const reversedMessages = [...messages].reverse();
  const myLastMsg  = reversedMessages.find((m) => m.senderId === user?.id);
  const showReadId = myLastMsg?.read ? myLastMsg.id : null;

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMine = item.senderId === user?.id;
      const time   = formatMsgTime(item.createdAt);

      return (
        <View style={[st.msgOuter, isMine ? st.msgOuterMine : st.msgOuterTheirs]}>
          {!isMine && (
            <View style={st.avatar}>
              <Text style={st.avatarText}>{getInitials(item.senderName)}</Text>
            </View>
          )}
          <View style={{ maxWidth: '75%', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 3 }}>
            <View style={[st.bubble, isMine ? st.bubbleMine : st.bubbleTheirs]}>
              <Text style={[st.bubbleText, isMine ? st.bubbleTextMine : st.bubbleTextTheirs]}>
                {item.text}
              </Text>
            </View>
            <View style={[st.timeRow, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
              <Text style={st.timeText}>{time}</Text>
              {isMine && item.id === showReadId && (
                <Text style={st.readLabel}>· Lu ✓</Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [user?.id, showReadId],
  );

  const interlocutorName =
    name ?? (user?.role === 'sourd' ? 'Interprète' : 'Patient');

  return (
    <SafeAreaView style={st.safe} edges={['top']}>

      {/* ── Header ──────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity
          style={st.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerAvatar}>
          <Text style={st.headerAvatarText}>{getInitials(interlocutorName)}</Text>
        </View>
        <View style={st.headerInfo}>
          <Text style={st.headerName} numberOfLines={1}>{interlocutorName}</Text>
          <Text style={st.headerSub}>Messagerie PharmaSign · Sécurisée</Text>
        </View>
      </View>

      {/* ── Body ────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={st.centered}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : messages.length === 0 ? (
          <View style={st.emptyWrap}>
            <Text style={st.emptyIcon}>💬</Text>
            <Text style={st.emptyTitle}>Démarrez la conversation</Text>
            <Text style={st.emptySub}>
              {user?.role === 'sourd'
                ? 'Envoyez un message pour contacter votre interprète'
                : 'Envoyez un message pour contacter le patient'}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            inverted
            contentContainerStyle={st.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Input bar ───────────────────────────── */}
        <View style={st.inputBar}>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Écrivez un message…"
            placeholderTextColor={INK_3}
            multiline
            maxLength={1000}
            accessibilityLabel="Zone de saisie du message"
          />
          <TouchableOpacity
            style={[st.sendBtn, (!input.trim() || sending) && st.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BRAND,
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: BRAND_DARK,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  headerSub:  { fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 1 },

  /* Empty state */
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 10,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: INK, textAlign: 'center', letterSpacing: -0.3 },
  emptySub:   { fontSize: 14, color: INK_2, textAlign: 'center', lineHeight: 21 },

  /* List */
  listContent: { paddingVertical: 16, paddingHorizontal: 14, gap: 10 },

  /* Message row */
  msgOuter:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgOuterMine:   { justifyContent: 'flex-end' },
  msgOuterTheirs: { justifyContent: 'flex-start' },

  /* Avatar (received) */
  avatar: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  /* Bubble */
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: {
    backgroundColor: BRAND,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  bubbleText:      { fontSize: 14.5, lineHeight: 21 },
  bubbleTextMine:  { color: '#fff' },
  bubbleTextTheirs:{ color: INK },

  /* Time row */
  timeRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  timeText:  { fontSize: 11, color: INK_3 },
  readLabel: { fontSize: 11, color: BRAND, fontWeight: '600' },

  /* Input bar */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  input: {
    flex: 1, fontSize: 15, color: INK,
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 120, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  sendBtnOff: { backgroundColor: INK_3, shadowOpacity: 0, elevation: 0 },
});
