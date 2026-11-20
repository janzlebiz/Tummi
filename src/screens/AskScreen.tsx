import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS } from '../theme/colors';
import { FeedingStyle } from '../types';
import { askTummiAssistant } from '../utils/assistant';
import { getBabyAgeInfo } from '../utils/babyAge';

const SUGGESTED_PROMPTS = [
  'What can I make with tried foods?',
  'How do I serve blueberries safely?',
  'How to introduce allergens?',
  'Gagging vs choking?',
  'How many meals per day?',
];

export const AskScreen: React.FC = () => {
  const {
    babies,
    activeBaby,
    activeBabyLogs,
    chatMessages,
    settings,
    addChatMessage,
    clearChat,
    updateBaby,
    addBaby,
    setActiveBabyId,
    updateSettings,
  } = useApp();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(activeBaby.name);
  const [editDob, setEditDob] = useState(activeBaby.birthDate);
  const [editStyle, setEditStyle] = useState<FeedingStyle>(activeBaby.feedingStyle);
  const [editPremature, setEditPremature] = useState(!!activeBaby.isPremature);
  const [editWeeksEarly, setEditWeeksEarly] = useState(String(activeBaby.weeksEarly || 0));
  const [editCulture, setEditCulture] = useState(activeBaby.cultureNotes);

  const openSettings = () => {
    setEditName(activeBaby.name);
    setEditDob(activeBaby.birthDate);
    setEditStyle(activeBaby.feedingStyle);
    setEditPremature(!!activeBaby.isPremature);
    setEditWeeksEarly(String(activeBaby.weeksEarly || 0));
    setEditCulture(activeBaby.cultureNotes);
    setSettingsOpen(true);
  };

  const saveProfile = () => {
    updateBaby({
      ...activeBaby,
      name: editName.trim() || 'Baby',
      birthDate: /^\d{4}-\d{2}-\d{2}$/.test(editDob.trim()) ? editDob.trim() : activeBaby.birthDate,
      feedingStyle: editStyle,
      isPremature: editPremature,
      weeksEarly: parseInt(editWeeksEarly, 10) || 0,
      cultureNotes: editCulture.trim(),
    });
    setSettingsOpen(false);
  };

  const handleSend = async (promptText?: string) => {
    const q = (promptText ?? input).trim();
    if (!q || loading) return;
    if (!promptText) setInput('');
    addChatMessage({ role: 'user', text: q });
    setLoading(true);
    try {
      const reply = await askTummiAssistant(q, activeBaby, activeBabyLogs, settings);
      addChatMessage({ role: 'assistant', text: reply });
    } finally {
      setLoading(false);
    }
  };

  const ageInfo = getBabyAgeInfo(activeBaby);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ask Tummi</Text>
          <Text style={styles.sub}>
            Knows {activeBaby.name} ({ageInfo.label}) •{' '}
            {settings.aiProvider === 'offline' ? 'Offline Mode (Free)' : `${settings.aiProvider.toUpperCase()} Connected`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {chatMessages.length > 0 && (
            <TouchableOpacity style={styles.iconBtn} onPress={clearChat}>
              <Text style={styles.iconBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.profileBtn} onPress={openSettings}>
            <Text style={styles.profileBtnText}>⚙️ Profile & AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.chatContent}>
        {chatMessages.length === 0 ? (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeEmoji}>🥑</Text>
            <Text style={styles.welcomeTitle}>Personal Feeding Assistant</Text>
            <Text style={styles.welcomeSub}>
              Ask about food prep, choking safety, allergens, or meal ideas tailored to {activeBaby.name}’s history.
            </Text>
            <View style={styles.promptWrap}>
              {SUGGESTED_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.promptChip, SHADOWS.card]}
                  onPress={() => handleSend(p)}
                >
                  <Text style={styles.promptText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' && { color: COLORS.white },
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))
        )}
        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.bubbleText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={`Ask about ${activeBaby.name}’s food...`}
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Profile & AI Settings Modal */}
      <Modal
        visible={settingsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Baby Profile & AI Settings</Text>
              <TouchableOpacity onPress={() => setSettingsOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Multi-baby switcher */}
              <Text style={styles.label}>Active Baby Profile</Text>
              <View style={styles.rowWrap}>
                {babies.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chip, b.id === activeBaby.id && styles.chipActive]}
                    onPress={() => {
                      setActiveBabyId(b.id);
                      setEditName(b.name);
                      setEditDob(b.birthDate);
                      setEditStyle(b.feedingStyle);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        b.id === activeBaby.id && { color: COLORS.white },
                      ]}
                    >
                      👶 {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() =>
                    addBaby({
                      name: `Baby ${babies.length + 1}`,
                      birthDate: activeBaby.birthDate,
                      feedingStyle: 'combo',
                      restrictions: [],
                      cultureNotes: '',
                    })
                  }
                >
                  <Text style={styles.chipText}>+ Add Baby</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Baby’s Name</Text>
              <TextInput style={styles.field} value={editName} onChangeText={setEditName} />

              <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.field}
                value={editDob}
                onChangeText={setEditDob}
                placeholder="2026-05-10"
              />

              <Text style={styles.label}>Feeding Style</Text>
              <View style={styles.rowWrap}>
                {(['blw', 'purees', 'combo'] as FeedingStyle[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, editStyle === st && styles.chipActive]}
                    onPress={() => setEditStyle(st)}
                  >
                    <Text style={[styles.chipText, editStyle === st && { color: COLORS.white }]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Born Premature? (Adjust Age)</Text>
                <Switch value={editPremature} onValueChange={setEditPremature} />
              </View>
              {editPremature && (
                <TextInput
                  style={styles.field}
                  keyboardType="number-pad"
                  value={editWeeksEarly}
                  onChangeText={setEditWeeksEarly}
                  placeholder="Weeks early (e.g. 4)"
                />
              )}

              <Text style={styles.label}>Cultural / Dietary Notes</Text>
              <TextInput
                style={styles.field}
                value={editCulture}
                onChangeText={setEditCulture}
                placeholder="e.g. Vegetarian, South Asian spices"
              />

              <Text style={[styles.label, { marginTop: 18 }]}>
                AI Assistant Engine (100% Optional)
              </Text>
              <View style={styles.rowWrap}>
                {(['offline', 'gemini', 'openai'] as const).map((prov) => (
                  <TouchableOpacity
                    key={prov}
                    style={[styles.chip, settings.aiProvider === prov && styles.chipSage]}
                    onPress={() => updateSettings({ aiProvider: prov })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        settings.aiProvider === prov && { color: COLORS.white },
                      ]}
                    >
                      {prov === 'offline' ? 'Free Offline' : prov.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {settings.aiProvider !== 'offline' && (
                <TextInput
                  style={[styles.field, { marginTop: 8 }]}
                  value={settings.apiKey}
                  onChangeText={(val) => updateSettings({ apiKey: val })}
                  placeholder={`Paste personal ${settings.aiProvider} API key`}
                  secureTextEntry
                />
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Save Profile & Settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  iconBtn: { backgroundColor: COLORS.cardAlt, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  iconBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  profileBtn: { backgroundColor: COLORS.secondaryLight, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  profileBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.secondary },
  chatContent: { padding: 16, paddingBottom: 20 },
  welcomeBox: { alignItems: 'center', marginTop: 16 },
  welcomeEmoji: { fontSize: 42, marginBottom: 8 },
  welcomeTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  welcomeSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  promptWrap: { width: '100%', gap: 8 },
  promptChip: { backgroundColor: COLORS.card, padding: 12, borderRadius: 14 },
  promptText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  bubble: { maxWidth: '86%', padding: 13, borderRadius: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  sendBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center' },
  sendText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  closeText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 12, marginBottom: 6 },
  field: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 11, color: COLORS.text },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipSage: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 22, marginBottom: 20 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
