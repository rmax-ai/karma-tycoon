'use client';

import React from 'react';
import { useGameStore, Subreddit, TIER_THRESHOLDS } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowUpCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubredditList = () => {
  const subreddits = useGameStore((state) => state.subreddits);
  const totalKarma = useGameStore((state) => state.totalKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const upgradeSubreddit = useGameStore((state) => state.upgradeSubreddit);
  const activeEvents = useGameStore((state) => state.activeEvents);

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  const calculateCost = (subreddit: Subreddit) => {
    return Math.floor(subreddit.baseCost * Math.pow(1.15, subreddit.level));
  };

  // Filter subreddits by tier
  const visibleSubreddits = subreddits.filter(sub => sub.tier <= currentTier.tier);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
      {visibleSubreddits.map((sub) => {
        const cost = calculateCost(sub);
        const canAfford = totalKarma >= cost;
        
        const subEventMultiplier = activeEvents
          .filter(e => e.subredditId === sub.id)
          .reduce((acc, e) => acc * e.multiplier, 1);
        
        const kps = sub.karmaPerSecond * sub.level * sub.multiplier * subEventMultiplier;
        const isViral = subEventMultiplier > 1;

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
                
                <Button 
                  className={`w-full transition-all ${canAfford && !sub.unlocked ? 'animate-bounce' : ''}`}
                  variant={canAfford ? "default" : "outline"}
                  disabled={!canAfford}
                  onClick={() => upgradeSubreddit(sub.id)}
                  data-testid={`subreddit-upgrade-btn-${sub.id}`}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  {sub.level === 0 ? 'Unlock' : 'Level Up'} — {cost.toLocaleString()} Karma
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
