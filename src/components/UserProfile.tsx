'use client';

import React from 'react';
import { useGameStore, TIER_THRESHOLDS } from '@/store/useGameStore';
import { formatKarma } from '@/lib/utils';
import { Calendar, Trophy, Newspaper, ArrowUpCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UserProfile = () => {
  const username = useGameStore((state) => state.username);
  const gameStartedAt = useGameStore((state) => state.gameStartedAt);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const totalPostsCreated = useGameStore((state) => state.totalPostsCreated);
  const upgrades = useGameStore((state) => state.upgrades);
  const subreddits = useGameStore((state) => state.subreddits);
  const resetGame = useGameStore((state) => state.resetGame);

  const purchasedUpgrades = upgrades.filter(u => u.purchased).length;
  const unlockedSubreddits = subreddits.filter(s => s.unlocked).length;
  
  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  const timePlayed = () => {
    const diff = Date.now() - gameStartedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const joinDate = new Date(gameStartedAt).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="w-80 p-4 space-y-6">
      <div className="flex flex-col items-center text-center space-y-2 border-b pb-4">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center border-2 border-orange-500 mb-2">
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {username?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-foreground">u/{username}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Joined {joinDate}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 p-3 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Tier</span>
          </div>
          <p className="text-sm font-bold">{currentTier.tier}: {currentTier.name}</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
          </div>
          <p className="text-sm font-bold">{timePlayed()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b pb-1">Stats Overview</h4>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpCircle className="w-4 h-4" />
            <span>Lifetime Karma</span>
          </div>
          <span className="font-mono font-bold text-orange-600">{formatKarma(lifetimeKarma)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Newspaper className="w-4 h-4" />
            <span>Posts Created</span>
          </div>
          <span className="font-bold">{totalPostsCreated}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span>Upgrades</span>
          </div>
          <span className="font-bold">{purchasedUpgrades} / {upgrades.length}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpCircle className="w-4 h-4" />
            <span>Subs Owned</span>
          </div>
          <span className="font-bold">{unlockedSubreddits} / {subreddits.length}</span>
        </div>
      </div>

      <div className="pt-2 space-y-4">
        <div className="text-[9px] text-center text-muted-foreground italic">
          "Karma is just a number, but yours is a pretty big one."
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetGame}
          className="w-full text-[10px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 transition-all"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Reset Game
        </Button>
      </div>
    </div>
  );
};
