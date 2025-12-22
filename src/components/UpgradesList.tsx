'use client';

import React from 'react';
import { useGameStore, GlobalUpgrade } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, MousePointer2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const UpgradesList = () => {
  const { upgrades, totalKarma, purchaseUpgrade } = useGameStore();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {upgrades.map((upgrade: GlobalUpgrade) => (
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
                  {upgrade.cost.toLocaleString()} Karma
                </span>
                <Button
                  size="sm"
                  disabled={upgrade.purchased || totalKarma < upgrade.cost}
                  onClick={() => purchaseUpgrade(upgrade.id)}
                  className={!upgrade.purchased && totalKarma >= upgrade.cost ? 'bg-orange-500 hover:bg-orange-600' : ''}
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
