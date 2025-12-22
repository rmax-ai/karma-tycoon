import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Subreddit {
  id: string;
  name: string;
  subscribers: number;
  karmaPerSecond: number;
  level: number;
  baseCost: number;
  multiplier: number;
  unlocked: boolean;
}

export interface GlobalUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
  type: 'click' | 'passive' | 'event';
}

export interface ViralEvent {
  id: string;
  name: string;
  subredditId?: string;
  multiplier: number;
  duration: number; // in seconds
  remainingTime: number;
}

export interface TierInfo {
  tier: number;
  name: string;
  minKarma: number;
  maxKarma: number;
}

export const TIER_THRESHOLDS: TierInfo[] = [
  { tier: 1, name: 'The Basics', minKarma: 0, maxKarma: 1000 },
  { tier: 2, name: 'Community Management', minKarma: 1000, maxKarma: 10000 },
  { tier: 3, name: 'Viral Growth', minKarma: 10000, maxKarma: 100000 },
  { tier: 4, name: 'Platform Dominance', minKarma: 100000, maxKarma: 1000000 },
  { tier: 5, name: 'The Front Page', minKarma: 1000000, maxKarma: 10000000 },
];

export interface GameState {
  totalKarma: number;
  lifetimeKarma: number;
  subreddits: Subreddit[];
  upgrades: GlobalUpgrade[];
  activeEvents: ViralEvent[];
  lastTick: number;
}

export interface GameActions {
  addKarma: (amount: number) => void;
  purchaseSubreddit: (id: string) => void;
  upgradeSubreddit: (id: string) => void;
  purchaseUpgrade: (id: string) => void;
  tick: (delta: number) => void;
}

export type GameStore = GameState & GameActions;

const INITIAL_SUBREDDITS: Subreddit[] = [
  // Tier 1
  { id: 'r-funny', name: 'r/funny', subscribers: 0, karmaPerSecond: 1, level: 0, baseCost: 10, multiplier: 1, unlocked: true },
  { id: 'r-pics', name: 'r/pics', subscribers: 0, karmaPerSecond: 5, level: 0, baseCost: 100, multiplier: 1, unlocked: false },
  { id: 'r-gaming', name: 'r/gaming', subscribers: 0, karmaPerSecond: 20, level: 0, baseCost: 500, multiplier: 1, unlocked: false },
  // Tier 2
  { id: 'r-aww', name: 'r/aww', subscribers: 0, karmaPerSecond: 75, level: 0, baseCost: 2000, multiplier: 1, unlocked: false },
  { id: 'r-science', name: 'r/science', subscribers: 0, karmaPerSecond: 150, level: 0, baseCost: 5000, multiplier: 1, unlocked: false },
  { id: 'r-worldnews', name: 'r/worldnews', subscribers: 0, karmaPerSecond: 300, level: 0, baseCost: 10000, multiplier: 1, unlocked: false },
  // Tier 3
  { id: 'r-movies', name: 'r/movies', subscribers: 0, karmaPerSecond: 800, level: 0, baseCost: 25000, multiplier: 1, unlocked: false },
  { id: 'r-music', name: 'r/music', subscribers: 0, karmaPerSecond: 1500, level: 0, baseCost: 50000, multiplier: 1, unlocked: false },
  { id: 'r-technology', name: 'r/technology', subscribers: 0, karmaPerSecond: 3000, level: 0, baseCost: 100000, multiplier: 1, unlocked: false },
  // Tier 4
  { id: 'r-todayilearned', name: 'r/todayilearned', subscribers: 0, karmaPerSecond: 8000, level: 0, baseCost: 250000, multiplier: 1, unlocked: false },
  { id: 'r-askreddit', name: 'r/askreddit', subscribers: 0, karmaPerSecond: 15000, level: 0, baseCost: 500000, multiplier: 1, unlocked: false },
  { id: 'r-showerthoughts', name: 'r/showerthoughts', subscribers: 0, karmaPerSecond: 30000, level: 0, baseCost: 1000000, multiplier: 1, unlocked: false },
  // Tier 5
  { id: 'r-wallstreetbets', name: 'r/wallstreetbets', subscribers: 0, karmaPerSecond: 80000, level: 0, baseCost: 2500000, multiplier: 1, unlocked: false },
  { id: 'r-cryptocurrency', name: 'r/cryptocurrency', subscribers: 0, karmaPerSecond: 150000, level: 0, baseCost: 5000000, multiplier: 1, unlocked: false },
  { id: 'r-announcements', name: 'r/announcements', subscribers: 0, karmaPerSecond: 500000, level: 0, baseCost: 10000000, multiplier: 1, unlocked: false },
];

const INITIAL_UPGRADES: GlobalUpgrade[] = [
  // Tier 1
  { id: 'automod', name: 'Automod', description: 'Reduces spam and increases efficiency. +10% KPS', cost: 50, multiplier: 1.1, purchased: false, type: 'passive' },
  { id: 'meme-factory', name: 'Meme Factory', description: 'Industrial grade memes. 2x Click Power', cost: 100, multiplier: 2, purchased: false, type: 'click' },
  { id: 'influencer-partnership', name: 'Influencer Partnership', description: 'Big names are talking about your subs. +20% KPS', cost: 250, multiplier: 1.2, purchased: false, type: 'passive' },
  { id: 'better-titles', name: 'Better Titles', description: 'Catchier titles lead to more clicks. +15% KPS', cost: 500, multiplier: 1.15, purchased: false, type: 'passive' },
  { id: 'clickbait-mastery', name: 'Clickbait Mastery', description: "You won't believe how much karma you'll get! 3x Click Power", cost: 750, multiplier: 3, purchased: false, type: 'click' },
  // Tier 2
  { id: 'dedicated-mods', name: 'Dedicated Mods', description: '24/7 moderation for your communities. +25% KPS', cost: 1500, multiplier: 1.25, purchased: false, type: 'passive' },
  { id: 'subreddit-wiki', name: 'Subreddit Wiki', description: 'Better organization for new users. +30% KPS', cost: 3000, multiplier: 1.3, purchased: false, type: 'passive' },
  { id: 'discord-server', name: 'Discord Server', description: 'Build a community outside of Reddit. +40% KPS', cost: 5000, multiplier: 1.4, purchased: false, type: 'passive' },
  { id: 'bot-network', name: 'Bot Network', description: 'Automated engagement (the "good" kind). +50% KPS', cost: 8000, multiplier: 1.5, purchased: false, type: 'passive' },
  // Tier 3
  { id: 'trending-tab', name: 'Trending Tab', description: 'Get featured on the trending tab more often. +50% Viral Duration', cost: 15000, multiplier: 1.5, purchased: false, type: 'event' },
  { id: 'front-page-feature', name: 'Front Page Feature', description: 'A guaranteed spot on the front page. 2x Viral Multiplier', cost: 30000, multiplier: 2, purchased: false, type: 'event' },
  { id: 'cross-posting', name: 'Cross-posting Strategy', description: 'Share your content across multiple subs. +100% KPS', cost: 60000, multiplier: 2, purchased: false, type: 'passive' },
  { id: 'viral-loop', name: 'Viral Loop', description: 'One viral post leads to another. 2x Viral Frequency', cost: 90000, multiplier: 2, purchased: false, type: 'event' },
  // Tier 4
  { id: 'algo-optimization', name: 'Algorithm Optimization', description: 'You know exactly what the algorithm wants. +150% KPS', cost: 150000, multiplier: 2.5, purchased: false, type: 'passive' },
  { id: 'verified-status', name: 'Verified Status', description: 'Blue checkmarks for everyone! +200% KPS', cost: 300000, multiplier: 3, purchased: false, type: 'passive' },
  { id: 'media-empire', name: 'Media Empire', description: 'You own the news cycle. 5x Click Power', cost: 600000, multiplier: 5, purchased: false, type: 'click' },
  { id: 'global-reach', name: 'Global Reach', description: 'Your content is translated into every language. +300% KPS', cost: 900000, multiplier: 4, purchased: false, type: 'passive' },
  // Tier 5
  { id: 'internet-sensation', name: 'Internet Sensation', description: 'Everyone knows your name. +500% KPS', cost: 1500000, multiplier: 6, purchased: false, type: 'passive' },
  { id: 'cultural-phenomenon', name: 'Cultural Phenomenon', description: 'You are the zeitgeist. 5x Viral Multiplier', cost: 3000000, multiplier: 5, purchased: false, type: 'event' },
  { id: 'mainstream-media', name: 'Mainstream Media', description: 'TV, Radio, and Newspapers are talking. +1000% KPS', cost: 6000000, multiplier: 11, purchased: false, type: 'passive' },
  { id: 'front-page-internet', name: 'Front Page of the Internet', description: 'You ARE Reddit. 10x Click Power', cost: 10000000, multiplier: 10, purchased: false, type: 'click' },
];

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      totalKarma: 0,
      lifetimeKarma: 0,
      subreddits: INITIAL_SUBREDDITS,
      upgrades: INITIAL_UPGRADES,
      activeEvents: [],
      lastTick: Date.now(),

      addKarma: (amount: number) => {
        const state = get();
        const clickMultiplier = state.upgrades
          .filter((u) => u.purchased && u.type === 'click')
          .reduce((acc, u) => acc * u.multiplier, 1);
        
        const finalAmount = amount * clickMultiplier;
        
        set((state: GameState) => ({
          totalKarma: state.totalKarma + finalAmount,
          lifetimeKarma: state.lifetimeKarma + finalAmount,
        }));
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
        }
      },

      upgradeSubreddit: (id: string) => {
        const state = get();
        const subreddit = state.subreddits.find((s) => s.id === id);
        if (!subreddit) return;

        const cost = subreddit.baseCost * Math.pow(1.15, subreddit.level);
        if (state.totalKarma >= cost) {
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
        }
      },

      tick: (delta: number) => {
        const state = get();
        
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
        const newEvents = [...updatedEvents];
        
        if (Math.random() < VIRAL_CHANCE * delta) {
          const unlockedSubs = state.subreddits.filter(s => s.unlocked);
          if (unlockedSubs.length > 0) {
            const randomSub = unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
            const eventId = `viral-${Date.now()}`;
            
            const viralDurationMultiplier = state.upgrades
              .filter(u => u.purchased && u.id === 'trending-tab')
              .reduce((acc, u) => acc * u.multiplier, 1);
            
            const viralPowerMultiplier = state.upgrades
              .filter(u => u.purchased && (u.id === 'front-page-feature' || u.id === 'cultural-phenomenon'))
              .reduce((acc, u) => acc * u.multiplier, 1);

            const baseDuration = 30;
            const baseMultiplier = 5;

            newEvents.push({
              id: eventId,
              name: `Viral Post in ${randomSub.name}!`,
              subredditId: randomSub.id,
              multiplier: baseMultiplier * viralPowerMultiplier,
              duration: baseDuration * viralDurationMultiplier,
              remainingTime: baseDuration * viralDurationMultiplier,
            });
          }
        }

        // 3. Calculate income
        let income = 0;
        state.subreddits.forEach((sub) => {
          if (sub.level > 0) {
            const subEventMultiplier = newEvents
              .filter(e => e.subredditId === sub.id)
              .reduce((acc, e) => acc * e.multiplier, 1);
            
            income += sub.karmaPerSecond * sub.level * sub.multiplier * subEventMultiplier * delta;
          }
        });

        const passiveUpgradeMultiplier = state.upgrades
          .filter((u) => u.purchased && u.type === 'passive')
          .reduce((acc, u) => acc * u.multiplier, 1);

        const globalMultiplier = newEvents
          .filter(e => !e.subredditId)
          .reduce((acc, event) => acc * event.multiplier, 1);

        const totalIncome = income * passiveUpgradeMultiplier * globalMultiplier;

        set((state: GameState) => ({
          totalKarma: state.totalKarma + totalIncome,
          lifetimeKarma: state.lifetimeKarma + totalIncome,
          activeEvents: newEvents,
          lastTick: Date.now(),
        }));
      },
    }),
    {
      name: 'karma-tycoon-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
