# Karma Tycoon Architecture

This document outlines the technical architecture and core mechanics of Karma Tycoon.

## Tech Stack

- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org) - Provides the foundation for the web application, including routing and server-side rendering capabilities.
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Used for utility-first styling, ensuring a responsive and modern UI.
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) - A collection of reusable components built with Radix UI and Tailwind CSS.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - A small, fast, and scalable bearbones state-management solution.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - Used for smooth transitions and interactive UI elements.
- **Icons**: [Lucide React](https://lucide.dev) - A library of beautiful, consistent icons.

## State Management Strategy

The game state is managed using a single Zustand store located in [`src/store/useGameStore.ts`](src/store/useGameStore.ts).

### Persistence
The store uses the `persist` middleware to automatically save and load the game state from `localStorage`. This ensures that players don't lose their progress when they close the browser or refresh the page.

### Store Structure
The store contains:
- **State**: `totalKarma`, `lifetimeKarma`, `subreddits`, `upgrades`, `activeEvents`, and `lastTick`.
- **Actions**: `addKarma`, `purchaseSubreddit`, `upgradeSubreddit`, `purchaseUpgrade`, and `tick`.

## Game Loop Implementation

The game loop is driven by the [`useGameLoop`](src/hooks/useGameLoop.ts) hook, which utilizes `requestAnimationFrame` for smooth updates.

- **Frequency**: The loop attempts to run at 60fps, but the game logic (the `tick` action) is throttled to execute at most every 100ms to balance performance and responsiveness.
- **Delta Time**: The `tick` function receives a `delta` (time elapsed since the last tick in seconds), which is used to calculate passive income and update event durations accurately regardless of frame rate.

## Core Mechanics & Formulas

### Karma Generation
Karma is generated through two primary methods:
1.  **Active Clicking**: Clicking the "Post" button in the Dashboard.
2.  **Passive Income**: Subreddits generate karma over time based on their level and multipliers.

### Cost Scaling
The cost of purchasing or upgrading a subreddit follows an exponential scaling formula:
$Cost = BaseCost \times 1.15^{Level}$

### Level Milestones
Subreddits receive significant boosts at specific level milestones:
- **Levels 25, 50, and 100**: The subreddit's income multiplier doubles.

### Viral Events
Viral events are random occurrences that provide temporary boosts:
- **Trigger**: 1% chance per second.
- **Effect**: 5x multiplier to a specific subreddit's income.
- **Duration**: 30 seconds.

## Advanced Game Dynamics
For detailed information on popularity curves, seasonality, and algorithm fatigue, see [GAME_DYNAMICS.md](GAME_DYNAMICS.md).

## Data Structures

### Subreddit
```typescript
interface Subreddit {
  id: string;
  name: string;
  subscribers: number;
  karmaPerSecond: number;
  level: number;
  baseCost: number;
  multiplier: number;
  unlocked: boolean;
}
```

### Global Upgrade
```typescript
interface GlobalUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
  type: 'click' | 'passive';
}
```
