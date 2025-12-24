'use client';

import React from 'react';
import { ACTION_ENERGY_COSTS, useGameStore, GlobalUpgrade, TIER_THRESHOLDS } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatKarma } from '@/lib/utils';

export const UpgradesList = () => {
  const { upgrades, spendableKarma, lifetimeKarma, startAction, activeAction } = useGameStore();

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = (type: GlobalUpgrade['type']) => {
    switch (type) {
      case 'click':
        return <MousePointer2 className="w-4 h-4" />;
      case 'passive':
        return <TrendingUp className="w-4 h-4" />;
      case 'event':
        return <Zap className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  // Filter upgrades by tier
  const visibleUpgrades = upgrades.filter(upgrade => upgrade.tier <= currentTier.tier);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="upgrades">
      {visibleUpgrades.map((upgrade: GlobalUpgrade) => {
        const currentCost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.level));
        
        return (
          <motion.div
            key={upgrade.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={`${upgrade.purchased ? 'border-orange-500/50 bg-orange-500/5' : ''} transition-all duration-300 relative overflow-hidden`}>
              {upgrade.purchased && (
                <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                  <motion.div 
                    className="h-full bg-orange-500"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(upgrade.remainingTime / upgrade.duration) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getIcon(upgrade.type)}
                    {upgrade.name}
                  </CardTitle>
                  {upgrade.purchased && (
                    <span className="text-xs font-mono font-bold text-orange-500">
                      {formatTime(upgrade.remainingTime)}
                    </span>
                  )}
                </div>
                <CardDescription>{upgrade.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-orange-500">
                      {formatKarma(currentCost)} Karma
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Level {upgrade.level}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={upgrade.purchased || spendableKarma < currentCost || !!activeAction}
                    onClick={() => startAction('upgrade', { upgradeId: upgrade.id })}
                    className={!upgrade.purchased && spendableKarma >= currentCost && !activeAction ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <span>{upgrade.purchased ? 'Active' : 'Buy'}</span>
                      {!upgrade.purchased && <span className="text-[8px] opacity-70 mt-0.5">{ACTION_ENERGY_COSTS.upgrade}⚡</span>}
                    </div>
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
