import { Subreddit, Post, GlobalUpgrade, ViralEvent, TierInfo } from '@/store/useGameStore';

export interface SubredditKpsBreakdown {
  id: string;
  name: string;
  baseKps: number;
  level: number;
  multiplier: number;
  activityScore: number;
  activityMultiplier: number;
  fatigueMultiplier: number;
  healthMultiplier: number;
  synergyMultiplier: number;
  localMultiplier: number;
  finalKps: number;
  postKps: number;
}

export interface KpsBreakdownData {
  subreddits: SubredditKpsBreakdown[];
  passiveUpgradeMultiplier: number;
  globalMultiplier: number;
  postKps: number;
  totalKps: number;
}

export const calculateKpsBreakdown = (
  subreddits: Subreddit[],
  activePosts: Post[],
  upgrades: GlobalUpgrade[],
  activeEvents: ViralEvent[],
  currentTier: TierInfo,
  now: number = Date.now()
): KpsBreakdownData => {
  const globalMultiplier = activeEvents
    .filter(e => !e.subredditId)
    .reduce((acc, event) => acc * event.multiplier, 1);

  const passiveUpgradeMultiplier = upgrades
    .filter((u) => u.purchased && u.type === 'passive')
    .reduce((acc, u) => acc * u.multiplier, 1);

  const subredditsWithKps = subreddits
    .filter(sub => sub.level > 0)
    .map(sub => {
      const activityMultiplier = 1.0 + 0.5 * Math.sin((2 * Math.PI * (now / 1000)) / sub.activityPeriod + sub.activityPhase);
      const fatigueMultiplier = 1 - (sub.fatigue || 0);
      const healthMultiplier = (sub.health || 100) < 75 ? ((sub.health || 100) / 75) : 1;

      const activePostsInSub = activePosts.filter(p => p.subredditId === sub.id);
      const activityScore = activePostsInSub.length === 0 ? 0 : activePostsInSub.length === 1 ? 0.5 : 1;

      const synergyPosts = activePosts.filter(p => {
        const postSub = subreddits.find(s => s.id === p.subredditId);
        return postSub?.category === sub.category && p.subredditId !== sub.id;
      });
      const synergyMultiplier = 1 + (synergyPosts.length * 0.05);

      const localEvents = activeEvents.filter(e => e.subredditId === sub.id);
      const localMultiplier = localEvents.reduce((acc, e) => acc * e.multiplier, 1);

      const baseKps = sub.karmaPerSecond * sub.level * sub.multiplier;
      const efficiency = activityScore * activityMultiplier * fatigueMultiplier * healthMultiplier * synergyMultiplier * localMultiplier;
      const finalKps = baseKps * efficiency;

      return {
        id: sub.id,
        name: sub.name,
        baseKps,
        level: sub.level,
        multiplier: sub.multiplier,
        activityScore,
        activityMultiplier,
        fatigueMultiplier,
        healthMultiplier,
        synergyMultiplier,
        localMultiplier,
        finalKps,
        postKps: 0 // Will be populated below
      };
    });

  const passiveKps = subredditsWithKps.reduce((acc, sub) => acc + sub.finalKps, 0);

  let totalPostKps = 0;
  activePosts.forEach((post) => {
    const t = (now - post.createdAt) / 1000;
    const ratio = Math.max(0, t / post.peakTime);
    const kps = post.peakKps * Math.pow(ratio, post.k) * Math.exp(post.k * (1 - ratio));
    totalPostKps += kps;

    const subBreakdown = subredditsWithKps.find(s => s.id === post.subredditId);
    if (subBreakdown) {
      subBreakdown.postKps += kps;
    }
  });

  // Note: postKps already includes some multipliers from addKarma, but tick() multiplies it again by passiveUpgradeMultiplier and globalMultiplier
  // We follow the tick() logic here for consistency
  const totalKps = (passiveKps + totalPostKps) * passiveUpgradeMultiplier * globalMultiplier;

  return {
    subreddits: subredditsWithKps,
    passiveUpgradeMultiplier,
    globalMultiplier,
    postKps: totalPostKps,
    totalKps
  };
};
