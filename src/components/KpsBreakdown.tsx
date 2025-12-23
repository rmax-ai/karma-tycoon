'use client';

import React from 'react';
import { useGameStore, TIER_THRESHOLDS } from '@/store/useGameStore';
import { calculateKpsBreakdown } from '@/lib/game-logic';
import { formatKarma } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Zap, Heart, BatteryLow, Users, Flame, CloudSun, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export const KpsBreakdown = () => {
  const breakdown = useGameStore((state) => state.currentKpsBreakdown);
  const activePosts = useGameStore((state) => state.activePosts);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1 hover:bg-muted rounded-full transition-colors">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            KPS Breakdown
          </h3>
          <p className="text-[10px] text-muted-foreground">Live calculation parameters</p>
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-6">
            {/* Global Multipliers */}
            <section className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Global Multipliers</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-muted/50 border">
                  <p className="text-[10px] text-muted-foreground">Upgrades</p>
                  <p className="text-sm font-bold text-orange-600">x{breakdown.passiveUpgradeMultiplier.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded bg-muted/50 border">
                  <p className="text-[10px] text-muted-foreground">Global Events</p>
                  <p className="text-sm font-bold text-orange-600">x{breakdown.globalMultiplier.toFixed(2)}</p>
                </div>
              </div>
            </section>

            {/* Subreddits */}
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subreddit Efficiency</h4>
              {breakdown.subreddits.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active subreddits</p>
              ) : (
                breakdown.subreddits.map((sub) => (
                  <div key={sub.id} className="space-y-2 p-2 rounded-lg border bg-card">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{sub.name}</span>
                      <span className="text-xs font-mono font-bold text-orange-600">
                        {formatKarma(sub.finalKps)} KPS
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <FactorIcon 
                        icon={<Zap className="w-3 h-3" />} 
                        label="Activity" 
                        value={`x${sub.activityScore.toFixed(1)}`}
                        status={sub.activityScore === 0 ? 'bad' : sub.activityScore < 1 ? 'warn' : 'good'}
                      />
                      <FactorIcon 
                        icon={<CloudSun className="w-3 h-3" />} 
                        label="Season" 
                        value={`x${sub.activityMultiplier.toFixed(1)}`}
                        status={sub.activityMultiplier < 1 ? 'warn' : 'good'}
                      />
                      <FactorIcon 
                        icon={<BatteryLow className="w-3 h-3" />} 
                        label="Fatigue" 
                        value={`-${((1 - sub.fatigueMultiplier) * 100).toFixed(0)}%`}
                        status={sub.fatigueMultiplier < 0.8 ? 'bad' : sub.fatigueMultiplier < 1 ? 'warn' : 'good'}
                      />
                      <FactorIcon 
                        icon={<Heart className="w-3 h-3" />} 
                        label="Health" 
                        value={`${(sub.healthMultiplier * 100).toFixed(0)}%`}
                        status={sub.healthMultiplier < 0.7 ? 'bad' : sub.healthMultiplier < 1 ? 'warn' : 'good'}
                      />
                      <FactorIcon 
                        icon={<Users className="w-3 h-3" />} 
                        label="Synergy" 
                        value={`+${((sub.synergyMultiplier - 1) * 100).toFixed(0)}%`}
                        status={sub.synergyMultiplier > 1 ? 'good' : 'neutral'}
                      />
                      <FactorIcon 
                        icon={<Flame className="w-3 h-3" />} 
                        label="Viral" 
                        value={`x${sub.localMultiplier.toFixed(1)}`}
                        status={sub.localMultiplier > 1 ? 'good' : sub.localMultiplier < 1 ? 'bad' : 'neutral'}
                      />
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Active Posts */}
            <section className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Content</h4>
              <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Posts Contribution</span>
                  <span className="text-xs font-bold text-orange-600">
                    {formatKarma(breakdown.postKps)} KPS
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  Base KPS from {activePosts.length} active posts before global multipliers.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t bg-muted/30 flex justify-between items-center">
          <span className="text-xs font-bold">Total KPS</span>
          <span className="text-sm font-extrabold text-orange-600">
            {formatKarma(breakdown.totalKps)}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface FactorIconProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad' | 'neutral';
}

const FactorIcon = ({ icon, label, value, status }: FactorIconProps) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    warn: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    bad: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    neutral: 'text-muted-foreground bg-muted/50',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-1 rounded text-[8px] font-medium", statusColors[status])}>
      <div className="mb-0.5">{icon}</div>
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
};
