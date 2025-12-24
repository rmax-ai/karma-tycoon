import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateKpsBreakdown, KpsBreakdownData } from '@/lib/game-logic';

export interface Subreddit {
  id: string;
  name: string;
  subscribers: number;
  karmaPerSecond: number;
  level: number;
  baseCost: number;
  multiplier: number;
  unlocked: boolean;
  tier: number;
  activityPeriod: number; // in seconds
  activityPhase: number; // 0 to 2*PI
  fatigue: number; // 0 to 1
  category: string;
  health: number; // 0 to 100
}

export interface Post {
  id: string;
  subredditId: string;
  createdAt: number;
  peakKps: number;
  peakTime: number; // seconds from creation
  duration: number; // total lifecycle in seconds
  k: number; // sharpness factor
}

export interface GlobalUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  multiplier: number;
  purchased: boolean;
  type: 'click' | 'passive' | 'event';
  tier: number;
  duration: number; // in seconds
  remainingTime: number; // in seconds
  level: number;
}

export interface ViralEvent {
  id: string;
  name: string;
  subredditId?: string;
  multiplier: number;
  duration: number; // in seconds
  remainingTime: number;
  isNegative: boolean;
  description?: string;
  type: 'local' | 'global';
  healthLoss?: number;
}

export interface TierInfo {
  tier: number;
  name: string;
  minKarma: number;
  maxKarma: number;
  maxPostSlots: number;
  maxEnergy: number;
  rechargeRate: number; // seconds per 1 energy
  clickPowerMultiplier: number;
}

export const TIER_THRESHOLDS: TierInfo[] = [
  { tier: 1, name: 'The Basics', minKarma: 0, maxKarma: 1e3, maxPostSlots: 3, maxEnergy: 100, rechargeRate: 1, clickPowerMultiplier: 1 },
  { tier: 2, name: 'Community Management', minKarma: 1e3, maxKarma: 1e5, maxPostSlots: 5, maxEnergy: 80, rechargeRate: 5, clickPowerMultiplier: 20 },
  { tier: 3, name: 'Viral Growth', minKarma: 1e5, maxKarma: 1e8, maxPostSlots: 10, maxEnergy: 60, rechargeRate: 20, clickPowerMultiplier: 500 },
  { tier: 4, name: 'Platform Dominance', minKarma: 1e8, maxKarma: 1e13, maxPostSlots: 20, maxEnergy: 40, rechargeRate: 60, clickPowerMultiplier: 25000 },
  { tier: 5, name: 'The Front Page', minKarma: 1e13, maxKarma: 1e21, maxPostSlots: 50, maxEnergy: 20, rechargeRate: 300, clickPowerMultiplier: 1000000 },
];

export type ActionType = 'post' | 'upgrade' | 'levelup' | 'modqueue';

export const ACTION_ENERGY_COSTS = {
  post: {
    random: 2,
    viral: 4,
  },
  upgrade: 4,
  levelup: 4,
  modqueue: 2,
};

export interface ActiveAction {
  type: ActionType;
  duration: number;
  remainingTime: number;
  label: string;
  data: {
    subredditId?: string;
    upgradeId?: string;
    qualityMultiplier?: number;
    isViral?: boolean;
  };
}

export interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GameState {
  spendableKarma: number;
  lifetimeKarma: number;
  subreddits: Subreddit[];
  upgrades: GlobalUpgrade[];
  activeEvents: ViralEvent[];
  activePosts: Post[];
  clickEnergy: number;
  lastTick: number;
  lastKarmaUpdate: number;
  karmaAccumulator: number;
  isGameOver: boolean;
  gracePeriod: number;
  activeAction: ActiveAction | null;
  currentKpsBreakdown: KpsBreakdownData;
  username: string | null;
  hasSeenWelcome: boolean;
  gameStartedAt: number;
  totalPostsCreated: number;
  hasCompletedTour: boolean;
  isTourActive: boolean;
  currentTourStep: number;
  kpsHistory: CandleData[];
  currentCandle: CandleData | null;
  chartTimeframe: number; // in seconds
  chartIndicators: {
    sma7: boolean;
    sma25: boolean;
    volume: boolean;
  };
}

export type CelebrationType = 'content' | 'upgrade' | 'unlock' | 'levelup' | 'modqueue' | 'energy-error';

export interface Celebration {
  id: string;
  type: CelebrationType;
  timestamp: number;
  message?: string;
}

export interface GameActions {
  addKarma: (amount: number, qualityMultiplier?: number, subredditId?: string) => void;
  upgradeSubreddit: (id: string) => void;
  purchaseUpgrade: (id: string) => void;
  clearModQueue: (id: string) => void;
  tick: (delta: number) => void;
  startAction: (type: ActionType, data: ActiveAction['data']) => void;
  triggerCelebration: (type: CelebrationType, message?: string) => void;
  removeCelebration: (id: string) => void;
  resetGame: () => void;
  continueGame: () => void;
  completeWelcome: (username: string) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  completeTour: () => void;
  skipTour: () => void;
  setChartTimeframe: (seconds: number) => void;
  toggleChartIndicator: (key: 'sma7' | 'sma25' | 'volume') => void;
}

export type GameStore = GameState & GameActions & { celebrations: Celebration[] };

const INITIAL_SUBREDDITS: Subreddit[] = [
  // Tier 1 (0 - 1k)
  { id: 'r-funny', name: 'r/funny', subscribers: 0, karmaPerSecond: 1, level: 0, baseCost: 10, multiplier: 1, unlocked: true, tier: 1, activityPeriod: 3600, activityPhase: 0, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-pics', name: 'r/pics', subscribers: 0, karmaPerSecond: 5, level: 0, baseCost: 100, multiplier: 1, unlocked: false, tier: 1, activityPeriod: 7200, activityPhase: Math.PI / 4, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-gaming', name: 'r/gaming', subscribers: 0, karmaPerSecond: 20, level: 0, baseCost: 500, multiplier: 1, unlocked: false, tier: 1, activityPeriod: 14400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Gaming', health: 100 },
  // Tier 2 (1k - 100k)
  { id: 'r-aww', name: 'r/aww', subscribers: 0, karmaPerSecond: 100, level: 0, baseCost: 2000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 3600, activityPhase: Math.PI, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-science', name: 'r/science', subscribers: 0, karmaPerSecond: 400, level: 0, baseCost: 10000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 28800, activityPhase: 0, fatigue: 0, category: 'Education', health: 100 },
  { id: 'r-worldnews', name: 'r/worldnews', subscribers: 0, karmaPerSecond: 1500, level: 0, baseCost: 40000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 1800, activityPhase: Math.PI / 3, fatigue: 0, category: 'News', health: 100 },
  // Tier 3 (100k - 100M)
  { id: 'r-movies', name: 'r/movies', subscribers: 0, karmaPerSecond: 10000, level: 0, baseCost: 500000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 21600, activityPhase: Math.PI / 6, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-music', name: 'r/music', subscribers: 0, karmaPerSecond: 40000, level: 0, baseCost: 2000000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 10800, activityPhase: Math.PI / 8, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-technology', name: 'r/technology', subscribers: 0, karmaPerSecond: 200000, level: 0, baseCost: 10000000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 43200, activityPhase: 0, fatigue: 0, category: 'Tech', health: 100 },
  // Tier 4 (100M - 10T)
  { id: 'r-todayilearned', name: 'r/todayilearned', subscribers: 0, karmaPerSecond: 5000000, level: 0, baseCost: 500000000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 86400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Education', health: 100 },
  { id: 'r-askreddit', name: 'r/askreddit', subscribers: 0, karmaPerSecond: 20000000, level: 0, baseCost: 2000000000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 3600, activityPhase: 0, fatigue: 0, category: 'Social', health: 100 },
  { id: 'r-showerthoughts', name: 'r/showerthoughts', subscribers: 0, karmaPerSecond: 100000000, level: 0, baseCost: 10000000000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 7200, activityPhase: Math.PI / 4, fatigue: 0, category: 'Social', health: 100 },
  // Tier 5 (10T - 1e21)
  { id: 'r-wallstreetbets', name: 'r/wallstreetbets', subscribers: 0, karmaPerSecond: 10000000000, level: 0, baseCost: 1000000000000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 14400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Finance', health: 100 },
  { id: 'r-cryptocurrency', name: 'r/cryptocurrency', subscribers: 0, karmaPerSecond: 50000000000, level: 0, baseCost: 5000000000000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 28800, activityPhase: 0, fatigue: 0, category: 'Finance', health: 100 },
  { id: 'r-announcements', name: 'r/announcements', subscribers: 0, karmaPerSecond: 200000000000, level: 0, baseCost: 20000000000000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 86400, activityPhase: 0, fatigue: 0, category: 'Social', health: 100 },
];

const INITIAL_UPGRADES: GlobalUpgrade[] = [
  // Tier 1 (0 - 1k) - 5 mins
  { id: 'automod', name: 'Automod', description: 'Reduces spam and increases efficiency. +10% KPS', baseCost: 50, multiplier: 1.1, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  { id: 'kps-lift', name: 'KPS Lift', description: 'Micro-optimizations across your network. +10% KPS', baseCost: 1000, multiplier: 1.1, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  { id: 'community-outreach', name: 'Community Outreach', description: 'Engage with other communities to grow your reach. +10% KPS', baseCost: 900, multiplier: 1.1, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  { id: 'better-titles', name: 'Better Titles', description: 'Catchier titles lead to more clicks. +15% KPS', baseCost: 500, multiplier: 1.15, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  { id: 'community-synergy', name: 'Community Synergy', description: 'Coordinated posting keeps the energy reservoir topped off. +10% Energy Recharge', baseCost: 1000, multiplier: 1.1, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  { id: 'tier1-combo', name: 'Tier 1 Combo Boost', description: 'Stacked rituals keep your energy tank topped while delivering +10% KPS and 2x recharge for five minutes.', baseCost: 2500, multiplier: 1.1, purchased: false, type: 'passive', tier: 1, duration: 300, remainingTime: 0, level: 0 },
  // Tier 2 (1k - 100k) - 10 mins
  { id: 'dedicated-mods', name: 'Dedicated Mods', description: '24/7 moderation for your communities. +50% KPS', baseCost: 5000, multiplier: 1.5, purchased: false, type: 'passive', tier: 2, duration: 600, remainingTime: 0, level: 0 },
  { id: 'subreddit-audit', name: 'Subreddit Audit', description: 'Optimize policies, onboarding, and layout. +20% KPS', baseCost: 100000, multiplier: 1.2, purchased: false, type: 'passive', tier: 2, duration: 600, remainingTime: 0, level: 0 },
  { id: 'community-partnerships', name: 'Community Partnerships', description: 'Partnered communities share notifications so energy refills faster. +20% Energy Recharge', baseCost: 100000, multiplier: 1.2, purchased: false, type: 'passive', tier: 2, duration: 600, remainingTime: 0, level: 0 },
  { id: 'engagement-analytics', name: 'Engagement Analytics', description: 'Deep dive into user behavior for better targeting. +20% KPS', baseCost: 95000, multiplier: 1.2, purchased: false, type: 'passive', tier: 2, duration: 600, remainingTime: 0, level: 0 },
  { id: 'tier2-combo', name: 'Tier 2 Momentum Combo', description: 'Community partnerships now feel like a conveyor belt—+20% KPS and 3x energy recharge for ten minutes.', baseCost: 250000, multiplier: 1.2, purchased: false, type: 'passive', tier: 2, duration: 600, remainingTime: 0, level: 0 },
  // Tier 3 (100k - 100M) - 20 mins
  { id: 'trending-tab', name: 'Trending Tab', description: 'Get featured on the trending tab more often. +30% Viral Duration', baseCost: 500000, multiplier: 1.3, purchased: false, type: 'event', tier: 3, duration: 1200, remainingTime: 0, level: 0 },
  { id: 'momentum-lab', name: 'Momentum Lab', description: 'Data experiments keep energy flowing through each subreddit. +30% Energy Recharge', baseCost: 100000000, multiplier: 1.3, purchased: false, type: 'passive', tier: 3, duration: 1200, remainingTime: 0, level: 0 },
  { id: 'content-syndication', name: 'Content Syndication', description: 'Automatically distribute content across the network. +30% KPS', baseCost: 95000000, multiplier: 1.3, purchased: false, type: 'passive', tier: 3, duration: 1200, remainingTime: 0, level: 0 },
  { id: 'tiered-amplifiers', name: 'Tiered Amplifiers', description: 'Coordinate launches across tiers. +30% KPS', baseCost: 100000000, multiplier: 1.3, purchased: false, type: 'passive', tier: 3, duration: 1200, remainingTime: 0, level: 0 },
  { id: 'tier3-combo', name: 'Tier 3 Viral Sync Combo', description: 'Tier 3 energy relay gives you 5x recharge and +50% KPS for twenty minutes of synchronized posting.', baseCost: 150000000000, multiplier: 1.5, purchased: false, type: 'passive', tier: 3, duration: 1200, remainingTime: 0, level: 0 },
  // Tier 4 (100M - 10T) - 30 mins
  { id: 'algo-optimization', name: 'Algorithm Optimization', description: 'You know exactly what the algorithm wants. +40% KPS', baseCost: 150000, multiplier: 1.4, purchased: false, type: 'passive', tier: 4, duration: 1800, remainingTime: 0, level: 0 },
  { id: 'strategic-harmony', name: 'Strategic Harmony', description: 'Platform-wide initiatives unify messaging. +40% KPS', baseCost: 10000000000000, multiplier: 1.4, purchased: false, type: 'passive', tier: 4, duration: 1800, remainingTime: 0, level: 0 },
  { id: 'platform-institutes', name: 'Platform Institutes', description: 'Research teams keep the energy returns predictable. +40% Energy Recharge', baseCost: 10000000000000, multiplier: 1.4, purchased: false, type: 'passive', tier: 4, duration: 1800, remainingTime: 0, level: 0 },
  { id: 'neural-trend-prediction', name: 'Neural Trend Prediction', description: 'AI-powered forecasting of the next big thing. +40% KPS', baseCost: 9500000000000, multiplier: 1.4, purchased: false, type: 'passive', tier: 4, duration: 1800, remainingTime: 0, level: 0 },
  { id: 'tier4-combo', name: 'Tier 4 Platform Resonance Combo', description: 'Platform initiatives echo across teams to deliver 8x energy recharge and +70% KPS for thirty minutes.', baseCost: 2500000000000000, multiplier: 1.7, purchased: false, type: 'passive', tier: 4, duration: 1800, remainingTime: 0, level: 0 },
  // Tier 5 (10T - 1e21) - 60 mins
  { id: 'global-momentum', name: 'Global Momentum', description: 'Front page energy keeps momentum steady. +50% KPS', baseCost: 1000000000000000000000, multiplier: 1.5, purchased: false, type: 'passive', tier: 5, duration: 3600, remainingTime: 0, level: 0 },
  { id: 'mainstream-media', name: 'Mainstream Media', description: 'TV, Radio, and Newspapers keep energy pouring in. +50% Energy Recharge', baseCost: 300000000000000, multiplier: 1.5, purchased: false, type: 'passive', tier: 5, duration: 3600, remainingTime: 0, level: 0 },
  { id: 'collective-consciousness', name: 'Collective Consciousness', description: 'Your network becomes the primary source of truth. +50% Energy Recharge', baseCost: 950000000000000000, multiplier: 1.5, purchased: false, type: 'passive', tier: 5, duration: 3600, remainingTime: 0, level: 0 },
  { id: 'cultural-hegemony', name: 'Cultural Hegemony', description: 'Your influence becomes cultural norms. +50% Energy Recharge', baseCost: 1000000000000000000, multiplier: 1.5, purchased: false, type: 'passive', tier: 5, duration: 3600, remainingTime: 0, level: 0 },
  { id: 'tier5-combo', name: 'Tier 5 Front Page Ascension Combo', description: 'Front page dominance drives 13x energy recharge and +200% KPS for one hour.', baseCost: 6000000000000000000000, multiplier: 3.0, purchased: false, type: 'passive', tier: 5, duration: 3600, remainingTime: 0, level: 0 },
];

const ENERGY_RECHARGE_EFFECTS: Record<string, number> = {
  'community-synergy': 1.1,
  'community-partnerships': 1.2,
  'momentum-lab': 1.3,
  'platform-institutes': 1.4,
  'cultural-hegemony': 1.5,
  'tier1-combo': 2,
  'tier2-combo': 3,
  'tier3-combo': 5,
  'tier4-combo': 8,
  'tier5-combo': 13,
};

const NEGATIVE_EVENTS = [
  { name: 'Subreddit Drama', description: 'Users are arguing in the comments.', multiplier: 0.5, duration: 45, type: 'local' as const, healthLoss: 0 },
  { name: 'Mod Abuse', description: 'A moderator went on a power trip.', multiplier: 0.2, duration: 20, type: 'local' as const, healthLoss: 40 },
  { name: 'Brigaded!', description: 'A rival community is downvoting everything!', multiplier: 0.1, duration: 30, type: 'local' as const, healthLoss: 0 },
  { name: 'Algorithm Suppression', description: 'The algorithm has suppressed your reach.', multiplier: 0.5, duration: 60, type: 'global' as const, healthLoss: 0 },
  { name: 'Server Outage', description: "Reddit's servers are struggling.", multiplier: 0.05, duration: 15, type: 'global' as const, healthLoss: 0 },
];
const BASE_CRISIS_CHANCE = 0.005;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      spendableKarma: 0,
      lifetimeKarma: 0,
      subreddits: INITIAL_SUBREDDITS,
      upgrades: INITIAL_UPGRADES,
      activeEvents: [],
      activePosts: [],
      clickEnergy: 50,
      celebrations: [],
      lastTick: Date.now(),
      lastKarmaUpdate: Date.now(),
      karmaAccumulator: 0,
      isGameOver: false,
      gracePeriod: 0,
      activeAction: null,
      currentKpsBreakdown: {
        subreddits: [],
        passiveUpgradeMultiplier: 1,
        globalMultiplier: 1,
        postKps: 0,
        totalKps: 0,
      },
      username: null,
      hasSeenWelcome: false,
      gameStartedAt: Date.now(),
      totalPostsCreated: 0,
      hasCompletedTour: false,
      isTourActive: false,
      currentTourStep: 0,
      kpsHistory: [],
      currentCandle: null,
      chartTimeframe: 60, // 1 minute candles by default
      chartIndicators: {
        sma7: true,
        sma25: true,
        volume: true,
      },

      setChartTimeframe: (seconds: number) => {
        set({ chartTimeframe: seconds, kpsHistory: [], currentCandle: null });
      },

      toggleChartIndicator: (key: 'sma7' | 'sma25' | 'volume') => {
        set((state) => ({
          chartIndicators: {
            ...state.chartIndicators,
            [key]: !state.chartIndicators[key],
          },
        }));
      },

      triggerCelebration: (type: CelebrationType, message?: string) => {
        const id = `celebration-${Date.now()}-${Math.random()}`;
        set((state) => ({
          celebrations: [...state.celebrations, { id, type, timestamp: Date.now(), message }]
        }));
        // Auto-remove after 2 seconds
        setTimeout(() => {
          get().removeCelebration(id);
        }, 2000);
      },

      removeCelebration: (id: string) => {
        set((state) => ({
          celebrations: state.celebrations.filter(c => c.id !== id)
        }));
      },

      startAction: (type: ActionType, data: ActiveAction['data']) => {
        const state = get();
        if (state.activeAction) return;

        const lifetimeKarma = state.lifetimeKarma;
        const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
        const tier = currentTier.tier;

        let energyCost = 0;
        let duration = 0;
        let label = '';

        switch (type) {
          case 'post': {
            duration = 1 + Math.random() * 4; // 1-5s
            
            const unlockedSubs = state.subreddits.filter(s => s.unlocked);
            const availableSubs = unlockedSubs.filter(s => {
              const activeInSub = state.activePosts.filter(p => p.subredditId === s.id).length;
              let slots = 1;
              if (s.level >= 100) slots += 1;
              if (s.level >= 1000) slots += 1;
              return activeInSub < slots;
            });
 
            if (availableSubs.length === 0) {
              // No subreddits available for posting
              return;
            }
 
            const targetSubId = data.subredditId || availableSubs[Math.floor(Math.random() * availableSubs.length)].id;
            const targetSub = state.subreddits.find(s => s.id === targetSubId);
            
            if (!targetSub) return;
 
            const activeInTarget = state.activePosts.filter(p => p.subredditId === targetSubId).length;
            let targetSlots = 1;
            if (targetSub.level >= 100) targetSlots += 1;
            if (targetSub.level >= 1000) targetSlots += 1;
 
            if (activeInTarget >= targetSlots) return;
 
            const isViralPost = data.isViral || state.activeEvents.some(e => e.subredditId === targetSubId);
            label = isViralPost ? `Crafting viral post in ${targetSub.name}...` : `Creating post in ${targetSub.name}...`;
            if (state.activePosts.length >= currentTier.maxPostSlots) return;
            
            energyCost = isViralPost ? ACTION_ENERGY_COSTS.post.viral : ACTION_ENERGY_COSTS.post.random;
            data.subredditId = targetSubId;
            data.isViral = isViralPost;
            break;
          }
          case 'upgrade': {
            energyCost = ACTION_ENERGY_COSTS.upgrade;
            duration = 2 + Math.random() * 3; // 2-5s
            const upgrade = state.upgrades.find(u => u.id === data.upgradeId);
            label = `Purchasing ${upgrade?.name || 'upgrade'}...`;
            if (!upgrade || upgrade.purchased) return;
            const upgradeCost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.level));
            if (state.spendableKarma < upgradeCost) return;
            set({ spendableKarma: state.spendableKarma - upgradeCost });
            break;
          }
          case 'levelup': {
            energyCost = ACTION_ENERGY_COSTS.levelup;
            duration = 3 + Math.random() * 7; // 3-10s
            const levelSub = state.subreddits.find(s => s.id === data.subredditId);
            label = `Leveling up ${levelSub?.name || 'subreddit'}...`;
            if (!levelSub) return;
            const levelCost = Math.floor(levelSub.baseCost * Math.pow(1.15, levelSub.level));
            if (state.spendableKarma < levelCost) return;
            set({ spendableKarma: state.spendableKarma - levelCost });
            break;
          }
          case 'modqueue': {
            energyCost = ACTION_ENERGY_COSTS.modqueue;
            duration = 5 + Math.random() * 10; // 5-15s
            const modSub = state.subreddits.find(s => s.id === data.subredditId);
            label = `Clearing mod queue for ${modSub?.name || 'subreddit'}...`;
            if (!modSub) return;
            break;
          }
        }

        if (state.clickEnergy < energyCost) {
          get().triggerCelebration('energy-error', `Need ${energyCost} Energy!`);
          return;
        }

        set({
          activeAction: {
            type,
            duration,
            remainingTime: duration,
            label,
            data
          },
          clickEnergy: state.clickEnergy - energyCost
        });
      },

      addKarma: (amount: number, qualityMultiplier: number = 1, subredditId?: string) => {
        const state = get();
        const lifetimeKarma = state.lifetimeKarma;
        const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
        
        const unlockedSubs = state.subreddits.filter(s => s.unlocked);
        if (unlockedSubs.length === 0) return;

        const targetSub = subredditId
          ? state.subreddits.find(s => s.id === subredditId)
          : unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
        
        if (!targetSub || !targetSub.unlocked) return;

        const clickMultiplier = state.upgrades
          .filter((u) => u.purchased && u.type === 'click')
          .reduce((acc, u) => acc * u.multiplier, 1);

        // Viral boost check (including negative events)
        const localEvents = state.activeEvents.filter(e => e.subredditId === targetSub.id);
        const localMultiplier = localEvents.reduce((acc, e) => acc * e.multiplier, 1);

        // Calculate peak KPS based on subreddit level and multipliers
        const basePeakKps = targetSub.karmaPerSecond * (targetSub.level || 1) * targetSub.multiplier * clickMultiplier * localMultiplier;
        const fatigueMultiplier = 1 - (targetSub.fatigue || 0);
        const activityMultiplier = 1.0 + 0.5 * Math.sin((2 * Math.PI * (Date.now() / 1000)) / targetSub.activityPeriod + targetSub.activityPhase);
        
        // Health penalty: linear drop below 75% health
        const healthMultiplier = targetSub.health < 75 ? (targetSub.health / 75) : 1;
        
        const finalPeakKps = basePeakKps * fatigueMultiplier * activityMultiplier * healthMultiplier * (0.8 + Math.random() * 0.7) * qualityMultiplier * currentTier.clickPowerMultiplier; // Random quality factor

        const newPost: Post = {
          id: `post-${Date.now()}-${Math.random()}`,
          subredditId: targetSub.id,
          createdAt: Date.now(),
          peakKps: finalPeakKps,
          peakTime: (10 + Math.random() * 20) * (qualityMultiplier > 1 ? 1.5 : 1), // Peaks later if high quality
          duration: (60 + Math.random() * 120) * (qualityMultiplier > 1 ? 2 : 1), // Lasts longer if high quality
          k: 1.5 + Math.random() * 1.0, // Sharpness
        };

        set((state: GameState) => ({
          activePosts: [...state.activePosts, newPost],
          totalPostsCreated: state.totalPostsCreated + 1,
          subreddits: state.subreddits.map(s =>
            s.id === targetSub.id
              ? { ...s, fatigue: Math.min(0.8, (s.fatigue || 0) + 0.1) }
              : s
          )
        }));
        get().triggerCelebration('content');
      },

      upgradeSubreddit: (id: string) => {
        const state = get();
        const subreddit = state.subreddits.find((s) => s.id === id);
        if (!subreddit) return;

        const isUnlock = subreddit.level === 0;
        set((state: GameState) => ({
          subreddits: state.subreddits.map((s) => {
            if (s.id === id) {
              const newLevel = s.level + 1;
              let newMultiplier = s.multiplier;
              // Level Milestones: 25, 50, 100
              if (newLevel === 25 || newLevel === 50 || newLevel === 100) {
                newMultiplier *= 2;
              }
              return { ...s, level: newLevel, multiplier: newMultiplier, unlocked: true };
            }
            return s;
          }),
        }));
        get().triggerCelebration(isUnlock ? 'unlock' : 'levelup');
      },

      purchaseUpgrade: (id: string) => {
        set((state: GameState) => ({
          upgrades: state.upgrades.map((u) =>
            u.id === id ? { ...u, purchased: true, remainingTime: u.duration, level: u.level + 1 } : u
          ),
        }));
        get().triggerCelebration('upgrade');
      },

      clearModQueue: (id: string) => {
        set((state: GameState) => ({
          subreddits: state.subreddits.map(s =>
            s.id === id ? { ...s, health: Math.min(100, s.health + 20) } : s
          )
        }));
        get().triggerCelebration('modqueue');
      },

      resetGame: () => {
        set({
          spendableKarma: 0,
          lifetimeKarma: 0,
          subreddits: INITIAL_SUBREDDITS,
          upgrades: INITIAL_UPGRADES,
          activeEvents: [],
          activePosts: [],
          clickEnergy: 50,
          lastKarmaUpdate: Date.now(),
          karmaAccumulator: 0,
          isGameOver: false,
          gracePeriod: 0,
          activeAction: null,
          currentKpsBreakdown: {
            subreddits: [],
            passiveUpgradeMultiplier: 1,
            globalMultiplier: 1,
            postKps: 0,
            totalKps: 0,
          },
          username: null,
          hasSeenWelcome: false,
          gameStartedAt: Date.now(),
          totalPostsCreated: 0,
          hasCompletedTour: false,
          isTourActive: false,
          currentTourStep: 0,
          kpsHistory: [],
          currentCandle: null,
          chartTimeframe: 60,
          chartIndicators: {
            sma7: true,
            sma25: true,
            volume: true,
          },
        });
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },

      completeWelcome: (username: string) => {
        console.log("Completing welcome for", username);
        set({
          username,
          hasSeenWelcome: true,
          gameStartedAt: Date.now(),
        });
      },

      continueGame: () => {
        set({
          isGameOver: false,
          gracePeriod: 60, // 60 seconds grace period
        });
      },

      startTour: () => {
        set({ isTourActive: true, currentTourStep: 0 });
      },

      nextTourStep: () => {
        set((state) => ({ currentTourStep: state.currentTourStep + 1 }));
      },

      prevTourStep: () => {
        set((state) => ({ currentTourStep: Math.max(0, state.currentTourStep - 1) }));
      },

      completeTour: () => {
        set({ isTourActive: false, hasCompletedTour: true });
      },

      skipTour: () => {
        set({ isTourActive: false, hasCompletedTour: true });
      },

      tick: (delta: number) => {
        let state = get();
        const currentTierForEvents = TIER_THRESHOLDS.find(t => state.lifetimeKarma >= t.minKarma && state.lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
        const crisisChanceMultiplier = 1 + (currentTierForEvents.tier - 1) * 0.35;
        const tierCrisisChance = BASE_CRISIS_CHANCE * crisisChanceMultiplier;
        
        if (state.isGameOver) return;

        let nextAction = state.activeAction ? { ...state.activeAction } : null;
        
        // 0. Update active action
        if (nextAction) {
          nextAction.remainingTime -= delta;
          if (nextAction.remainingTime <= 0) {
            const { type, data } = nextAction;
            nextAction = null; // Clear before executing to avoid recursion if any action triggers another tick (unlikely but safe)
            
            // Execute action completion logic
            switch (type) {
              case 'post':
                get().addKarma(0, data.qualityMultiplier || 1, data.subredditId);
                break;
              case 'upgrade':
                if (data.upgradeId) get().purchaseUpgrade(data.upgradeId);
                break;
              case 'levelup':
                if (data.subredditId) get().upgradeSubreddit(data.subredditId);
                break;
              case 'modqueue':
                if (data.subredditId) get().clearModQueue(data.subredditId);
                break;
            }
            // Refresh state after action completion to ensure subsequent calculations use updated data
            state = get();
          }
        }

        // 1. Update active events
        const updatedEvents = state.activeEvents
          .map((event) => ({
            ...event,
            remainingTime: event.remainingTime - delta,
          }))
          .filter((event) => event.remainingTime > 0);

        // 2. Randomly trigger viral event (1% chance per second base)
        const viralFrequencyMultiplier = state.upgrades
          .filter(u => u.purchased && u.id === 'viral-loop')
          .reduce((acc, u) => acc * u.multiplier, 1);
        
        const VIRAL_CHANCE = 0.01 * viralFrequencyMultiplier;
        const CRISIS_CHANCE = tierCrisisChance;
        const newEvents = [...updatedEvents];
        let updatedSubredditsForHealth = [...state.subreddits];
        
        // Positive Viral Events
        if (Math.random() < VIRAL_CHANCE * delta) {
          const unlockedSubs = state.subreddits.filter(s => s.unlocked && !newEvents.some(e => e.subredditId === s.id));
          if (unlockedSubs.length > 0) {
            const randomSub = unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
            const eventId = `viral-${Date.now()}`;
            
            const viralDurationMultiplier = state.upgrades
              .filter(u => u.purchased && u.id === 'trending-tab')
              .reduce((acc, u) => acc * u.multiplier, 1);
            
            const viralPowerMultiplier = state.upgrades
              .filter(u => u.purchased && (u.id === 'momentum-lab' || u.id === 'cultural-phenomenon'))
              .reduce((acc, u) => acc * u.multiplier, 1);

            const baseDuration = 60;
            // Inverse scaling formula: favors lower tier
            const maxBoost = Math.max(2, Math.floor(20 / randomSub.tier));
            const randomBoost = Math.floor(Math.random() * (maxBoost - 1)) + 2;
            const finalMultiplier = Math.min(10, Math.round(randomBoost * viralPowerMultiplier));

            newEvents.push({
              id: eventId,
              name: `Viral Opportunity in ${randomSub.name}!`,
              subredditId: randomSub.id,
              multiplier: finalMultiplier,
              duration: baseDuration * viralDurationMultiplier,
              remainingTime: baseDuration * viralDurationMultiplier,
              isNegative: false,
              type: 'local',
            });
          }
        }

        // Negative Crisis Events
        if (Math.random() < CRISIS_CHANCE * delta) {
          const randomCrisis = NEGATIVE_EVENTS[Math.floor(Math.random() * NEGATIVE_EVENTS.length)];
          const eventId = `crisis-${Date.now()}`;
          
          let targetSubId: string | undefined;
          if (randomCrisis.type === 'local') {
            const unlockedSubs = state.subreddits.filter(s => s.unlocked);
            if (unlockedSubs.length > 0) {
              const targetSub = unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
              targetSubId = targetSub.id;
              
              // Apply instant health loss
              if (randomCrisis.healthLoss) {
                updatedSubredditsForHealth = updatedSubredditsForHealth.map(s => 
                  s.id === targetSubId ? { ...s, health: Math.max(0, s.health - (randomCrisis.healthLoss || 0)) } : s
                );
              }
            }
          }

          if (randomCrisis.type === 'global' || targetSubId) {
            newEvents.push({
              id: eventId,
              name: randomCrisis.name,
              description: randomCrisis.description,
              subredditId: targetSubId,
              multiplier: randomCrisis.multiplier,
              duration: randomCrisis.duration,
              remainingTime: randomCrisis.duration,
              isNegative: true,
              type: randomCrisis.type,
              healthLoss: randomCrisis.healthLoss,
            });
          }
        }

        // 3. Update active posts and calculate their income
        const now = Date.now();
        let updatedPosts = state.activePosts.filter(post => (now - post.createdAt) / 1000 < post.duration);
        

        let postIncome = 0;
        updatedPosts.forEach(post => {
          const t = (now - post.createdAt) / 1000;
          const ratio = Math.max(0, t / post.peakTime);
          const kps = post.peakKps * Math.pow(ratio, post.k) * Math.exp(post.k * (1 - ratio));
          postIncome += kps * delta;
        });

        // 4. Calculate passive income with seasonality, fatigue, and health
        let passiveIncome = 0;
        const updatedSubreddits = updatedSubredditsForHealth.map(sub => {
          const newFatigue = Math.max(0, (sub.fatigue || 0) - 0.05 * delta);
          const healthDecayRate = 0.1 + (sub.level * 0.01);
          const newHealth = Math.max(0, (sub.health || 100) - healthDecayRate * delta);

          if (sub.level > 0) {
            const activePostsInSub = updatedPosts.filter(p => p.subredditId === sub.id);
            const activityScore = activePostsInSub.length === 0 ? 0 : activePostsInSub.length === 1 ? 0.5 : 1;
            const activityMultiplier = 1.0 + 0.5 * Math.sin((2 * Math.PI * (now / 1000)) / sub.activityPeriod + sub.activityPhase);
            const fatigueMultiplier = 1 - newFatigue;
            const healthMultiplier = newHealth < 75 ? (newHealth / 75) : 1;

            const synergyPosts = updatedPosts.filter(p => {
              const postSub = state.subreddits.find(s => s.id === p.subredditId);
              return postSub?.category === sub.category && p.subredditId !== sub.id;
            });
            const synergyMultiplier = 1 + (synergyPosts.length * 0.05);

            const localEvents = newEvents.filter(e => e.subredditId === sub.id);
            const localMultiplier = localEvents.reduce((acc, e) => acc * e.multiplier, 1);

            passiveIncome += sub.karmaPerSecond * sub.level * sub.multiplier * activityScore * activityMultiplier * fatigueMultiplier * synergyMultiplier * healthMultiplier * localMultiplier * delta;
          }
          
          return { ...sub, fatigue: newFatigue, health: newHealth };
        });

        // 5. Update upgrades timers and handle expiration
        const updatedUpgrades = state.upgrades.map(u => {
          if (u.purchased) {
            const newRemainingTime = Math.max(0, u.remainingTime - delta);
            return {
              ...u,
              remainingTime: newRemainingTime,
              purchased: newRemainingTime > 0
            };
          }
          return u;
        });

        const passiveUpgradeMultiplier = updatedUpgrades
          .filter((u) => u.purchased && u.type === 'passive')
          .reduce((acc, u) => acc * u.multiplier, 1);

        const globalMultiplier = newEvents
          .filter(e => e.type === 'global')
          .reduce((acc, event) => acc * event.multiplier, 1);

        const totalIncome = (passiveIncome + postIncome) * passiveUpgradeMultiplier * globalMultiplier;

        // 6. Check for Game Over (KPS = 0)
        const isKpsZero = totalIncome <= 0;
        const hasUnlockedSub = state.subreddits.some(s => s.unlocked && s.level > 0);
        
        let newIsGameOver: boolean = state.isGameOver;
        let newGracePeriod = Math.max(0, (state.gracePeriod || 0) - delta);

        if (hasUnlockedSub && isKpsZero && newGracePeriod <= 0 && !state.isGameOver) {
          newIsGameOver = true;
        }

        set((state: GameState) => {
          const newAccumulator = (state.karmaAccumulator || 0) + totalIncome;
          const timeSinceLastUpdate = now - (state.lastKarmaUpdate || now);
          
          let nextSpendableKarma = state.spendableKarma;
          let nextLifetimeKarma = state.lifetimeKarma;
          let nextKarmaAccumulator = newAccumulator;
          let nextLastKarmaUpdate = state.lastKarmaUpdate || now;

          let nextKpsBreakdown = state.currentKpsBreakdown;
          let nextKpsHistory = state.kpsHistory;
          let nextCurrentCandle = state.currentCandle;

          // Update karma values and KPS breakdown only every second
          if (timeSinceLastUpdate >= 1000) {
            nextSpendableKarma += newAccumulator;
            nextLifetimeKarma += newAccumulator;
            nextKarmaAccumulator = 0;
            nextLastKarmaUpdate = now;

            const currentTierForKps = TIER_THRESHOLDS.find(t => nextLifetimeKarma >= t.minKarma && nextLifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
            
            nextKpsBreakdown = calculateKpsBreakdown(
              updatedSubreddits,
              updatedPosts,
              updatedUpgrades,
              newEvents,
              currentTierForKps,
              now
            );

            // Candle Logic
            const currentKps = nextKpsBreakdown.totalKps;
            const candleTime = Math.floor(now / 1000 / state.chartTimeframe) * state.chartTimeframe;
            
            if (!nextCurrentCandle || nextCurrentCandle.time !== candleTime) {
              if (nextCurrentCandle) {
                nextKpsHistory = [...nextKpsHistory, nextCurrentCandle];
                if (nextKpsHistory.length > 200) nextKpsHistory = nextKpsHistory.slice(-200);
              }
              nextCurrentCandle = {
                time: candleTime,
                open: currentKps,
                high: currentKps,
                low: currentKps,
                close: currentKps,
                volume: newAccumulator,
              };
            } else {
              nextCurrentCandle = {
                ...nextCurrentCandle,
                high: Math.max(nextCurrentCandle.high, currentKps),
                low: Math.min(nextCurrentCandle.low, currentKps),
                close: currentKps,
                volume: nextCurrentCandle.volume + newAccumulator,
              };
            }
          }

          const currentTier = TIER_THRESHOLDS.find(t => nextLifetimeKarma >= t.minKarma && nextLifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
          
          const energyRechargeMultiplier = state.upgrades
            .filter((u) => u.purchased)
            .reduce((acc, u) => acc * (ENERGY_RECHARGE_EFFECTS[u.id] ?? 1), 1);

          const energyGain = (delta / currentTier.rechargeRate) * energyRechargeMultiplier;
          const newEnergy = Math.min(currentTier.maxEnergy, state.clickEnergy + energyGain);

          return {
            spendableKarma: nextSpendableKarma,
            lifetimeKarma: nextLifetimeKarma,
            karmaAccumulator: nextKarmaAccumulator,
            lastKarmaUpdate: nextLastKarmaUpdate,
            currentKpsBreakdown: nextKpsBreakdown,
            subreddits: updatedSubreddits,
            upgrades: updatedUpgrades,
            activeEvents: newEvents,
            activePosts: updatedPosts,
            clickEnergy: newEnergy,
            lastTick: now,
            isGameOver: newIsGameOver,
            gracePeriod: newGracePeriod,
            activeAction: nextAction,
            kpsHistory: nextKpsHistory,
            currentCandle: nextCurrentCandle,
          };
        });
      },
    }),
    {
      name: 'karma-tycoon-storage-v2',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persistedState: any, currentState: GameStore) => {
        const state = persistedState as any;
        if (!state) return currentState;

        // Merge subreddits: keep progress for existing ones, add new ones from INITIAL_SUBREDDITS
        const mergedSubreddits = INITIAL_SUBREDDITS.map((initialSub) => {
          const persistedSub = state.subreddits?.find((s: any) => s.id === initialSub.id);
          if (persistedSub) {
            return {
              ...initialSub,
              level: persistedSub.level,
              unlocked: persistedSub.unlocked,
              multiplier: persistedSub.multiplier || initialSub.multiplier,
              subscribers: persistedSub.subscribers || initialSub.subscribers,
              activityPeriod: persistedSub.activityPeriod || initialSub.activityPeriod,
              activityPhase: persistedSub.activityPhase || initialSub.activityPhase,
              fatigue: persistedSub.fatigue || 0,
              health: persistedSub.health !== undefined ? persistedSub.health : 100,
              category: persistedSub.category || initialSub.category,
            };
          }
          return initialSub;
        });

        // Merge upgrades: keep purchased status for existing ones, add new ones from INITIAL_UPGRADES
        const mergedUpgrades = INITIAL_UPGRADES.map((initialUpgrade) => {
          const persistedUpgrade = state.upgrades?.find((u: any) => u.id === initialUpgrade.id);
          if (persistedUpgrade) {
            return {
              ...initialUpgrade,
              purchased: persistedUpgrade.purchased,
              remainingTime: persistedUpgrade.remainingTime !== undefined ? persistedUpgrade.remainingTime : 0,
              level: persistedUpgrade.level !== undefined ? persistedUpgrade.level : 0,
            };
          }
          return initialUpgrade;
        });

        return {
          ...currentState,
          ...state,
          spendableKarma: state.spendableKarma !== undefined ? state.spendableKarma : (state.totalKarma || 0),
          subreddits: mergedSubreddits,
          upgrades: mergedUpgrades,
          activePosts: state.activePosts || [],
          clickEnergy: state.clickEnergy !== undefined ? state.clickEnergy : 50,
          isGameOver: state.isGameOver || false,
          gracePeriod: state.gracePeriod || 0,
          activeAction: state.activeAction || null,
          hasSeenWelcome: state.hasSeenWelcome !== undefined ? state.hasSeenWelcome : false,
          username: state.username !== undefined ? state.username : null,
          gameStartedAt: state.gameStartedAt !== undefined ? state.gameStartedAt : Date.now(),
          totalPostsCreated: state.totalPostsCreated !== undefined ? state.totalPostsCreated : 0,
          hasCompletedTour: state.hasCompletedTour !== undefined ? state.hasCompletedTour : false,
          kpsHistory: state.kpsHistory || [],
          currentCandle: state.currentCandle || null,
          chartTimeframe: state.chartTimeframe || 60,
          chartIndicators: state.chartIndicators || {
            sma7: true,
            sma25: true,
            volume: true,
          },
        };
      },
      partialize: (state) => ({
        spendableKarma: state.spendableKarma,
        lifetimeKarma: state.lifetimeKarma,
        subreddits: state.subreddits,
        upgrades: state.upgrades,
        activeEvents: state.activeEvents,
        activePosts: state.activePosts,
        clickEnergy: state.clickEnergy,
        lastTick: state.lastTick,
        lastKarmaUpdate: state.lastKarmaUpdate,
        karmaAccumulator: state.karmaAccumulator,
        isGameOver: state.isGameOver,
        gracePeriod: state.gracePeriod,
        activeAction: state.activeAction,
        currentKpsBreakdown: state.currentKpsBreakdown,
        username: state.username,
        hasSeenWelcome: state.hasSeenWelcome,
        gameStartedAt: state.gameStartedAt,
        totalPostsCreated: state.totalPostsCreated,
        hasCompletedTour: state.hasCompletedTour,
        kpsHistory: state.kpsHistory,
        currentCandle: state.currentCandle,
        chartTimeframe: state.chartTimeframe,
        chartIndicators: state.chartIndicators,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 if needed
        }
        return persistedState;
      },
    }
  )
);
