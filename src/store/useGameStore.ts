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
  type: 'click' | 'passive';
}

export interface ViralEvent {
  id: string;
  name: string;
  subredditId?: string;
  multiplier: number;
  duration: number; // in seconds
  remainingTime: number;
}

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
  {
    id: 'r-funny',
    name: 'r/funny',
    subscribers: 0,
    karmaPerSecond: 1,
    level: 0,
    baseCost: 10,
    multiplier: 1,
    unlocked: true,
  },
  {
    id: 'r-pics',
    name: 'r/pics',
    subscribers: 0,
    karmaPerSecond: 5,
    level: 0,
    baseCost: 100,
    multiplier: 1,
    unlocked: false,
  },
  {
    id: 'r-gaming',
    name: 'r/gaming',
    subscribers: 0,
    karmaPerSecond: 20,
    level: 0,
    baseCost: 500,
    multiplier: 1,
    unlocked: false,
  },
];

const INITIAL_UPGRADES: GlobalUpgrade[] = [
  {
    id: 'automod',
    name: 'Automod',
    description: 'Reduces spam and increases efficiency. +10% KPS',
    cost: 50,
    multiplier: 1.1,
    purchased: false,
    type: 'passive',
  },
  {
    id: 'influencer-partnership',
    name: 'Influencer Partnership',
    description: 'Big names are talking about your subs. +20% KPS',
    cost: 250,
    multiplier: 1.2,
    purchased: false,
    type: 'passive',
  },
  {
    id: 'meme-factory',
    name: 'Meme Factory',
    description: 'Industrial grade memes. 2x Click Power',
    cost: 100,
    multiplier: 2,
    purchased: false,
    type: 'click',
  },
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

        // 2. Randomly trigger viral event (1% chance per second)
        const VIRAL_CHANCE = 0.01;
        const newEvents = [...updatedEvents];
        
        if (Math.random() < VIRAL_CHANCE * delta) {
          const unlockedSubs = state.subreddits.filter(s => s.unlocked);
          if (unlockedSubs.length > 0) {
            const randomSub = unlockedSubs[Math.floor(Math.random() * unlockedSubs.length)];
            const eventId = `viral-${Date.now()}`;
            newEvents.push({
              id: eventId,
              name: `Viral Post in ${randomSub.name}!`,
              subredditId: randomSub.id,
              multiplier: 5,
              duration: 30,
              remainingTime: 30,
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
