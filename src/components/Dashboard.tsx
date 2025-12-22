'use client';

import React, { useState } from 'react';
import { useGameStore, TIER_THRESHOLDS } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, MousePointer2, Info, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TierInfoModal } from './TierInfoModal';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export const Dashboard = () => {
  const totalKarma = useGameStore((state) => state.totalKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const addKarma = useGameStore((state) => state.addKarma);
  const subreddits = useGameStore((state) => state.subreddits);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const upgrades = useGameStore((state) => state.upgrades);

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Calculate KPS
  const kps = subreddits.reduce((acc, sub) => {
    if (sub.level > 0) {
      const subEventMultiplier = activeEvents
        .filter(e => e.subredditId === sub.id)
        .reduce((acc, e) => acc * e.multiplier, 1);
      return acc + sub.karmaPerSecond * sub.level * sub.multiplier * subEventMultiplier;
    }
    return acc;
  }, 0);

  const globalMultiplier = activeEvents
    .filter(e => !e.subredditId)
    .reduce((acc, event) => acc * event.multiplier, 1);

  const totalKps = kps * globalMultiplier;

  const clickMultiplier = upgrades
    .filter((u) => u.purchased && u.type === 'click')
    .reduce((acc, u) => acc * u.multiplier, 1);

  // Tier Logic
  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  const nextTier = TIER_THRESHOLDS.find(t => t.tier === currentTier.tier + 1);
  
  const tierProgress = nextTier 
    ? ((lifetimeKarma - currentTier.minKarma) / (currentTier.maxKarma - currentTier.minKarma)) * 100
    : 100;

  const handleCreateContent = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newValue = 1 * clickMultiplier;
    addKarma(1);

    const newText: FloatingText = {
      id: Date.now(),
      x,
      y,
      value: newValue,
    };

    setFloatingTexts((prev) => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1000);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Karma Dashboard</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsTierModalOpen(true)}
            >
              <Trophy className="w-4 h-4 text-orange-500" />
              Tier {currentTier.tier}
              <Info className="w-3 h-3 text-muted-foreground" />
            </Button>
            <TrendingUp className="h-6 w-6 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Karma</p>
              <motion.h2 
                key={Math.floor(totalKarma)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-5xl font-extrabold text-orange-600 tabular-nums"
                data-testid="total-karma"
              >
                {Math.floor(totalKarma).toLocaleString()}
              </motion.h2>
            </div>
            
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-tighter">
                <span>Tier {currentTier.tier}: {currentTier.name}</span>
                {nextTier && <span>Next: {nextTier.name}</span>}
              </div>
              <Progress value={tierProgress} className="h-2" />
              <p className="text-[10px] text-center text-muted-foreground">
                {Math.floor(lifetimeKarma).toLocaleString()} / {currentTier.maxKarma.toLocaleString()} Lifetime Karma
              </p>
            </div>

            <div className="flex items-center space-x-2 text-muted-foreground">
              <span className="font-semibold text-foreground">{totalKps.toFixed(1)}</span>
              <span>Karma / second</span>
            </div>

            <div className="relative w-full max-w-xs">
              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-bold bg-orange-500 hover:bg-orange-600 transition-all active:scale-95 relative overflow-hidden"
                onClick={handleCreateContent}
                data-testid="create-content-btn"
              >
                <MousePointer2 className="mr-2 h-6 w-6" />
                Create Content
              </Button>
              
              <AnimatePresence>
                {floatingTexts.map((text) => (
                  <motion.span
                    key={text.id}
                    initial={{ opacity: 1, y: text.y, x: text.x }}
                    animate={{ opacity: 0, y: text.y - 100 }}
                    exit={{ opacity: 0 }}
                    className="absolute pointer-events-none text-orange-600 font-bold text-xl z-10"
                    style={{ left: 0, top: 0 }}
                  >
                    +{text.value}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      <TierInfoModal 
        isOpen={isTierModalOpen} 
        onClose={() => setIsTierModalOpen(false)} 
        currentTier={currentTier.tier}
      />
    </div>
  );
};
