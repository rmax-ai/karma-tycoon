# Plan: Temporary Upgrades System

## Overview
Modify the upgrade system to make all upgrades temporary. Upgrades will have a duration, and once they expire, they must be repurchased. The cost of each upgrade will increase by 15% per purchase.

## Data Structure Changes

### `GlobalUpgrade` Interface
```typescript
export interface GlobalUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number; // Original cost
  cost: number; // Current cost (scaled)
  multiplier: number;
  purchased: boolean;
  type: 'click' | 'passive' | 'event';
  tier: number;
  duration: number; // Total duration in seconds
  remainingTime: number; // Current time left in seconds
  level: number; // Number of times purchased
}
```

## Logic Changes

### Cost Scaling
Cost formula: $Cost = BaseCost \times 1.15^{Level}$

### Purchase Logic
When an upgrade is purchased:
1. `level` increments.
2. `purchased` becomes `true`.
3. `remainingTime` is set to `duration`.
4. `cost` is updated for the next purchase.

### Expiration Logic (in `tick`)
Every tick:
1. If `purchased` is `true`:
   - Decrement `remainingTime` by `delta`.
   - If `remainingTime <= 0`:
     - Set `purchased` to `false`.
     - Set `remainingTime` to `0`.

## UI Changes

### `UpgradesList.tsx`
- Display a countdown timer or progress bar on active upgrades.
- Show the current scaled cost.
- Enable the "Buy" button when `purchased` is `false`.
- Update button label to show "Active" or "Expired/Buy".

## Durations (Proposed)
- Tier 1: 300s (5m)
- Tier 2: 600s (10m)
- Tier 3: 1200s (20m)
- Tier 4: 1800s (30m)
- Tier 5: 3600s (60m)
