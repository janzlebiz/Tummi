import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { RECIPES } from '../data/recipes';
import {
  AppSettings,
  BabyProfile,
  ChatMessage,
  FoodLogEntry,
  MealPlanDay,
} from '../types';
import { getWeekDatesISO } from '../utils/babyAge';

const STORAGE_KEY = '@tummi_app_state_v1';

interface AppContextValue {
  loaded: boolean;
  babies: BabyProfile[];
  activeBaby: BabyProfile;
  logs: FoodLogEntry[];
  activeBabyLogs: FoodLogEntry[];
  mealPlan: MealPlanDay[];
  chatMessages: ChatMessage[];
  settings: AppSettings;
  addBaby: (baby: Omit<BabyProfile, 'id' | 'createdAt'>) => void;
  updateBaby: (baby: BabyProfile) => void;
  setActiveBabyId: (id: string) => void;
  addLogEntry: (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => void;
  deleteLogEntry: (id: string) => void;
  regenerateMealPlan: () => void;
  swapMealInPlan: (date: string, slot: 'breakfastId' | 'lunchId' | 'dinnerId') => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const defaultBirthDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  d.setDate(d.getDate() - 10);
  return d.toISOString().slice(0, 10);
};

const DEFAULT_BABY: BabyProfile = {
  id: 'baby_default',
  name: 'Baby',
  birthDate: defaultBirthDate(),
  isPremature: false,
  weeksEarly: 0,
  feedingStyle: 'combo',
  restrictions: [],
  cultureNotes: '',
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'offline',
  apiKey: '',
  waitDaysBetweenAllergens: 2,
};

function generateInitialMealPlan(style: BabyProfile['feedingStyle'] = 'combo'): MealPlanDay[] {
  const dates = getWeekDatesISO();
  const breakfasts = RECIPES.filter((r) => r.mealType === 'breakfast');
  const lunches = RECIPES.filter((r) => r.mealType === 'lunch' || r.mealType === 'snack');
  const dinners = RECIPES.filter((r) => r.mealType === 'dinner');

  return dates.map((date, idx) => ({
    date,
    breakfastId: breakfasts[idx % breakfasts.length]?.id || RECIPES[0].id,
    lunchId: lunches[idx % lunches.length]?.id || RECIPES[1].id,
    dinnerId: dinners[idx % dinners.length]?.id || RECIPES[2].id,
  }));
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [babies, setBabies] = useState<BabyProfile[]>([DEFAULT_BABY]);
  const [activeBabyId, setActiveBabyIdState] = useState<string>(DEFAULT_BABY.id);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => generateInitialMealPlan());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.babies?.length) setBabies(parsed.babies);
          if (parsed.activeBabyId) setActiveBabyIdState(parsed.activeBabyId);
          if (parsed.logs) setLogs(parsed.logs);
          if (parsed.mealPlan?.length) setMealPlan(parsed.mealPlan);
          if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
          if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      } catch {
        // Ignore storage read errors
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ babies, activeBabyId, logs, mealPlan, chatMessages, settings })
    ).catch(() => {});
  }, [loaded, babies, activeBabyId, logs, mealPlan, chatMessages, settings]);

  const activeBaby = babies.find((b) => b.id === activeBabyId) || babies[0] || DEFAULT_BABY;
  const activeBabyLogs = logs.filter((l) => l.babyId === activeBaby.id);

  const addBaby = (baby: Omit<BabyProfile, 'id' | 'createdAt'>) => {
    const newBaby: BabyProfile = {
      ...baby,
      id: `baby_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBabies((prev) => [...prev, newBaby]);
    setActiveBabyIdState(newBaby.id);
  };

  const updateBaby = (updated: BabyProfile) => {
    setBabies((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const setActiveBabyId = (id: string) => setActiveBabyIdState(id);

  const addLogEntry = (entry: Omit<FoodLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: FoodLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const deleteLogEntry = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const regenerateMealPlan = () => {
    const dates = getWeekDatesISO();
    const breakfasts = RECIPES.filter((r) => r.mealType === 'breakfast');
    const lunches = RECIPES.filter((r) => r.mealType === 'lunch' || r.mealType === 'snack');
    const dinners = RECIPES.filter((r) => r.mealType === 'dinner');
    const offset = Math.floor(Math.random() * 5) + 1;

    setMealPlan(
      dates.map((date, idx) => ({
        date,
        breakfastId: breakfasts[(idx + offset) % breakfasts.length]?.id || RECIPES[0].id,
        lunchId: lunches[(idx + offset) % lunches.length]?.id || RECIPES[1].id,
        dinnerId: dinners[(idx + offset) % dinners.length]?.id || RECIPES[2].id,
      }))
    );
  };

  const swapMealInPlan = (date: string, slot: 'breakfastId' | 'lunchId' | 'dinnerId') => {
    setMealPlan((prev) =>
      prev.map((day) => {
        if (day.date !== date) return day;
        const currentId = day[slot];
        const pool =
          slot === 'breakfastId'
            ? RECIPES.filter((r) => r.mealType === 'breakfast')
            : slot === 'lunchId'
            ? RECIPES.filter((r) => r.mealType === 'lunch' || r.mealType === 'snack')
            : RECIPES.filter((r) => r.mealType === 'dinner');
        const idx = pool.findIndex((r) => r.id === currentId);
        const next = pool[(idx + 1) % pool.length] || pool[0];
        return { ...day, [slot]: next.id };
      })
    );
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChatMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const clearChat = () => setChatMessages([]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AppContext.Provider
      value={{
        loaded,
        babies,
        activeBaby,
        logs,
        activeBabyLogs,
        mealPlan,
        chatMessages,
        settings,
        addBaby,
        updateBaby,
        setActiveBabyId,
        addLogEntry,
        deleteLogEntry,
        regenerateMealPlan,
        swapMealInPlan,
        addChatMessage,
        clearChat,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
