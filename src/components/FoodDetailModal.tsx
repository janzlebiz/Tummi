import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ALLERGEN_MAP } from '../data/allergens';
import { useApp } from '../context/AppContext';
import { COLORS } from '../theme/colors';
import { AgeStage, FoodItem } from '../types';
import { getBabyAgeInfo } from '../utils/babyAge';

interface Props {
  visible: boolean;
  food: FoodItem | null;
  onClose: () => void;
  onLogPress: (food: FoodItem) => void;
}

export const FoodDetailModal: React.FC<Props> = ({
  visible,
  food,
  onClose,
  onLogPress,
}) => {
  const { activeBaby, activeBabyLogs } = useApp();
  const ageInfo = getBabyAgeInfo(activeBaby);
  const [selectedStage, setSelectedStage] = useState<AgeStage>(ageInfo.stage);

  useEffect(() => {
    setSelectedStage(ageInfo.stage);
  }, [ageInfo.stage, food?.id]);

  if (!food) return null;

  const prep = food.prepByAge.find((p) => p.stage === selectedStage) || food.prepByAge[0];
  const timesTried = activeBabyLogs.filter((l) => l.foodId === food.id).length;

  const riskColor =
    food.chokingRisk === 'high'
      ? COLORS.danger
      : food.chokingRisk === 'moderate'
      ? COLORS.amber
      : COLORS.secondary;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 34 }}>{food.emoji}</Text>
              <View>
                <Text style={styles.title}>{food.name}</Text>
                <Text style={styles.subtitle}>
                  {food.category} • Tried {timesTried}x
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: COLORS.secondaryLight }]}>
                <Text style={[styles.badgeText, { color: COLORS.secondary }]}>
                  {food.minAgeMonths}m+
                </Text>
              </View>
              {food.ironRich && (
                <View style={[styles.badge, { backgroundColor: COLORS.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: COLORS.primary }]}>⚡ Iron-Rich</Text>
                </View>
              )}
              {food.gentleOnTummy && (
                <View style={[styles.badge, { backgroundColor: COLORS.secondaryLight }]}>
                  <Text style={[styles.badgeText, { color: COLORS.secondary }]}>
                    🌿 Gentle on Tummy
                  </Text>
                </View>
              )}
              {food.allergens.map((a) => (
                <View key={a} style={[styles.badge, { backgroundColor: COLORS.amberLight }]}>
                  <Text style={[styles.badgeText, { color: '#9C650C' }]}>
                    {ALLERGEN_MAP[a].emoji} {ALLERGEN_MAP[a].name} Allergen
                  </Text>
                </View>
              ))}
            </View>

            {/* Choking safety card */}
            <View style={[styles.safetyCard, { borderLeftColor: riskColor }]}>
              <Text style={[styles.safetyTitle, { color: riskColor }]}>
                Choking Risk: {food.chokingRisk.toUpperCase()}
              </Text>
              <Text style={styles.safetyBody}>{food.chokingNotes}</Text>
            </View>

            {/* Age stage tabs */}
            <Text style={styles.sectionTitle}>How to Serve by Age</Text>
            <View style={styles.stageTabs}>
              {(['6-8m', '9-11m', '12m+'] as AgeStage[]).map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[styles.stageTab, selectedStage === stage && styles.stageTabActive]}
                  onPress={() => setSelectedStage(stage)}
                >
                  <Text
                    style={[
                      styles.stageTabText,
                      selectedStage === stage && styles.stageTabTextActive,
                    ]}
                  >
                    {stage}
                    {stage === ageInfo.stage ? ' (Current)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.prepCard}>
              <View style={styles.prepMeta}>
                <Text style={styles.metaPill}>✂️ Size: {prep.cutSize}</Text>
                <Text style={styles.metaPill}>🥣 Texture: {prep.texture}</Text>
              </View>

              <Text style={styles.prepHeading}>🖐️ Baby-Led Weaning (Finger Food)</Text>
              <Text style={styles.prepBody}>{prep.blw}</Text>

              <Text style={[styles.prepHeading, { marginTop: 12 }]}>🥄 Purée / Spoon-Feeding</Text>
              <Text style={styles.prepBody}>{prep.puree}</Text>
            </View>

            {/* Nutrition */}
            <Text style={styles.sectionTitle}>Nutrition Highlights</Text>
            <View style={styles.pillWrap}>
              {food.nutritionHighlights.map((n) => (
                <View key={n} style={styles.infoPill}>
                  <Text style={styles.infoPillText}>{n}</Text>
                </View>
              ))}
            </View>

            {/* Pairings */}
            <Text style={styles.sectionTitle}>Great Pairings</Text>
            <Text style={styles.pairingsText}>{food.pairings.join('  •  ')}</Text>

            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => {
                onClose();
                onLogPress(food);
              }}
            >
              <Text style={styles.logBtnText}>+ Log {food.name} for {activeBaby.name}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary },
  closeBtn: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  safetyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  safetyTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  safetyBody: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  stageTabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  stageTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  stageTabActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  stageTabText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  stageTabTextActive: { color: COLORS.white },
  prepCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prepMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaPill: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prepHeading: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  prepBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  infoPill: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  infoPillText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  pairingsText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  logBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
