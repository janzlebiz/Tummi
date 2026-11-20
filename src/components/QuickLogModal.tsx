import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';
import {
  AcceptanceLevel,
  FeedingStyle,
  FoodItem,
  MealType,
  ReactionSeverity,
} from '../types';
import { getTodayISO } from '../utils/babyAge';

interface Props {
  visible: boolean;
  food: FoodItem | null;
  onClose: () => void;
}

const SYMPTOM_OPTIONS = ['Rash around mouth', 'Hives', 'Fussiness', 'Vomiting', 'Diarrhea', 'Swelling'];

export const QuickLogModal: React.FC<Props> = ({ visible, food, onClose }) => {
  const { activeBaby, addLogEntry } = useApp();
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [prepUsed, setPrepUsed] = useState<FeedingStyle>(activeBaby.feedingStyle);
  const [acceptance, setAcceptance] = useState<AcceptanceLevel>('liked');
  const [reactionSeverity, setReactionSeverity] = useState<ReactionSeverity>('none');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!food) return null;

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) => (prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]));
  };

  const handleSave = () => {
    addLogEntry({
      babyId: activeBaby.id,
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      date: getTodayISO(),
      mealType,
      prepUsed,
      acceptance,
      reactionSeverity,
      reactionSymptoms: reactionSeverity === 'none' ? [] : symptoms,
      notes: notes.trim(),
      allergens: food.allergens,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setReactionSeverity('none');
    setSymptoms([]);
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {food.emoji} Log {food.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Meal</Text>
            <View style={styles.row}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, mealType === m && styles.chipActive]}
                  onPress={() => setMealType(m)}
                >
                  <Text style={[styles.chipText, mealType === m && styles.chipTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>How was it served?</Text>
            <View style={styles.row}>
              {([
                { id: 'blw', label: 'Finger Food (BLW)' },
                { id: 'purees', label: 'Purée / Mash' },
                { id: 'combo', label: 'Combo' },
              ] as { id: FeedingStyle; label: string }[]).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, prepUsed === p.id && styles.chipActive]}
                  onPress={() => setPrepUsed(p.id)}
                >
                  <Text style={[styles.chipText, prepUsed === p.id && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>How did {activeBaby.name} like it?</Text>
            <View style={styles.row}>
              {([
                { id: 'loved', label: '😍 Loved' },
                { id: 'liked', label: '🙂 Liked' },
                { id: 'neutral', label: '😐 Neutral' },
                { id: 'disliked', label: '😖 Disliked' },
              ] as { id: AcceptanceLevel; label: string }[]).map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.chip, acceptance === a.id && styles.chipActive]}
                  onPress={() => setAcceptance(a.id)}
                >
                  <Text style={[styles.chipText, acceptance === a.id && styles.chipTextActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Any reaction?</Text>
            <View style={styles.row}>
              {(['none', 'mild', 'moderate', 'severe'] as ReactionSeverity[]).map((sev) => (
                <TouchableOpacity
                  key={sev}
                  style={[
                    styles.chip,
                    reactionSeverity === sev &&
                      (sev === 'none' ? styles.chipSage : styles.chipDanger),
                  ]}
                  onPress={() => setReactionSeverity(sev)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      reactionSeverity === sev && styles.chipTextActive,
                    ]}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {reactionSeverity !== 'none' && (
              <View style={styles.symptomsBox}>
                <Text style={styles.subLabel}>Select symptoms (for pediatrician record):</Text>
                <View style={styles.row}>
                  {SYMPTOM_OPTIONS.map((sym) => (
                    <TouchableOpacity
                      key={sym}
                      style={[styles.chip, symptoms.includes(sym) && styles.chipDanger]}
                      onPress={() => toggleSymptom(sym)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          symptoms.includes(sym) && styles.chipTextActive,
                        ]}
                      >
                        {sym}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {reactionSeverity === 'severe' && (
                  <Text style={styles.emergencyText}>
                    ⚠️ If baby has difficulty breathing, swelling of lips/tongue, or repeated vomiting, seek emergency medical care immediately.
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mixed with oat cereal, great grip..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save to {activeBaby.name}’s Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 8,
  },
  subLabel: { fontSize: 13, fontWeight: '600', color: COLORS.danger, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipSage: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipDanger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  symptomsBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
  },
  emergencyText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
