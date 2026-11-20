import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ALLERGENS } from '../data/allergens';
import { COLORS, SHADOWS } from '../theme/colors';
import { buildPediatricianReport } from '../utils/exportSummary';

type LogTab = 'Timeline' | 'Passport' | 'Allergens';

export const LogScreen: React.FC = () => {
  const { activeBaby, activeBabyLogs, deleteLogEntry } = useApp();
  const [tab, setTab] = useState<LogTab>('Timeline');

  const handleExport = async () => {
    const report = buildPediatricianReport(activeBaby, activeBabyLogs);
    await Share.share({
      title: `${activeBaby.name} Feeding & Allergen Report`,
      message: report,
    });
  };

  // Group logs by date for Timeline
  const logsByDate = useMemo(() => {
    const map: Record<string, typeof activeBabyLogs> = {};
    for (const log of activeBabyLogs) {
      if (!map[log.date]) map[log.date] = [];
      map[log.date].push(log);
    }
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [activeBabyLogs]);

  // Food Passport summary
  const passport = useMemo(() => {
    const map: Record<
      string,
      {
        foodId: string;
        foodName: string;
        emoji: string;
        count: number;
        lastDate: string;
        hasReaction: boolean;
        loved: boolean;
      }
    > = {};
    for (const log of activeBabyLogs) {
      if (!map[log.foodId]) {
        map[log.foodId] = {
          foodId: log.foodId,
          foodName: log.foodName,
          emoji: log.emoji,
          count: 0,
          lastDate: log.date,
          hasReaction: false,
          loved: false,
        };
      }
      map[log.foodId].count += 1;
      if (log.date > map[log.foodId].lastDate) map[log.foodId].lastDate = log.date;
      if (log.reactionSeverity !== 'none') map[log.foodId].hasReaction = true;
      if (log.acceptance === 'loved') map[log.foodId].loved = true;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [activeBabyLogs]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Remove Log', `Delete ${name} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLogEntry(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{activeBaby.name}’s Food Log</Text>
          <Text style={styles.subtitle}>
            {passport.length} foods • {activeBabyLogs.length} meals logged
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportText}>📤 Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(['Timeline', 'Passport', 'Allergens'] as LogTab[]).map((t) => (
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
        {tab === 'Timeline' && (
          <>
            {logsByDate.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyTitle}>No meals logged yet</Text>
                <Text style={styles.emptySub}>
                  Tap "+ Log" on any food in the Foods tab to start building {activeBaby.name}’s history.
                </Text>
              </View>
            ) : (
              logsByDate.map(([date, entries]) => (
                <View key={date} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>{date}</Text>
                    <Text style={styles.dayEmojis}>
                      {entries.map((e) => e.emoji).join(' ')}
                    </Text>
                  </View>
                  {entries.map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.logCard, SHADOWS.card]}
                      onLongPress={() => confirmDelete(entry.id, entry.foodName)}
                    >
                      <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName}>{entry.foodName}</Text>
                        <Text style={styles.entryMeta}>
                          {entry.mealType} • {entry.prepUsed.toUpperCase()} • {entry.acceptance}
                        </Text>
                        {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
                      </View>
                      {entry.reactionSeverity !== 'none' ? (
                        <View style={styles.reactionBadge}>
                          <Text style={styles.reactionText}>
                            ⚠️ {entry.reactionSeverity}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.okBadge}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </>
        )}

        {tab === 'Passport' && (
          <View style={styles.passportGrid}>
            {passport.length === 0 ? (
              <Text style={styles.emptySub}>No foods in passport yet.</Text>
            ) : (
              passport.map((p) => (
                <View key={p.foodId} style={[styles.passportCard, SHADOWS.card]}>
                  <Text style={styles.passportEmoji}>{p.emoji}</Text>
                  <Text style={styles.passportName}>{p.foodName}</Text>
                  <Text style={styles.passportCount}>
                    {p.count}x {p.loved ? '😍' : ''}
                  </Text>
                  {p.hasReaction && (
                    <Text style={styles.passportWarn}>⚠️ Reaction logged</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'Allergens' && (
          <View>
            {ALLERGENS.map((allergen) => {
              const matches = activeBabyLogs.filter((l) => l.allergens.includes(allergen.id));
              const hasReaction = matches.some((m) => m.reactionSeverity !== 'none');
              return (
                <View key={allergen.id} style={[styles.allergenCard, SHADOWS.card]}>
                  <View style={styles.allergenTop}>
                    <Text style={styles.allergenEmoji}>{allergen.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.allergenName}>{allergen.name}</Text>
                      <Text style={styles.allergenStatus}>
                        {matches.length === 0
                          ? 'Not introduced yet'
                          : hasReaction
                          ? `⚠️ Reaction logged (${matches.length} exposures)`
                          : `✅ Tolerated (${matches.length} exposures • Last: ${matches[0].date})`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.allergenTip}>How: {allergen.safeIntroTip}</Text>
                  <Text style={styles.allergenAvoid}>Avoid: {allergen.neverServeAs}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  subtitle: { fontSize: 13, color: COLORS.textSecondary },
  exportBtn: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  exportText: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
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
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 18, padding: 28, alignItems: 'center', marginTop: 20 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  dayGroup: { marginBottom: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dayDate: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  dayEmojis: { fontSize: 16 },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  entryEmoji: { fontSize: 28 },
  entryName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  entryMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  entryNotes: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontStyle: 'italic' },
  reactionBadge: { backgroundColor: COLORS.dangerLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reactionText: { fontSize: 11, fontWeight: '800', color: COLORS.danger },
  okBadge: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  passportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  passportCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  passportEmoji: { fontSize: 32, marginBottom: 4 },
  passportName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  passportCount: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, marginTop: 3 },
  passportWarn: { fontSize: 11, fontWeight: '700', color: COLORS.danger, marginTop: 3 },
  allergenCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10 },
  allergenTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  allergenEmoji: { fontSize: 28 },
  allergenName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  allergenStatus: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 2 },
  allergenTip: { fontSize: 13, color: COLORS.text, lineHeight: 18, marginBottom: 4 },
  allergenAvoid: { fontSize: 12, color: COLORS.danger, lineHeight: 17 },
});
