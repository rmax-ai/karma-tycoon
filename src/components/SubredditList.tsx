'use client';

import React from 'react';
import { useGameStore, Subreddit, TIER_THRESHOLDS } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, ArrowUpCircle, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubredditList = () => {
  const subreddits = useGameStore((state) => state.subreddits);
  const totalKarma = useGameStore((state) => state.totalKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const upgradeSubreddit = useGameStore((state) => state.upgradeSubreddit);
  const clearModQueue = useGameStore((state) => state.clearModQueue);
  const activeEvents = useGameStore((state) => state.activeEvents);

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  const calculateCost = (subreddit: Subreddit) => {
    return Math.floor(subreddit.baseCost * Math.pow(1.15, subreddit.level));
  };

  // Filter subreddits by tier
  const visibleSubreddits = subreddits.filter(sub => sub.tier <= currentTier.tier);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleSubreddits.map((sub) => {
        const cost = calculateCost(sub);
        const canAfford = totalKarma >= cost;
        
        const subEventMultiplier = activeEvents
          .filter(e => e.subredditId === sub.id)
          .reduce((acc, e) => acc * e.multiplier, 1);
        
        const now = Date.now();
        const activityMultiplier = 1.0 + 0.5 * Math.sin((2 * Math.PI * (now / 1000)) / sub.activityPeriod + sub.activityPhase);
        const fatigueMultiplier = 1 - (sub.fatigue || 0);
        
        const kps = sub.karmaPerSecond * sub.level * sub.multiplier * subEventMultiplier * activityMultiplier * fatigueMultiplier;
        const isViral = subEventMultiplier > 1;

        const activityLevel = activityMultiplier > 1.3 ? 'High' : activityMultiplier < 0.7 ? 'Low' : 'Normal';
        const fatigueLevel = (sub.fatigue || 0) * 100;
        const health = sub.health || 100;

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
                      {kps.toFixed(1)} KPS
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

                <div className="flex gap-2">
                  {health < 80 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] h-8 border-orange-500/50 hover:bg-orange-500/10"
                      onClick={() => clearModQueue(sub.id)}
                    >
                      <ShieldAlert className="mr-1 h-3 w-3 text-orange-500" />
                      Mod Queue
                    </Button>
                  )}
                  <Button
                    className={`flex-[2] transition-all h-8 text-[10px] ${canAfford && !sub.unlocked ? 'animate-bounce' : ''}`}
                    variant={canAfford ? "default" : "outline"}
                    disabled={!canAfford}
                    onClick={() => upgradeSubreddit(sub.id)}
                    data-testid={`subreddit-upgrade-btn-${sub.id}`}
                  >
                    <ArrowUpCircle className="mr-1 h-3 w-3" />
                    {sub.level === 0 ? 'Unlock' : 'Level Up'} — {cost.toLocaleString()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
