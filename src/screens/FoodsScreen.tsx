import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { FOODS } from '../data/foods';
import { COLORS, SHADOWS } from '../theme/colors';
import { FoodCategory, FoodItem } from '../types';

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Fruits',
  'Vegetables',
  'Proteins',
  'Grains',
  'Dairy',
  'Legumes',
  'Nuts & Seeds',
  'Seasonings',
];

const CURATED_FILTERS = ['All Foods', 'Iron-Rich', 'Gentle on Tummies', 'Top 9 Allergens', 'Untried'];

export const FoodsScreen: React.FC = () => {
  const { activeBabyLogs } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | FoodCategory>('All');
  const [curated, setCurated] = useState('All Foods');
  const [detailFood, setDetailFood] = useState<FoodItem | null>(null);
  const [logFood, setLogFood] = useState<FoodItem | null>(null);

  const triedIds = useMemo(() => new Set(activeBabyLogs.map((l) => l.foodId)), [activeBabyLogs]);

  const filtered = useMemo(() => {
    return FOODS.filter((f) => {
      if (category !== 'All' && f.category !== category) return false;
      if (curated === 'Iron-Rich' && !f.ironRich) return false;
      if (curated === 'Gentle on Tummies' && !f.gentleOnTummy) return false;
      if (curated === 'Top 9 Allergens' && f.allergens.length === 0) return false;
      if (curated === 'Untried' && triedIds.has(f.id)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.pairings.some((p) => p.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [category, curated, search, triedIds]);

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Text style={styles.headerTitle}>First Foods Library</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search foods, categories, or pairings..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {/* Curated Lists */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CURATED_FILTERS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.curatedPill, curated === c && styles.curatedPillActive]}
              onPress={() => setCurated(c)}
            >
              <Text style={[styles.curatedText, curated === c && styles.curatedTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, category === cat && styles.catPillActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isTried = triedIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.foodCard, SHADOWS.card]}
              onPress={() => setDetailFood(item)}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  {isTried && <Text style={styles.triedBadge}>✓ Tried</Text>}
                </View>
                <Text style={styles.foodMeta}>
                  {item.category} • {item.minAgeMonths}m+
                  {item.ironRich ? ' • ⚡ Iron' : ''}
                  {item.allergens.length ? ` • ⚠️ ${item.allergens.join(', ')}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.quickLogBtn} onPress={() => setLogFood(item)}>
                <Text style={styles.quickLogText}>+ Log</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No foods match your filter.</Text>
        }
      />

      <FoodDetailModal
        visible={!!detailFood}
        food={detailFood}
        onClose={() => setDetailFood(null)}
        onLogPress={(f) => setLogFood(f)}
      />
      <QuickLogModal visible={!!logFood} food={logFood} onClose={() => setLogFood(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topArea: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  searchBar: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  filterScroll: { marginBottom: 8 },
  curatedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.cardAlt,
    marginRight: 8,
  },
  curatedPillActive: { backgroundColor: COLORS.secondary },
  curatedText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  curatedTextActive: { color: COLORS.white },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white, fontWeight: '700' },
  listContent: { padding: 16, paddingTop: 6, paddingBottom: 32 },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  emoji: { fontSize: 30 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foodName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  triedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  foodMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  quickLogBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  quickLogText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 14 },
});
