import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AskScreen } from './src/screens/AskScreen';
import { FoodsScreen } from './src/screens/FoodsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LogScreen } from './src/screens/LogScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { COLORS } from './src/theme/colors';

type TabName = 'Home' | 'Foods' | 'Log' | 'Plan' | 'Ask';

const TABS: { name: TabName; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Foods', icon: 'nutrition-outline', activeIcon: 'nutrition' },
  { name: 'Log', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'Plan', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { name: 'Ask', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses' },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.screenArea}>
        {activeTab === 'Home' && <HomeScreen onNavigateTab={setActiveTab} />}
        {activeTab === 'Foods' && <FoodsScreen />}
        {activeTab === 'Log' && <LogScreen />}
        {activeTab === 'Plan' && <PlanScreen />}
        {activeTab === 'Ask' && <AskScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = activeTab === t.name;
          return (
            <TouchableOpacity
              key={t.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(t.name)}
            >
              <Ionicons
                name={active ? t.activeIcon : t.icon}
                size={22}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.primary, fontWeight: '800' },
});
