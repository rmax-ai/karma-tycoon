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
- **Tier 5**: Unlimited (but subject to Algorithm Fatigue)

## 2. Dynamic Subreddit Activity (Seasonality)

Subreddits are not equally active at all times. Each subreddit has a "Typical Activity Curve" that fluctuates over time.

### Activity Multiplier
The activity level acts as a multiplier for both passive income and the potential of new posts created in that subreddit.
$$Activity_{sub}(t) = 1.0 + 0.5 \times \sin(2\pi \times \frac{t}{Period} + Phase)$$

- **Period**: Unique to each subreddit (e.g., 1 hour for news, 24 hours for memes).
- **Phase**: Randomly assigned to ensure different subreddits peak at different times.

## 3. Algorithm Fatigue

Posting too frequently in the same subreddit causes "Algorithm Fatigue," reducing the visibility of new posts.

- **Effect**: Each new post in a subreddit within a short window reduces the `PeakKPS` of subsequent posts in that same subreddit by 10% (stacking up to 80%).
- **Recovery**: Fatigue decays over time when the player stops posting in that specific subreddit.
- **Strategy**: Encourages players to rotate content across all unlocked subreddits.

## 4. Moderation & Community Health

As subreddits grow (higher levels), they attract more "Spam" and "Trolls," which negatively impact KPS.

- **Community Health**: A percentage (0-100%). If health drops below 50%, KPS is penalized.
- **Moderators**: A new type of upgrade. Hiring moderators provides passive health regeneration.
- **Manual Action**: Players can occasionally "Clear Mod Queue" (a mini-game or simple click) to instantly boost health.

## 5. Subreddit Synergies

Certain subreddits have natural affinities.
- **Cross-Pollination**: A viral post in `r/gaming` might provide a 15% activity boost to `r/technology` for 10 minutes.
- **Network Effect**: Owning all subreddits in a specific category (e.g., "Entertainment") provides a global multiplier to that category.

## 6. Quality vs. Quantity

The "Create Content" action can be modified by player behavior:
- **Quick Post**: Single click. Standard curve.
- **High-Effort Post**: Hold the button for 3 seconds. Consumes more "energy" (if implemented) or simply takes longer, but results in a post with 3x PeakKPS and 2x Duration.
