'use client';

import React from 'react';
import { useGameStore, GlobalUpgrade, TIER_THRESHOLDS } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatKarma } from '@/lib/utils';

export const UpgradesList = () => {
  const { upgrades, totalKarma, lifetimeKarma, startAction, activeAction } = useGameStore();

  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

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
      {visibleUpgrades.map((upgrade: GlobalUpgrade) => (
        <motion.div
          key={upgrade.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className={`${upgrade.purchased ? 'opacity-60 bg-muted' : ''} transition-all duration-300`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getIcon(upgrade.type)}
                  {upgrade.name}
                </CardTitle>
                {upgrade.purchased && (
                  <span className="text-xs font-bold text-green-500 uppercase tracking-wider">
                    Purchased
                  </span>
                )}
              </div>
              <CardDescription>{upgrade.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-orange-500">
                  {formatKarma(upgrade.cost)} Karma
                </span>
                <Button
                  size="sm"
                  disabled={upgrade.purchased || totalKarma < upgrade.cost || !!activeAction}
                  onClick={() => startAction('upgrade', { upgradeId: upgrade.id })}
                  className={!upgrade.purchased && totalKarma >= upgrade.cost && !activeAction ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {upgrade.purchased ? 'Owned' : 'Buy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
