# Testing Strategy - Karma Tycoon

This document outlines the testing strategy for Karma Tycoon, focusing on high-level feature acceptance tests to ensure core game mechanics function correctly.

## Strategy Overview

We prioritize **End-to-End (E2E) testing** using browser automation. This approach validates the integration of the Next.js frontend, Zustand state management, and the game loop from the player's perspective.

### Recommended Tool: Playwright

[Playwright](https://playwright.dev/) is the recommended tool for browser automation due to its reliability, speed, and excellent developer experience (including UI mode for debugging).

## Key Test Scenarios

The following scenarios are implemented in `tests/gameplay.spec.ts` and use `data-testid` attributes for robust selection.

### 1. Manual Clicking
- **Scenario**: Clicking the main "Create Content" button increases karma.
- **Steps**:
    1. Navigate to the game.
    2. Note the current total karma (initially 0).
    3. Click the "Create Content" button.
- **Expectation**: Total karma increases by the current click value (default is 1).
- **Selector**: `data-testid="create-content-btn"`, `data-testid="total-karma"`

### 2. Purchasing a Subreddit
- **Scenario**: Buying a new subreddit reduces karma and increases passive income.
- **Steps**:
    1. Accumulate enough karma to purchase a subreddit (e.g., r/funny).
    2. Click the "Unlock" button for the subreddit.
- **Expectation**: 
    - Total karma decreases by the subreddit's base cost.
    - Karma Per Second (KPS) increases by the subreddit's base KPS.
    - The subreddit level becomes 1.
- **Selector**: `data-testid="subreddit-upgrade-btn-funny"`, `data-testid="subreddit-level-funny"`

### 3. Leveling Up a Subreddit
- **Scenario**: Upgrading an owned subreddit increases its KPS and future upgrade cost.
- **Steps**:
    1. Purchase a subreddit.
    2. Click the "Upgrade" button for that subreddit.
- **Expectation**:
    - Subreddit level increases by 1.
    - Total KPS increases.
    - The cost for the next level increases (following the $Cost = BaseCost \times 1.15^{Level}$ formula).

### 4. Global Upgrades
- **Scenario**: Purchasing global upgrades correctly applies multipliers.
- **Steps**:
    1. Accumulate enough karma for a global upgrade (e.g., "Better Titles").
    2. Purchase the upgrade.
- **Expectation**:
    - The corresponding multiplier (click or passive) is applied.
    - If it's a click upgrade, manual clicks now grant more karma.
    - If it's a passive upgrade, KPS increases across relevant subreddits.

### 5. Persistence (State Recovery)
- **Scenario**: Refreshing the page maintains the game state.
- **Steps**:
    1. Play the game to reach a specific state (e.g., 5 Karma).
    2. Refresh the browser page.
- **Expectation**: The game loads with 5 Karma intact (verified via `localStorage` persistence).

## Getting Started with Playwright

### Installation

If Playwright is not yet installed in the project, run:

```bash
npm install -D @playwright/test
npx playwright install
```

### Running Tests

To run all tests in headless mode:

```bash
npx playwright test
```

To run tests in a specific browser (e.g., Chromium):

```bash
npx playwright test --project=chromium
```

### Debugging with UI Mode

Playwright's UI mode provides a time-travel debugging experience, allowing you to see exactly what happens at each step of the test.

To launch UI mode:

```bash
npx playwright test --ui
```

In UI mode, you can:
- Step through each action.
- Inspect the DOM at any point in time.
- View console logs and network requests.
- Use the "Pick Locator" tool to easily find selectors for your tests.
