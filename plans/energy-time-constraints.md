# Plan: Energy and Time Constraints for Actions

This plan outlines the implementation of energy costs and time delays for all major game actions in Karma Tycoon.

## 1. Data Structure Changes

### `src/store/useGameStore.ts`
- Replace `crafting` state with `activeAction`.
- Define `ActionType`: `'post' | 'upgrade' | 'levelup' | 'modqueue'`.
- Define `ActiveAction` interface:
  ```typescript
  export interface ActiveAction {
    type: ActionType;
    duration: number;
    remainingTime: number;
    label: string;
    data: {
      subredditId?: string;
      upgradeId?: string;
      qualityMultiplier?: number;
    };
  }
  ```

## 2. Energy System Adjustments

### `TIER_THRESHOLDS` Update
Adjust `maxEnergy` and `rechargeRate` to accommodate scaling costs while keeping the "Inverse Scaling" theme:
- **Tier 1**: Max 100, Recharge 1s
- **Tier 2**: Max 80, Recharge 5s
- **Tier 3**: Max 60, Recharge 20s
- **Tier 4**: Max 40, Recharge 60s
- **Tier 5**: Max 20, Recharge 300s

### Scaling Energy Costs
- **Create Post**: `1 * Tier`
- **Buy Upgrade**: `2 * Tier`
- **Level Up**: `3 * Tier`
- **Mod Queue**: `2 * Tier`

## 3. Action Logic Implementation

### `startAction` Method
A centralized method to initiate any action:
1. Check if an action is already in progress.
2. Check if the user has enough energy.
3. Calculate a random duration based on the action type:
   - **Upgrade**: 3-13s
   - **Post**: 3-30s
   - **Level Up**: 10-60s
   - **Mod Queue**: 30-60s
4. Deduct energy and set `activeAction`.

### `tick` Method Update
- Decrement `remainingTime` of `activeAction`.
- On completion (`remainingTime <= 0`):
  - Execute the specific logic for the action type (e.g., add post, level up subreddit).
  - Clear `activeAction`.

## 4. UI Components

### `src/components/ActionOverlay.tsx` (New)
- A global, full-screen (or high-z-index) overlay.
- Displays:
  - `Hourglass` icon from `lucide-react` (animated).
  - Progress bar showing `remainingTime / duration`.
  - Action label (e.g., "Upgrading r/funny...").
- Uses a semi-transparent backdrop to prevent clicks on other elements.

### Component Updates
- **`Dashboard.tsx`**: Remove local crafting logic; disable "Create Content" if action active.
- **`SubredditList.tsx`**: Disable "Create Post", "Level Up", and "Mod Queue" buttons if action active.
- **`UpgradesList.tsx`**: Disable "Buy" buttons if action active.

## 5. Integration
- Add `ActionOverlay` to `src/app/page.tsx` so it's globally available.

## 6. Verification
- Test each action type to ensure:
  - Energy is deducted correctly.
  - The overlay appears and blocks input.
  - The action completes after the correct delay.
  - The effects (karma, levels, upgrades) are applied only after completion.
