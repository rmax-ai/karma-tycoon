'use client';

import React from 'react';
import { useGameStore, Subreddit, TIER_THRESHOLDS, ACTION_ENERGY_COSTS } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, ArrowUpCircle, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatKarma } from '@/lib/utils';

export const SubredditList = () => {
  const subreddits = useGameStore((state) => state.subreddits);
  const spendableKarma = useGameStore((state) => state.spendableKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const startAction = useGameStore((state) => state.startAction);
  const activeAction = useGameStore((state) => state.activeAction);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const activePosts = useGameStore((state) => state.activePosts);
  const breakdown = useGameStore((state) => state.currentKpsBreakdown);

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  const calculateCost = (subreddit: Subreddit) => {
    return Math.floor(subreddit.baseCost * Math.pow(1.15, subreddit.level));
  };

  // Filter subreddits by tier
  const visibleSubreddits = subreddits.filter(sub => sub.tier <= currentTier.tier);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="subreddits">
      {visibleSubreddits.map((sub) => {
        const cost = calculateCost(sub);
        const canAfford = spendableKarma >= cost;
        
        const viralEvent = activeEvents.find(e => e.subredditId === sub.id);
        const subEventMultiplier = viralEvent ? viralEvent.multiplier : 1;
        
        const subBreakdown = breakdown.subreddits.find(s => s.id === sub.id);
        const kps = subBreakdown ? ((subBreakdown.finalKps || 0) + (subBreakdown.postKps || 0)) * (breakdown.passiveUpgradeMultiplier || 1) * (breakdown.globalMultiplier || 1) : 0;
        const isViral = subEventMultiplier > 1;

        const activityMultiplier = subBreakdown ? subBreakdown.activityMultiplier : 1;
        const activityLevel = activityMultiplier > 1.3 ? 'High' : activityMultiplier < 0.7 ? 'Low' : 'Normal';
        const fatigueLevel = (sub.fatigue || 0) * 100;
        const health = sub.health || 100;

        const activeInSub = activePosts.filter(p => p.subredditId === sub.id).length;
        let subSlots = 1;
        if (sub.level >= 100) subSlots += 1;
        if (sub.level >= 1000) subSlots += 1;
        const isSubFull = activeInSub >= subSlots;

        return (
          <motion.div
            key={sub.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            data-testid={`subreddit-card-${sub.id}`}
          >
            <Card className={`${!sub.unlocked && sub.level === 0 ? 'opacity-60' : ''} ${isViral ? 'border-orange-500 ring-2 ring-orange-500/20' : ''} transition-all duration-300`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      {sub.name}
                      {isViral && <Zap className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />}
                    </CardTitle>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={sub.level}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardDescription data-testid={`subreddit-level-${sub.id}`}>Level {sub.level}</CardDescription>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Income:</span>
                  <div className="flex flex-col items-end">
                    <span className={`font-semibold ${isViral ? 'text-orange-600' : ''}`} data-testid={`subreddit-kps-${sub.id}`}>
                      {formatKarma(kps)} KPS
                    </span>
                    {isViral && (
                      <span className="text-[10px] font-bold text-orange-500 uppercase">
                        {subEventMultiplier}x Viral Boost!
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                    <span className="text-muted-foreground">Activity:</span>
                    <span className={activityLevel === 'High' ? 'text-green-500' : activityLevel === 'Low' ? 'text-blue-400' : 'text-muted-foreground'}>
                      {activityLevel}
                    </span>
                  </div>
                  {fatigueLevel > 5 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter text-red-400">
                        <span>Algorithm Fatigue:</span>
                        <span>{fatigueLevel.toFixed(0)}%</span>
                      </div>
                      <Progress value={fatigueLevel} className="h-1 bg-red-950" />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                      <span className="text-muted-foreground">Community Health:</span>
                      <span className={health < 50 ? 'text-red-500' : 'text-green-500'}>
                        {health.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={health} className={`h-1 ${health < 50 ? 'bg-red-950' : 'bg-green-950'}`} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {sub.unlocked && (
                    <Button
                      variant={isViral ? "default" : "secondary"}
                      size="sm"
                      className={`w-full text-[10px] h-8 ${isViral ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' : ''}`}
                      onClick={() => startAction('post', { subredditId: sub.id, qualityMultiplier: 1, isViral })}
                      disabled={activePosts.length >= currentTier.maxPostSlots || !!activeAction || isSubFull}
                    >
                      <Zap className={`mr-1 h-3 w-3 ${isViral ? 'fill-white' : ''}`} />
                      {isSubFull ? 'Sub Full' : isViral ? 'POST (VIRAL BOOST!)' : 'Create Post'}
                      <span className="ml-auto text-[8px] opacity-70">-{isViral ? ACTION_ENERGY_COSTS.post.viral : ACTION_ENERGY_COSTS.post.random}⚡</span>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {sub.unlocked && health < 80 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] h-8 border-orange-500/50 hover:bg-orange-500/10"
                        onClick={() => startAction('modqueue', { subredditId: sub.id })}
                        disabled={!!activeAction}
                      >
                        <ShieldAlert className="mr-1 h-3 w-3 text-orange-500" />
                        Mod Queue
                        <span className="ml-auto text-[8px] opacity-70">-{ACTION_ENERGY_COSTS.modqueue}⚡</span>
                      </Button>
                    )}
                    <Button
                      className={`flex-[2] transition-all h-8 text-[10px] ${canAfford && !sub.unlocked ? 'animate-bounce' : ''}`}
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || !!activeAction}
                      onClick={() => startAction('levelup', { subredditId: sub.id })}
                      data-testid={`subreddit-upgrade-btn-${sub.id}`}
                    >
                      <ArrowUpCircle className="mr-1 h-3 w-3" />
                      <div className="flex flex-col items-start leading-none">
                        <span>{sub.level === 0 ? 'Unlock' : 'Level Up'} — {formatKarma(cost)}</span>
                        <span className="text-[8px] opacity-70 mt-0.5">Cost: {ACTION_ENERGY_COSTS.levelup}⚡</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
