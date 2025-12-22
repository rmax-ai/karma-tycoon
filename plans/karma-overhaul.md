# Implementation Plan: Karma Calculation Overhaul

This plan outlines the steps to implement the new game dynamics described in `docs/GAME_DYNAMICS.md`.

## Phase 1: Core Logic (Zustand Store)

### 1. Update Data Structures
- Add `Post` interface to `useGameStore.ts`.
- Add `activePosts: Post[]` to `GameState`.
- Add `activityPeriod`, `activityPhase`, and `fatigue` to `Subreddit` interface.
- Add `maxPostSlots` to `TierInfo`.

### 2. Implement Popularity Curve Function
- Create a helper function `calculatePostKPS(post, currentTime)` that implements the Gamma distribution formula.

### 3. Update `tick` Action
- Iterate through `activePosts`.
- Calculate KPS for each post and add to total income.
- Remove posts that have reached the end of their lifecycle.
- Update subreddit activity multipliers based on `Date.now()`.
- Apply `fatigue` decay.

### 4. Update `addKarma` (Content Creation)
- Check if `activePosts.length < maxPostSlots`.
- Select a random unlocked subreddit (or allow user to select).
- Create a new `Post` with random quality/virality parameters.
- Increase `fatigue` for the chosen subreddit.

## Phase 2: UI Updates

### 1. Dashboard Overhaul
- Replace the simple "Total KPS" with a breakdown (Passive vs. Active Posts).
- Add a "Post Slots" indicator (e.g., "3/5 Posts Active").
- Add a list of active posts with progress bars showing their lifecycle/popularity.

### 2. Subreddit List Updates
- Show the current "Activity Level" (e.g., "High Activity", "Quiet Hours").
- Show "Algorithm Fatigue" status if applicable.

## Phase 3: Advanced Mechanics

### 1. Algorithm Fatigue & Recovery
- Implement the stacking penalty for rapid posting.
- Ensure fatigue decays even when the game is closed (using `lastTick`).

### 2. Quality vs. Quantity
- Update the "Create Content" button to support `onMouseDown` and `onMouseUp`.
- Implement a "Charging" state in the UI.
- Generate a "High Quality" post if held for > 3 seconds.

## Phase 4: Balancing & Polish
- Tune the $k$ and $PeakTime$ parameters to ensure the game feels "snappy" but slows down naturally.
- Add animations for post "peaking" and "dying out".
