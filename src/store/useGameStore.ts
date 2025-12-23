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
  cost: number;
  multiplier: number;
  purchased: boolean;
  type: 'click' | 'passive' | 'event';
  tier: number;
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
  { tier: 1, name: 'The Basics', minKarma: 0, maxKarma: 1000, maxPostSlots: 3, maxEnergy: 50, rechargeRate: 1, clickPowerMultiplier: 1 },
  { tier: 2, name: 'Community Management', minKarma: 1000, maxKarma: 10000, maxPostSlots: 5, maxEnergy: 30, rechargeRate: 10, clickPowerMultiplier: 15 },
  { tier: 3, name: 'Viral Growth', minKarma: 10000, maxKarma: 100000, maxPostSlots: 10, maxEnergy: 15, rechargeRate: 60, clickPowerMultiplier: 200 },
  { tier: 4, name: 'Platform Dominance', minKarma: 100000, maxKarma: 1000000, maxPostSlots: 20, maxEnergy: 5, rechargeRate: 300, clickPowerMultiplier: 3000 },
  { tier: 5, name: 'The Front Page', minKarma: 1000000, maxKarma: 10000000, maxPostSlots: 50, maxEnergy: 1, rechargeRate: 1200, clickPowerMultiplier: 50000 },
];

export interface GameState {
  totalKarma: number;
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
  crafting: {
    duration: number;
    remainingTime: number;
    qualityMultiplier: number;
    subredditId?: string;
  } | null;
  currentKpsBreakdown: KpsBreakdownData;
}

export type CelebrationType = 'content' | 'upgrade' | 'unlock' | 'levelup' | 'modqueue';

export interface Celebration {
  id: string;
  type: CelebrationType;
  timestamp: number;
}

export interface GameActions {
  addKarma: (amount: number, qualityMultiplier?: number, subredditId?: string) => void;
  purchaseSubreddit: (id: string) => void;
  upgradeSubreddit: (id: string) => void;
  purchaseUpgrade: (id: string) => void;
  clearModQueue: (id: string) => void;
  tick: (delta: number) => void;
  startCrafting: (qualityMultiplier: number, subredditId?: string) => void;
  triggerCelebration: (type: CelebrationType) => void;
  removeCelebration: (id: string) => void;
  resetGame: () => void;
  continueGame: () => void;
}

export type GameStore = GameState & GameActions & { celebrations: Celebration[] };

const INITIAL_SUBREDDITS: Subreddit[] = [
  // Tier 1
  { id: 'r-funny', name: 'r/funny', subscribers: 0, karmaPerSecond: 1, level: 0, baseCost: 10, multiplier: 1, unlocked: true, tier: 1, activityPeriod: 3600, activityPhase: 0, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-pics', name: 'r/pics', subscribers: 0, karmaPerSecond: 5, level: 0, baseCost: 100, multiplier: 1, unlocked: false, tier: 1, activityPeriod: 7200, activityPhase: Math.PI / 4, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-gaming', name: 'r/gaming', subscribers: 0, karmaPerSecond: 20, level: 0, baseCost: 500, multiplier: 1, unlocked: false, tier: 1, activityPeriod: 14400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Gaming', health: 100 },
  // Tier 2
  { id: 'r-aww', name: 'r/aww', subscribers: 0, karmaPerSecond: 75, level: 0, baseCost: 2000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 3600, activityPhase: Math.PI, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-science', name: 'r/science', subscribers: 0, karmaPerSecond: 150, level: 0, baseCost: 5000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 28800, activityPhase: 0, fatigue: 0, category: 'Education', health: 100 },
  { id: 'r-worldnews', name: 'r/worldnews', subscribers: 0, karmaPerSecond: 300, level: 0, baseCost: 10000, multiplier: 1, unlocked: false, tier: 2, activityPeriod: 1800, activityPhase: Math.PI / 3, fatigue: 0, category: 'News', health: 100 },
  // Tier 3
  { id: 'r-movies', name: 'r/movies', subscribers: 0, karmaPerSecond: 800, level: 0, baseCost: 25000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 21600, activityPhase: Math.PI / 6, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-music', name: 'r/music', subscribers: 0, karmaPerSecond: 1500, level: 0, baseCost: 50000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 10800, activityPhase: Math.PI / 8, fatigue: 0, category: 'Entertainment', health: 100 },
  { id: 'r-technology', name: 'r/technology', subscribers: 0, karmaPerSecond: 3000, level: 0, baseCost: 100000, multiplier: 1, unlocked: false, tier: 3, activityPeriod: 43200, activityPhase: 0, fatigue: 0, category: 'Tech', health: 100 },
  // Tier 4
  { id: 'r-todayilearned', name: 'r/todayilearned', subscribers: 0, karmaPerSecond: 8000, level: 0, baseCost: 250000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 86400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Education', health: 100 },
  { id: 'r-askreddit', name: 'r/askreddit', subscribers: 0, karmaPerSecond: 15000, level: 0, baseCost: 500000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 3600, activityPhase: 0, fatigue: 0, category: 'Social', health: 100 },
  { id: 'r-showerthoughts', name: 'r/showerthoughts', subscribers: 0, karmaPerSecond: 30000, level: 0, baseCost: 1000000, multiplier: 1, unlocked: false, tier: 4, activityPeriod: 7200, activityPhase: Math.PI / 4, fatigue: 0, category: 'Social', health: 100 },
  // Tier 5
  { id: 'r-wallstreetbets', name: 'r/wallstreetbets', subscribers: 0, karmaPerSecond: 80000, level: 0, baseCost: 2500000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 14400, activityPhase: Math.PI / 2, fatigue: 0, category: 'Finance', health: 100 },
  { id: 'r-cryptocurrency', name: 'r/cryptocurrency', subscribers: 0, karmaPerSecond: 150000, level: 0, baseCost: 5000000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 28800, activityPhase: 0, fatigue: 0, category: 'Finance', health: 100 },
  { id: 'r-announcements', name: 'r/announcements', subscribers: 0, karmaPerSecond: 500000, level: 0, baseCost: 10000000, multiplier: 1, unlocked: false, tier: 5, activityPeriod: 86400, activityPhase: 0, fatigue: 0, category: 'Social', health: 100 },
];

const INITIAL_UPGRADES: GlobalUpgrade[] = [
  // Tier 1
  { id: 'automod', name: 'Automod', description: 'Reduces spam and increases efficiency. +10% KPS', cost: 50, multiplier: 1.1, purchased: false, type: 'passive', tier: 1 },
  { id: 'meme-factory', name: 'Meme Factory', description: 'Industrial grade memes. 2x Click Power', cost: 100, multiplier: 2, purchased: false, type: 'click', tier: 1 },
  { id: 'influencer-partnership', name: 'Influencer Partnership', description: 'Big names are talking about your subs. +20% KPS', cost: 250, multiplier: 1.2, purchased: false, type: 'passive', tier: 1 },
  { id: 'better-titles', name: 'Better Titles', description: 'Catchier titles lead to more clicks. +15% KPS', cost: 500, multiplier: 1.15, purchased: false, type: 'passive', tier: 1 },
  { id: 'clickbait-mastery', name: 'Clickbait Mastery', description: "You won't believe how much karma you'll get! 3x Click Power", cost: 750, multiplier: 3, purchased: false, type: 'click', tier: 1 },
  // Tier 2
  { id: 'dedicated-mods', name: 'Dedicated Mods', description: '24/7 moderation for your communities. +25% KPS', cost: 1500, multiplier: 1.25, purchased: false, type: 'passive', tier: 2 },
  { id: 'subreddit-wiki', name: 'Subreddit Wiki', description: 'Better organization for new users. +30% KPS', cost: 3000, multiplier: 1.3, purchased: false, type: 'passive', tier: 2 },
  { id: 'discord-server', name: 'Discord Server', description: 'Build a community outside of Reddit. +40% KPS', cost: 5000, multiplier: 1.4, purchased: false, type: 'passive', tier: 2 },
  { id: 'bot-network', name: 'Bot Network', description: 'Automated engagement (the "good" kind). +50% KPS', cost: 8000, multiplier: 1.5, purchased: false, type: 'passive', tier: 2 },
  // Tier 3
  { id: 'trending-tab', name: 'Trending Tab', description: 'Get featured on the trending tab more often. +50% Viral Duration', cost: 15000, multiplier: 1.5, purchased: false, type: 'event', tier: 3 },
  { id: 'front-page-feature', name: 'Front Page Feature', description: 'A guaranteed spot on the front page. 2x Viral Multiplier', cost: 30000, multiplier: 2, purchased: false, type: 'event', tier: 3 },
  { id: 'cross-posting', name: 'Cross-posting Strategy', description: 'Share your content across multiple subs. +100% KPS', cost: 60000, multiplier: 2, purchased: false, type: 'passive', tier: 3 },
  { id: 'viral-loop', name: 'Viral Loop', description: 'One viral post leads to another. 2x Viral Frequency', cost: 90000, multiplier: 2, purchased: false, type: 'event', tier: 3 },
  // Tier 4
  { id: 'algo-optimization', name: 'Algorithm Optimization', description: 'You know exactly what the algorithm wants. +150% KPS', cost: 150000, multiplier: 2.5, purchased: false, type: 'passive', tier: 4 },
  { id: 'verified-status', name: 'Verified Status', description: 'Blue checkmarks for everyone! +200% KPS', cost: 300000, multiplier: 3, purchased: false, type: 'passive', tier: 4 },
  { id: 'media-empire', name: 'Media Empire', description: 'You own the news cycle. 5x Click Power', cost: 600000, multiplier: 5, purchased: false, type: 'click', tier: 4 },
  { id: 'global-reach', name: 'Global Reach', description: 'Your content is translated into every language. +300% KPS', cost: 900000, multiplier: 4, purchased: false, type: 'passive', tier: 4 },
  // Tier 5
  { id: 'internet-sensation', name: 'Internet Sensation', description: 'Everyone knows your name. +500% KPS', cost: 1500000, multiplier: 6, purchased: false, type: 'passive', tier: 5 },
  { id: 'cultural-phenomenon', name: 'Cultural Phenomenon', description: 'You are the zeitgeist. 5x Viral Multiplier', cost: 3000000, multiplier: 5, purchased: false, type: 'event', tier: 5 },
  { id: 'mainstream-media', name: 'Mainstream Media', description: 'TV, Radio, and Newspapers are talking. +1000% KPS', cost: 6000000, multiplier: 11, purchased: false, type: 'passive', tier: 5 },
  { id: 'front-page-internet', name: 'Front Page of the Internet', description: 'You ARE Reddit. 10x Click Power', cost: 10000000, multiplier: 10, purchased: false, type: 'click', tier: 5 },
];

const NEGATIVE_EVENTS = [
  { name: 'Subreddit Drama', description: 'Users are arguing in the comments.', multiplier: 0.5, duration: 45, type: 'local' as const, healthLoss: 0 },
  { name: 'Mod Abuse', description: 'A moderator went on a power trip.', multiplier: 0.2, duration: 20, type: 'local' as const, healthLoss: 40 },
  { name: 'Brigaded!', description: 'A rival community is downvoting everything!', multiplier: 0.1, duration: 30, type: 'local' as const, healthLoss: 0 },
  { name: 'Algorithm Suppression', description: 'The algorithm has suppressed your reach.', multiplier: 0.5, duration: 60, type: 'global' as const, healthLoss: 0 },
  { name: 'Server Outage', description: "Reddit's servers are struggling.", multiplier: 0.05, duration: 15, type: 'global' as const, healthLoss: 0 },
];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      totalKarma: 0,
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
      crafting: null,
      currentKpsBreakdown: {
        subreddits: [],
        passiveUpgradeMultiplier: 1,
        globalMultiplier: 1,
        postKps: 0,
        totalKps: 0,
      },

      triggerCelebration: (type: CelebrationType) => {
        const id = `celebration-${Date.now()}-${Math.random()}`;
        set((state) => ({
          celebrations: [...state.celebrations, { id, type, timestamp: Date.now() }]
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

      startCrafting: (qualityMultiplier: number, subredditId?: string) => {
        const state = get();
        if (state.crafting) return; // Already crafting

        const lifetimeKarma = state.lifetimeKarma;
        const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
        
        if (state.activePosts.length >= currentTier.maxPostSlots) {
          return; // Limit reached
        }

        if (state.clickEnergy < 1) {
          return; // Not enough energy
        }

        const min = 3;
        const max = 15;
        // Positively skewed: more likely to be near min
        const duration = min + (max - min) * Math.pow(Math.random(), 2);
        
        set({
          crafting: {
            duration,
            remainingTime: duration,
            qualityMultiplier,
            subredditId
          },
          clickEnergy: state.clickEnergy - 1
        });
      },

      addKarma: (amount: number, qualityMultiplier: number = 1, subredditId?: string) => {
        const state = get();
        const lifetimeKarma = state.lifetimeKarma;
        const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
        
        // Note: Energy and slots are checked in startCrafting now, but we keep checks here for safety
        if (state.activePosts.length >= currentTier.maxPostSlots) {
          return;
        }

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
          subreddits: state.subreddits.map(s =>
            s.id === targetSub.id
              ? { ...s, fatigue: Math.min(0.8, (s.fatigue || 0) + 0.1) }
              : s
          )
        }));
        get().triggerCelebration('content');
      },

      purchaseSubreddit: (id: string) => {
        const state = get();
        const subreddit = state.subreddits.find((s) => s.id === id);
        if (!subreddit) return;

        const cost = subreddit.baseCost * Math.pow(1.15, subreddit.level);
        if (state.totalKarma >= cost) {
          set((state: GameState) => ({
            totalKarma: state.totalKarma - cost,
            subreddits: state.subreddits.map((s) =>
              s.id === id
                ? { ...s, level: s.level + 1, unlocked: true }
                : s
            ),
          }));
          get().triggerCelebration('unlock');
        }
      },

      upgradeSubreddit: (id: string) => {
        const state = get();
        const subreddit = state.subreddits.find((s) => s.id === id);
        if (!subreddit) return;

        const cost = subreddit.baseCost * Math.pow(1.15, subreddit.level);
        if (state.totalKarma >= cost) {
          const isUnlock = subreddit.level === 0;
          set((state: GameState) => ({
            totalKarma: state.totalKarma - cost,
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
        }
      },

      purchaseUpgrade: (id: string) => {
        const state = get();
        const upgrade = state.upgrades.find((u) => u.id === id);
        if (!upgrade || upgrade.purchased) return;

        if (state.totalKarma >= upgrade.cost) {
          set((state: GameState) => ({
            totalKarma: state.totalKarma - upgrade.cost,
            upgrades: state.upgrades.map((u) =>
              u.id === id ? { ...u, purchased: true } : u
            ),
          }));
          get().triggerCelebration('upgrade');
        }
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
          totalKarma: 0,
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
          crafting: null,
          currentKpsBreakdown: {
            subreddits: [],
            passiveUpgradeMultiplier: 1,
            globalMultiplier: 1,
            postKps: 0,
            totalKps: 0,
          },
        });
      },

      continueGame: () => {
        set({
          isGameOver: false,
          gracePeriod: 60, // 60 seconds grace period
        });
      },

      tick: (delta: number) => {
        const state = get();
        
        if (state.isGameOver) return;

        let nextCrafting = state.crafting ? { ...state.crafting } : null;
        let postToCreate: { qualityMultiplier: number, subredditId?: string } | null = null;

        // 0. Update crafting
        if (nextCrafting) {
          nextCrafting.remainingTime -= delta;
          if (nextCrafting.remainingTime <= 0) {
            postToCreate = { 
              qualityMultiplier: nextCrafting.qualityMultiplier, 
              subredditId: nextCrafting.subredditId 
            };
            nextCrafting = null;
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
        const CRISIS_CHANCE = 0.005;
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
              .filter(u => u.purchased && (u.id === 'front-page-feature' || u.id === 'cultural-phenomenon'))
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
        
        // Handle post creation from crafting completion
        if (postToCreate) {
          const { qualityMultiplier, subredditId } = postToCreate;
          const lifetimeKarma = state.lifetimeKarma;
          const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
          
          const unlockedSubs = state.subreddits.filter(s => s.unlocked);
          if (unlockedSubs.length > 0) {
            const targetSub = subredditId
              ? state.subreddits.find(s => s.id === subredditId)
              : unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
            
            if (targetSub && targetSub.unlocked) {
              const clickMultiplier = state.upgrades
                .filter((u) => u.purchased && u.type === 'click')
                .reduce((acc, u) => acc * u.multiplier, 1);

              const localEvents = state.activeEvents.filter(e => e.subredditId === targetSub.id);
              const localMultiplier = localEvents.reduce((acc, e) => acc * e.multiplier, 1);

              const basePeakKps = targetSub.karmaPerSecond * (targetSub.level || 1) * targetSub.multiplier * clickMultiplier * localMultiplier;
              const fatigueMultiplier = 1 - (targetSub.fatigue || 0);
              const activityMultiplier = 1.0 + 0.5 * Math.sin((2 * Math.PI * (Date.now() / 1000)) / targetSub.activityPeriod + targetSub.activityPhase);
              const healthMultiplier = targetSub.health < 75 ? (targetSub.health / 75) : 1;
              const finalPeakKps = basePeakKps * fatigueMultiplier * activityMultiplier * healthMultiplier * (0.8 + Math.random() * 0.7) * qualityMultiplier * currentTier.clickPowerMultiplier;

              const newPost: Post = {
                id: `post-${Date.now()}-${Math.random()}`,
                subredditId: targetSub.id,
                createdAt: Date.now(),
                peakKps: finalPeakKps,
                peakTime: (10 + Math.random() * 20) * (qualityMultiplier > 1 ? 1.5 : 1),
                duration: (60 + Math.random() * 120) * (qualityMultiplier > 1 ? 2 : 1),
                k: 1.5 + Math.random() * 1.0,
              };

              updatedPosts = [...updatedPosts, newPost];
              updatedSubredditsForHealth = updatedSubredditsForHealth.map(s =>
                s.id === targetSub.id
                  ? { ...s, fatigue: Math.min(0.8, (s.fatigue || 0) + 0.1) }
                  : s
              );
              get().triggerCelebration('content');
            }
          }
        }

        let postIncome = 0;
        updatedPosts.forEach(post => {
          const t = (now - post.createdAt) / 1000;
          const ratio = t / post.peakTime;
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

        const passiveUpgradeMultiplier = state.upgrades
          .filter((u) => u.purchased && u.type === 'passive')
          .reduce((acc, u) => acc * u.multiplier, 1);

        const globalMultiplier = newEvents
          .filter(e => e.type === 'global')
          .reduce((acc, event) => acc * event.multiplier, 1);

        const totalIncome = (passiveIncome + postIncome) * passiveUpgradeMultiplier * globalMultiplier;

        // 5. Check for Game Over (KPS = 0)
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
          
          let nextTotalKarma = state.totalKarma;
          let nextLifetimeKarma = state.lifetimeKarma;
          let nextKarmaAccumulator = newAccumulator;
          let nextLastKarmaUpdate = state.lastKarmaUpdate || now;

          let nextKpsBreakdown = state.currentKpsBreakdown;

          // Update karma values and KPS breakdown only every second
          if (timeSinceLastUpdate >= 1000) {
            nextTotalKarma += newAccumulator;
            nextLifetimeKarma += newAccumulator;
            nextKarmaAccumulator = 0;
            nextLastKarmaUpdate = now;

            const currentTierForKps = TIER_THRESHOLDS.find(t => nextLifetimeKarma >= t.minKarma && nextLifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
            
            nextKpsBreakdown = calculateKpsBreakdown(
              updatedSubreddits,
              updatedPosts,
              state.upgrades,
              newEvents,
              currentTierForKps,
              now
            );
          }

          const currentTier = TIER_THRESHOLDS.find(t => nextLifetimeKarma >= t.minKarma && nextLifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
          
          const energyGain = delta / currentTier.rechargeRate;
          const newEnergy = Math.min(currentTier.maxEnergy, state.clickEnergy + energyGain);

          return {
            totalKarma: nextTotalKarma,
            lifetimeKarma: nextLifetimeKarma,
            karmaAccumulator: nextKarmaAccumulator,
            lastKarmaUpdate: nextLastKarmaUpdate,
            currentKpsBreakdown: nextKpsBreakdown,
            subreddits: updatedSubreddits,
            activeEvents: newEvents,
            activePosts: updatedPosts,
            clickEnergy: newEnergy,
            lastTick: now,
            isGameOver: newIsGameOver,
            gracePeriod: newGracePeriod,
            crafting: nextCrafting,
          };
        });
      },
    }),
    {
      name: 'karma-tycoon-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => {
        const { celebrations, ...rest } = state as any;
        return rest;
      },
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 if needed
        }
        return persistedState;
      },
      merge: (persistedState: any, currentState: GameStore) => {
        const state = persistedState as GameState;
        if (!state) return currentState;

        // Merge subreddits: keep progress for existing ones, add new ones from INITIAL_SUBREDDITS
        const mergedSubreddits = INITIAL_SUBREDDITS.map((initialSub) => {
          const persistedSub = state.subreddits?.find((s) => s.id === initialSub.id);
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
          const persistedUpgrade = state.upgrades?.find((u) => u.id === initialUpgrade.id);
          if (persistedUpgrade) {
            return {
              ...initialUpgrade,
              purchased: persistedUpgrade.purchased,
            };
          }
          return initialUpgrade;
        });

        return {
          ...currentState,
          ...state,
          subreddits: mergedSubreddits,
          upgrades: mergedUpgrades,
          activePosts: state.activePosts || [],
          clickEnergy: state.clickEnergy !== undefined ? state.clickEnergy : 50,
          isGameOver: state.isGameOver || false,
          gracePeriod: state.gracePeriod || 0,
          crafting: state.crafting || null,
        };
      },
    }
  )
);
