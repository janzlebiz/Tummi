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
import { FoodDetailModal } from '../components/FoodDetailModal';
import { QuickLogModal } from '../components/QuickLogModal';
import { useApp } from '../context/AppContext';
import { ALLERGENS } from '../data/allergens';
import { FOODS } from '../data/foods';
import { CHOKING_VS_GAGGING, READINESS_QUESTIONS } from '../data/readinessQuiz';
import { RECIPES } from '../data/recipes';
import { COLORS, SHADOWS } from '../theme/colors';
import { FoodItem } from '../types';
import { getBabyAgeInfo, getTodayISO } from '../utils/babyAge';

interface Props {
  onNavigateTab: (tab: 'Home' | 'Foods' | 'Log' | 'Plan' | 'Ask') => void;
}

export const HomeScreen: React.FC<Props> = ({ onNavigateTab }) => {
  const { activeBaby, activeBabyLogs, mealPlan } = useApp();
  const ageInfo = getBabyAgeInfo(activeBaby);

  const [detailFood, setDetailFood] = useState<FoodItem | null>(null);
  const [logFood, setLogFood] = useState<FoodItem | null>(null);
  const [safetyModal, setSafetyModal] = useState(false);
  const [quizModal, setQuizModal] = useState(false);
  const [calcModal, setCalcModal] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, boolean>>({});
  const [weightKg, setWeightKg] = useState('7.5');

  const uniqueFoodsCount = new Set(activeBabyLogs.map((l) => l.foodId)).size;
  const introducedAllergens = new Set(activeBabyLogs.flatMap((l) => l.allergens));
  const progressPct = Math.min(100, Math.round((uniqueFoodsCount / 100) * 100));

  const todayISO = getTodayISO();
  const todayPlan = mealPlan.find((d) => d.date === todayISO) || mealPlan[0];
  const breakfast = RECIPES.find((r) => r.id === todayPlan?.breakfastId);
  const lunch = RECIPES.find((r) => r.id === todayPlan?.lunchId);
  const dinner = RECIPES.find((r) => r.id === todayPlan?.dinnerId);

  const quickFoods = FOODS.slice(0, 8);
  const quizYesCount = Object.values(quizAnswers).filter(Boolean).length;

  const parsedWeight = parseFloat(weightKg) || 0;
  const minKcal = Math.round(parsedWeight * 80);
  const maxKcal = Math.round(parsedWeight * 120);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {activeBaby.name}’s Parent 👋</Text>
          <Text style={styles.subGreeting}>
            {ageInfo.label} • {ageInfo.stage} • {activeBaby.feedingStyle.toUpperCase()} • 100% Free
          </Text>
        </View>
        <TouchableOpacity style={styles.safetyBtn} onPress={() => setSafetyModal(true)}>
          <Text style={styles.safetyBtnText}>🚨 Safety</Text>
        </TouchableOpacity>
      </View>

      {/* 100 Foods Progress Card */}
      <View style={[styles.card, SHADOWS.card]}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>100 Foods Before 1</Text>
          <Text style={styles.progressBadge}>{uniqueFoodsCount} / 100</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(4, progressPct)}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => onNavigateTab('Log')}>
            <Text style={styles.statNum}>{activeBabyLogs.length}</Text>
            <Text style={styles.statLabel}>Meals Logged</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => onNavigateTab('Log')}>
            <Text style={styles.statNum}>{introducedAllergens.size} / 9</Text>
            <Text style={styles.statLabel}>Allergens</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox} onPress={() => onNavigateTab('Foods')}>
            <Text style={styles.statNum}>{FOODS.length}+</Text>
            <Text style={styles.statLabel}>Food Guides</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Log Popular First Foods */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Food Guides & Log</Text>
        <TouchableOpacity onPress={() => onNavigateTab('Foods')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizScroll}>
        {quickFoods.map((food) => {
          const tried = activeBabyLogs.some((l) => l.foodId === food.id);
          return (
            <TouchableOpacity
              key={food.id}
              style={[styles.foodChipCard, SHADOWS.card]}
              onPress={() => setDetailFood(food)}
            >
              <Text style={styles.foodEmoji}>{food.emoji}</Text>
              <Text style={styles.foodName} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={[styles.foodTag, tried && { color: COLORS.secondary }]}>
                {tried ? '✓ Tried' : food.ironRich ? '⚡ Iron' : 'Guide'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Today's Meal Plan */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
        <TouchableOpacity onPress={() => onNavigateTab('Plan')}>
          <Text style={styles.seeAll}>Full Week →</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, SHADOWS.card]}>
        {[
          { label: 'Breakfast', item: breakfast },
          { label: 'Lunch', item: lunch },
          { label: 'Dinner', item: dinner },
        ].map((slot, idx) => (
          <TouchableOpacity
            key={slot.label}
            style={[styles.mealRow, idx < 2 && styles.mealDivider]}
            onPress={() => onNavigateTab('Plan')}
          >
            <Text style={styles.mealEmoji}>{slot.item?.emoji || '🍽️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mealSlot}>{slot.label}</Text>
              <Text style={styles.mealTitle}>{slot.item?.title || 'Tap to plan'}</Text>
            </View>
            <Text style={styles.mealTime}>{slot.item?.prepTimeMins || 10}m</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 9 Allergens Quick Strip */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top 9 Allergens</Text>
        <TouchableOpacity onPress={() => onNavigateTab('Log')}>
          <Text style={styles.seeAll}>Tracker →</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.card, SHADOWS.card]}>
        <View style={styles.allergenGrid}>
          {ALLERGENS.map((a) => {
            const done = introducedAllergens.has(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.allergenPill, done && styles.allergenPillDone]}
                onPress={() => onNavigateTab('Log')}
              >
                <Text style={styles.allergenText}>
                  {a.emoji} {a.name} {done ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Parent Tools */}
      <Text style={styles.sectionTitle}>Parent Tools</Text>
      <View style={styles.toolsRow}>
        <TouchableOpacity style={[styles.toolCard, SHADOWS.card]} onPress={() => setQuizModal(true)}>
          <Text style={styles.toolEmoji}>✅</Text>
          <Text style={styles.toolTitle}>Readiness Quiz</Text>
          <Text style={styles.toolSub}>6 AAP signs check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolCard, SHADOWS.card]} onPress={() => setCalcModal(true)}>
          <Text style={styles.toolEmoji}>🧮</Text>
          <Text style={styles.toolTitle}>Calorie Calc</Text>
          <Text style={styles.toolSub}>80–120 kcal/kg/day</Text>
        </TouchableOpacity>
      </View>

      <FoodDetailModal
        visible={!!detailFood}
        food={detailFood}
        onClose={() => setDetailFood(null)}
        onLogPress={(f) => setLogFood(f)}
      />
      <QuickLogModal visible={!!logFood} food={logFood} onClose={() => setLogFood(null)} />

      {/* Safety Modal: Gagging vs Choking */}
      <Modal visible={safetyModal} animationType="slide" transparent onRequestClose={() => setSafetyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 Gagging vs. Choking</Text>
              <TouchableOpacity onPress={() => setSafetyModal(false)}>
                <Text style={styles.seeAll}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {[CHOKING_VS_GAGGING.gagging, CHOKING_VS_GAGGING.choking].map((sec) => (
                <View key={sec.title} style={[styles.safetyBox, { borderLeftColor: sec.color }]}>
                  <Text style={[styles.safetyBoxTitle, { color: sec.color }]}>{sec.title}</Text>
                  {sec.points.map((pt) => (
                    <Text key={pt} style={styles.safetyPoint}>
                      • {pt}
                    </Text>
                  ))}
                </View>
              ))}
              <Text style={styles.disclaimer}>
                Disclaimer: Tummi provides general feeding education, not medical care. In an emergency, call local emergency services immediately.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Readiness Quiz Modal */}
      <Modal visible={quizModal} animationType="slide" transparent onRequestClose={() => setQuizModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Is {activeBaby.name} Ready?</Text>
              <TouchableOpacity onPress={() => setQuizModal(false)}>
                <Text style={styles.seeAll}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {READINESS_QUESTIONS.map((q) => {
                const checked = !!quizAnswers[q.id];
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.quizItem, checked && styles.quizItemChecked]}
                    onPress={() => setQuizAnswers((p) => ({ ...p, [q.id]: !p[q.id] }))}
                  >
                    <Text style={styles.quizCheck}>{checked ? '☑️' : '⬜️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizQ}>{q.question}</Text>
                      <Text style={styles.quizD}>{q.detail}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.quizResult}>
                <Text style={styles.quizResultTitle}>
                  Score: {quizYesCount} / {READINESS_QUESTIONS.length}
                </Text>
                <Text style={styles.quizResultBody}>
                  {quizYesCount === 6
                    ? '🎉 All 6 readiness signs checked! Confirm with your pediatrician and start with soft iron-rich foods.'
                    : 'Most babies show all 6 signs around 6 months. Check with your pediatrician before starting solids.'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calorie Calculator Modal */}
      <Modal visible={calcModal} animationType="slide" transparent onRequestClose={() => setCalcModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Baby Calorie Estimator</Text>
              <TouchableOpacity onPress={() => setCalcModal(false)}>
                <Text style={styles.seeAll}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.quizD}>
              Pediatric guideline: ~80–120 kcal per kg of body weight per day (primarily from breast milk or formula before 12 months).
            </Text>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Baby Weight (kg)</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="decimal-pad"
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="e.g. 7.5"
            />
            <View style={styles.quizResult}>
              <Text style={styles.quizResultTitle}>
                Estimated Daily Need: {minKcal} – {maxKcal} kcal/day
              </Text>
              <Text style={styles.quizResultBody}>
                Solids complement milk from 6–12m; follow baby’s hunger & fullness cues rather than strict calorie counting.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  safetyBtn: { backgroundColor: COLORS.dangerLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  safetyBtnText: { color: COLORS.danger, fontWeight: '800', fontSize: 13 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginBottom: 18 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  progressBadge: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  progressTrack: { height: 10, backgroundColor: COLORS.cardAlt, borderRadius: 6, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  seeAll: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  horizScroll: { marginBottom: 18 },
  foodChipCard: {
    width: 105,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  foodEmoji: { fontSize: 30, marginBottom: 6 },
  foodName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  foodTag: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  mealDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mealEmoji: { fontSize: 26 },
  mealSlot: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  mealTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  mealTime: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  allergenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenPill: {
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  allergenPillDone: { backgroundColor: COLORS.secondaryLight },
  allergenText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  toolsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toolCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14 },
  toolEmoji: { fontSize: 24, marginBottom: 6 },
  toolTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  toolSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  safetyBox: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderLeftWidth: 4, marginBottom: 12 },
  safetyBoxTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  safetyPoint: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: 4 },
  disclaimer: { fontSize: 12, color: COLORS.textMuted, marginTop: 6, marginBottom: 16 },
  quizItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quizItemChecked: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondaryLight },
  quizCheck: { fontSize: 18 },
  quizQ: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  quizD: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  quizResult: { backgroundColor: COLORS.cardAlt, padding: 14, borderRadius: 14, marginTop: 10, marginBottom: 20 },
  quizResultTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  quizResultBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  calcInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
