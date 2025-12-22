# Karma Tycoon: Game Dynamics

This document describes the advanced game dynamics designed to introduce challenge, strategic depth, and natural progression slowdowns.

## 1. Content Popularity Lifecycle

Instead of providing a flat, instantaneous karma reward, "Creating Content" (clicking the Post button) generates a **Post** entity with a defined lifecycle.

### Mathematical Model
Each post follows a popularity curve based on a Gamma distribution:
$$f(t) = PeakKPS \times \left(\frac{t}{PeakTime}\right)^k \times e^{k \times (1 - \frac{t}{PeakTime})}$$

- **PeakKPS**: The maximum karma per second the post generates. Determined by the subreddit's level and multipliers.
- **PeakTime**: The time (in seconds) it takes to reach maximum popularity.
- **k**: The "sharpness" factor. Higher values mean a faster rise and a steeper fall.

### Post Slots
Players are limited in how many active posts they can have simultaneously, based on their current Tier:
- **Tier 1**: 3 Slots
- **Tier 2**: 5 Slots
- **Tier 3**: 10 Slots
- **Tier 4**: 20 Slots
- **Tier 5**: 50 Slots

## 2. Click Energy (Action Points)

To prevent infinite clicking and introduce strategic pacing, manual interactions are governed by **Click Energy**.

### Inverse Scaling
The number of available clicks is inversely proportional to the player's Tier. As the player grows more influential, they post less frequently but with much higher impact.

| Tier | Max Energy | Recharge Rate | Click Power |
| :--- | :--- | :--- | :--- |
| 1 | 50 | 1s | 1x |
| 2 | 30 | 10s | 15x |
| 3 | 15 | 1m | 200x |
| 4 | 5 | 5m | 3,000x |
| 5 | 1 | 20m | 50,000x |

## 3. Dynamic Subreddit Activity (Seasonality)

Subreddits are not equally active at all times. Each subreddit has a "Typical Activity Curve" that fluctuates over time.

### Activity Multiplier
The activity level acts as a multiplier for both passive income and the potential of new posts created in that subreddit.
$$Activity_{sub}(t) = 1.0 + 0.5 \times \sin(2\pi \times \frac{t}{Period} + Phase)$$

- **Period**: Unique to each subreddit (e.g., 1 hour for news, 24 hours for memes).
- **Phase**: Randomly assigned to ensure different subreddits peak at different times.

## 4. Algorithm Fatigue

Posting too frequently in the same subreddit causes "Algorithm Fatigue," reducing the visibility of new posts.

- **Effect**: Each new post in a subreddit within a short window reduces the `PeakKPS` of subsequent posts in that same subreddit by 10% (stacking up to 80%).
- **Recovery**: Fatigue decays over time when the player stops posting in that specific subreddit.
- **Strategy**: Encourages players to rotate content across all unlocked subreddits.

## 5. Moderation & Community Health

As subreddits grow (higher levels), they attract more "Spam" and "Trolls," which negatively impact KPS.

- **Community Health**: A percentage (0-100%). If health drops below 75%, KPS is penalized. The penalty is linear (e.g., 37.5% health results in a 50% KPS reduction). This penalty applies to both passive income and the potential of new posts.
- **Moderators**: A new type of upgrade. Hiring moderators provides passive health regeneration.
- **Manual Action**: Players can occasionally "Clear Mod Queue" (a mini-game or simple click) to instantly boost health.

## 6. Viral Events & Crises

The game features random events that can significantly boost or hinder your progress.

### Viral Opportunities (Positive)
- **Trigger**: 1% chance per second (modified by upgrades).
- **Effect**: Provides a significant KPS multiplier (2x to 20x) to a specific subreddit for a limited time.

### Crises (Negative)
- **Trigger**: 0.5% chance per second.
- **Variants**:
    - **Subreddit Drama**: 0.5x multiplier (Local).
    - **Mod Abuse**: 0.2x multiplier and instant 40% health loss (Local).
    - **Brigaded!**: 0.1x multiplier (Local).
    - **Algorithm Suppression**: 0.5x multiplier (Global).
    - **Server Outage**: 0.05x multiplier (Global).

## 7. Game Over (Stagnation)

If your total Karma Per Second (KPS) reaches 0, your influence begins to fade.

- **Trigger**: Total KPS (Passive + Active Posts) is 0, and at least one subreddit is unlocked.
- **Grace Period**: Upon reaching 0 KPS, you are given a 60-second grace period (if you choose to "Continue") to create new content and restore growth.
- **Consequence**: If the grace period expires and KPS is still 0, the game enters a "Stagnation" state where you must either reset your progress or attempt to recover.

## 8. Subreddit Synergies

Certain subreddits have natural affinities.
- **Cross-Pollination**: A viral post in `r/gaming` might provide a 15% activity boost to `r/technology` for 10 minutes.
- **Network Effect**: Owning all subreddits in a specific category (e.g., "Entertainment") provides a global multiplier to that category.

## 9. Quality vs. Quantity

The "Create Content" action can be modified by player behavior:
- **Quick Post**: Single click. Consumes 1 Energy.
- **High-Effort Post**: Hold the button for 3 seconds. Consumes 5 Energy (if available), but results in a post with 3x PeakKPS and 2x Duration.
