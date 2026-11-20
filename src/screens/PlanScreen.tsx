import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { COLORS, SHADOWS } from '../theme/colors';
import { Recipe } from '../types';
import { getBabyAgeInfo, getTodayISO } from '../utils/babyAge';

type PlanTab = 'Weekly Plan' | 'Recipes' | 'Meal Check';

export const PlanScreen: React.FC = () => {
  const { activeBaby, mealPlan, regenerateMealPlan, swapMealInPlan, addLogEntry } = useApp();
  const ageInfo = getBabyAgeInfo(activeBaby);

  const [tab, setTab] = useState<PlanTab>('Weekly Plan');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'iron' | 'blw' | 'puree'>('all');

  // Meal Check state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [checkedFoodIds, setCheckedFoodIds] = useState<string[]>(['avocado', 'eggs']);

  const filteredRecipes = RECIPES.filter((r) => {
    if (recipeFilter === 'iron') return r.ironRich;
    if (recipeFilter === 'blw') return r.style === 'blw' || r.style === 'both';
    if (recipeFilter === 'puree') return r.style === 'puree' || r.style === 'both';
    return true;
  });

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const togglePlateFood = (id: string) => {
    setCheckedFoodIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const logPlateFoods = () => {
    const today = getTodayISO();
    checkedFoodIds.forEach((id) => {
      const food = FOODS.find((f) => f.id === id);
      if (food) {
        addLogEntry({
          babyId: activeBaby.id,
          foodId: food.id,
          foodName: food.name,
          emoji: food.emoji,
          date: today,
          mealType: 'lunch',
          prepUsed: activeBaby.feedingStyle,
          acceptance: 'liked',
          reactionSeverity: 'none',
          reactionSymptoms: [],
          notes: 'Logged via Meal Check',
          allergens: food.allergens,
        });
      }
    });
  };

  const logRecipeIngredients = (recipe: Recipe) => {
    const today = getTodayISO();
    recipe.ingredients.forEach((ing) => {
      if (!ing.foodId) return;
      const food = FOODS.find((f) => f.id === ing.foodId);
      if (food) {
        addLogEntry({
          babyId: activeBaby.id,
          foodId: food.id,
          foodName: food.name,
          emoji: food.emoji,
          date: today,
          mealType: recipe.mealType,
          prepUsed: activeBaby.feedingStyle,
          acceptance: 'liked',
          reactionSeverity: 'none',
          reactionSymptoms: [],
          notes: `Recipe: ${recipe.title}`,
          allergens: food.allergens,
        });
      }
    });
    setSelectedRecipe(null);
  };

  const plateFoods = FOODS.filter((f) => checkedFoodIds.includes(f.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plans & Check</Text>
        {tab === 'Weekly Plan' && (
          <TouchableOpacity style={styles.regenBtn} onPress={regenerateMealPlan}>
            <Text style={styles.regenText}>↻ Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        {(['Weekly Plan', 'Recipes', 'Meal Check'] as PlanTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tab === 'Weekly Plan' &&
          mealPlan.map((day) => {
            const b = RECIPES.find((r) => r.id === day.breakfastId);
            const l = RECIPES.find((r) => r.id === day.lunchId);
            const d = RECIPES.find((r) => r.id === day.dinnerId);
            return (
              <View key={day.date} style={[styles.dayCard, SHADOWS.card]}>
                <Text style={styles.dayTitle}>{day.date}</Text>
                {[
                  { label: 'Breakfast', slot: 'breakfastId' as const, rec: b },
                  { label: 'Lunch', slot: 'lunchId' as const, rec: l },
                  { label: 'Dinner', slot: 'dinnerId' as const, rec: d },
                ].map((m) => (
                  <View key={m.label} style={styles.planRow}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                      onPress={() => m.rec && setSelectedRecipe(m.rec)}
                    >
                      <Text style={{ fontSize: 22 }}>{m.rec?.emoji || '🍽️'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slotLabel}>{m.label}</Text>
                        <Text style={styles.recTitle} numberOfLines={1}>
                          {m.rec?.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.swapBtn}
                      onPress={() => swapMealInPlan(day.date, m.slot)}
                    >
                      <Text style={styles.swapText}>Swap</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}

        {tab === 'Recipes' && (
          <>
            <View style={styles.filterRow}>
              {[
                { id: 'all', label: 'All' },
                { id: 'iron', label: '⚡ Iron-Rich' },
                { id: 'blw', label: '🖐️ BLW' },
                { id: 'puree', label: '🥄 Purée' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, recipeFilter === f.id && styles.filterPillActive]}
                  onPress={() => setRecipeFilter(f.id as any)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      recipeFilter === f.id && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {filteredRecipes.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={[styles.recipeCard, SHADOWS.card]}
                onPress={() => setSelectedRecipe(rec)}
              >
                <Text style={{ fontSize: 30 }}>{rec.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recMeta}>
                    {rec.prepTimeMins}m • {rec.cultureTag}
                    {rec.ironRich ? ' • ⚡ Iron' : ''}
                    {rec.allergens.length ? ` • ⚠️ ${rec.allergens.join(', ')}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {tab === 'Meal Check' && (
          <View>
            <View style={[styles.checkCard, SHADOWS.card]}>
              <Text style={styles.checkTitle}>📸 Plate & Choking Safety Check</Text>
              <Text style={styles.checkSub}>
                Snap or pick a plate photo and select foods on the plate to verify size, shape, and texture for {activeBaby.name} ({ageInfo.stage}).
              </Text>
              <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
                <Text style={styles.photoBtnText}>
                  {photoUri ? 'Change Plate Photo' : 'Pick Plate Photo (Optional)'}
                </Text>
              </TouchableOpacity>
              {photoUri && <Image source={{ uri: photoUri }} style={styles.plateImage} />}
            </View>

            <Text style={styles.sectionHeading}>Select Foods on Plate:</Text>
            <View style={styles.chipWrap}>
              {FOODS.slice(0, 16).map((f) => {
                const active = checkedFoodIds.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.foodChip, active && styles.foodChipActive]}
                    onPress={() => togglePlateFood(f.id)}
                  >
                    <Text style={[styles.foodChipText, active && { color: COLORS.white }]}>
                      {f.emoji} {f.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {plateFoods.length > 0 && (
              <View style={[styles.checkCard, SHADOWS.card, { marginTop: 14 }]}>
                <Text style={styles.checkTitle}>
                  Safety Check for {ageInfo.stage}:
                </Text>
                {plateFoods.map((f) => {
                  const prep =
                    f.prepByAge.find((p) => p.stage === ageInfo.stage) || f.prepByAge[0];
                  return (
                    <View key={f.id} style={styles.checkRow}>
                      <Text style={styles.checkFoodName}>
                        {f.emoji} {f.name} ({f.chokingRisk.toUpperCase()} risk)
                      </Text>
                      <Text style={styles.checkDetail}>
                        • Cut/Size: {prep.cutSize} • Texture: {prep.texture}
                      </Text>
                      <Text style={styles.checkDetail}>• Note: {f.chokingNotes}</Text>
                    </View>
                  );
                })}
                <TouchableOpacity style={styles.logPlateBtn} onPress={logPlateFoods}>
                  <Text style={styles.logPlateText}>
                    + One-Tap Log All ({plateFoods.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Recipe Detail Modal */}
      <Modal
        visible={!!selectedRecipe}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedRecipe.emoji} {selectedRecipe.title}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
                    <Text style={styles.closeText}>Close</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  <Text style={styles.recMeta}>
                    {selectedRecipe.prepTimeMins} mins • {selectedRecipe.minAgeMonths}m+ •{' '}
                    {selectedRecipe.cultureTag}
                  </Text>
                  <Text style={styles.modalSub}>Ingredients</Text>
                  {selectedRecipe.ingredients.map((i, idx) => (
                    <Text key={idx} style={styles.stepText}>
                      • {i.amount} {i.name}
                    </Text>
                  ))}
                  <Text style={styles.modalSub}>Steps</Text>
                  {selectedRecipe.steps.map((s, idx) => (
                    <Text key={idx} style={styles.stepText}>
                      {idx + 1}. {s}
                    </Text>
                  ))}
                  <TouchableOpacity
                    style={styles.logPlateBtn}
                    onPress={() => logRecipeIngredients(selectedRecipe)}
                  >
                    <Text style={styles.logPlateText}>+ Log Recipe Foods</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  regenBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  regenText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  dayCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  dayTitle: { fontSize: 14, fontWeight: '800', color: COLORS.secondary, marginBottom: 8 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  slotLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },
  recTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  swapBtn: { backgroundColor: COLORS.cardAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  swapText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.cardAlt },
  filterPillActive: { backgroundColor: COLORS.secondary },
  filterText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  filterTextActive: { color: COLORS.white },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  recMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  checkCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  checkTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  checkSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 12 },
  photoBtn: { backgroundColor: COLORS.secondaryLight, padding: 12, borderRadius: 12, alignItems: 'center' },
  photoBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  plateImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 12 },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foodChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  foodChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  foodChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  checkRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  checkFoodName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  checkDetail: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  logPlateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logPlateText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1 },
  closeText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  modalSub: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 14, marginBottom: 6 },
  stepText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 6 },
});
