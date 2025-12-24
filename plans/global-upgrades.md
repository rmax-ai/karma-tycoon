# Global Upgrade & Subreddit Tiers

This document defines the tiers of global upgrades and subreddits for Karma Tycoon, scaling exponentially in cost and power.

## Tier 1: The Basics (10 - 1,000 Karma)
*Focus: Initial growth and click power.*

### Upgrades
| ID | Name | Description | Cost | Effect | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `automod` | Automod | Reduces spam and increases efficiency. | 50 | +10% KPS | `passive` |
| `meme-factory` | Meme Factory | Industrial grade memes. | 100 | 2x Click Power | `click` |
| `influencer-partnership` | Influencer Partnership | Big names are talking about your subs. | 250 | +20% KPS | `passive` |
| `better-titles` | Better Titles | Catchier titles lead to more clicks. | 500 | +15% KPS | `passive` |
| `community-synergy` | Community Synergy | Coordinated posting keeps the energy reservoir topped off. | 1,000 | +10% Energy Recharge | `passive` |

### Subreddits
| ID | Name | Base Cost | KPS |
| :--- | :--- | :--- | :--- |
| `r-funny` | r/funny | 10 | 1 |
| `r-pics` | r/pics | 100 | 5 |
| `r-gaming` | r/gaming | 500 | 20 |

---

## Tier 2: Community Management (1,000 - 10,000 Karma)
*Focus: Efficiency, moderation, and basic automation.*

### Upgrades
| ID | Name | Description | Cost | Effect | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dedicated-mods` | Dedicated Mods | 24/7 moderation for your communities. | 1,500 | +25% KPS | `passive` |
| `subreddit-wiki` | Subreddit Wiki | Better organization for new users. | 3,000 | +30% KPS | `passive` |
| `community-partnerships` | Community Partnerships | Partnered communities share notifications so energy refills faster. | 100,000 | +20% Energy Recharge | `passive` |
| `bot-network` | Bot Network | Automated engagement (the "good" kind). | 8,000 | +50% KPS | `passive` |

### Subreddits
| ID | Name | Base Cost | KPS |
| :--- | :--- | :--- | :--- |
| `r-aww` | r/aww | 2,000 | 75 |
| `r-science` | r/science | 5,000 | 150 |
| `r-worldnews` | r/worldnews | 10,000 | 300 |

---

## Tier 3: Viral Growth (10,000 - 100,000 Karma)
*Focus: Events, trending topics, and engagement.*

### Upgrades
| ID | Name | Description | Cost | Effect | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `trending-tab` | Trending Tab | Get featured on the trending tab more often. | 15,000 | +50% Viral Duration | `event` |
| `momentum-lab` | Momentum Lab | Data experiments keep energy flowing through each subreddit. | 100,000,000 | +30% Energy Recharge | `passive` |
| `cross-posting` | Cross-posting Strategy | Share your content across multiple subs. | 60,000 | +100% KPS | `passive` |
| `viral-loop` | Viral Loop | One viral post leads to another. | 90,000 | 2x Viral Frequency | `event` |

### Subreddits
| ID | Name | Base Cost | KPS |
| :--- | :--- | :--- | :--- |
| `r-movies` | r/movies | 25,000 | 800 |
| `r-music` | r/music | 50,000 | 1,500 |
| `r-technology` | r/technology | 100,000 | 3,000 |

---

## Tier 4: Platform Dominance (100,000 - 1,000,000 Karma)
*Focus: Global influence and energy resilience.*

### Upgrades
| ID | Name | Description | Cost | Effect | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `algo-optimization` | Algorithm Optimization | You know exactly what the algorithm wants. | 150,000 | +150% KPS | `passive` |
| `verified-status` | Verified Status | Blue checkmarks for everyone! | 300,000 | +200% KPS | `passive` |
| `platform-institutes` | Platform Institutes | Research teams keep the energy returns predictable. | 10,000,000,000,000 | +40% Energy Recharge | `passive` |
| `global-reach` | Global Reach | Your content is translated into every language. | 900,000 | +300% KPS | `passive` |

### Subreddits
| ID | Name | Base Cost | KPS |
| :--- | :--- | :--- | :--- |
| `r-todayilearned` | r/todayilearned | 250,000 | 8,000 |
| `r-askreddit` | r/askreddit | 500,000 | 15,000 |
| `r-showerthoughts` | r/showerthoughts | 1,000,000 | 30,000 |

---

## Tier 5: The Front Page (1,000,000 - 10,000,000 Karma)
*Focus: End-game energy regeneration and massive exposure.*

### Upgrades
| ID | Name | Description | Cost | Effect | Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `internet-sensation` | Internet Sensation | Everyone knows your name. | 1,500,000 | +500% KPS | `passive` |
| `cultural-phenomenon` | Cultural Phenomenon | You are the zeitgeist. | 3,000,000 | 5x Viral Multiplier | `event` |
| `mainstream-media` | Mainstream Media | TV, Radio, and Newspapers are talking. | 6,000,000 | +1000% KPS | `passive` |
| `cultural-hegemony` | Cultural Hegemony | Your influence becomes cultural norms, feeding energy reserves. | 1,000,000,000,000,000,000,000 | +50% Energy Recharge | `passive` |

### Subreddits
| ID | Name | Base Cost | KPS |
| :--- | :--- | :--- | :--- |
| `r-wallstreetbets` | r/wallstreetbets | 2,500,000 | 80,000 |
| `r-cryptocurrency` | r/cryptocurrency | 5,000,000 | 150,000 |
| `r-announcements` | r/announcements | 10,000,000 | 500,000 |

## Implementation Notes
 
### New Upgrade Types
- `event`: Affects viral event parameters (duration, multiplier, frequency).
 
### Multiplier Calculation
- Passive multipliers should be additive or multiplicative?
  - Current implementation: `reduce((acc, u) => acc * u.multiplier, 1)` -> Multiplicative.
  - This is very powerful. We should ensure the multipliers are balanced.
  - If we use `+10%`, the multiplier is `1.1`.
  - If we have two `+10%` upgrades, it's `1.1 * 1.1 = 1.21` (21% increase).
 
### Energy Consumption
- Upgrade actions consume more energy at higher tiers: Tier 1 upgrades use 2 energy, Tier 2 use 4 energy, Tier 3 use 6 energy, Tier 4 use 8 energy, and Tier 5 use 10 energy per action.
 
### Viral Event Logic
- `Viral Duration`: Multiply `duration` and `remainingTime` when creating the event.
- `Viral Multiplier`: Multiply the `multiplier` of the event.
- `Viral Frequency`: Multiply the `VIRAL_CHANCE` in the `tick` function.
