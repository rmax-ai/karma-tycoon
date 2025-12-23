'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore, TIER_THRESHOLDS } from '@/store/useGameStore';
import { calculateKpsBreakdown } from '@/lib/game-logic';
import { formatKarma } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, MousePointer2, Info, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TierInfoModal } from './TierInfoModal';
import { KpsBreakdown } from './KpsBreakdown';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number | string;
}

export const Dashboard = () => {
  const totalKarma = useGameStore((state) => state.totalKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const startCrafting = useGameStore((state) => state.startCrafting);
  const crafting = useGameStore((state) => state.crafting);
  const subreddits = useGameStore((state) => state.subreddits);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const activePosts = useGameStore((state) => state.activePosts);
  const upgrades = useGameStore((state) => state.upgrades);

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Tier Logic
  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  const nextTier = TIER_THRESHOLDS.find(t => t.tier === currentTier.tier + 1);

  // Calculate KPS using centralized logic
  const now = Date.now();
  const breakdown = useMemo(() => calculateKpsBreakdown(
    subreddits,
    activePosts,
    upgrades,
    activeEvents,
    currentTier,
    now
  ), [subreddits, activePosts, upgrades, activeEvents, currentTier, now]);

  const { totalKps, postKps, passiveUpgradeMultiplier, globalMultiplier } = breakdown;

  const topSubreddits = useMemo(() => [...breakdown.subreddits]
    .sort((a, b) => b.finalKps - a.finalKps)
    .slice(0, 5), [breakdown.subreddits]);

  const tierProgress = nextTier 
    ? ((lifetimeKarma - currentTier.minKarma) / (currentTier.maxKarma - currentTier.minKarma)) * 100
    : 100;

  const handleCreateContent = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (activePosts.length >= currentTier.maxPostSlots || crafting) return;
    
    startCrafting(1);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newText: FloatingText = {
      id: Date.now(),
      x,
      y,
      value: 'Crafting Started...',
    };

    setFloatingTexts((prev) => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1000);
  };

  const craftingProgress = crafting 
    ? ((crafting.duration - crafting.remainingTime) / crafting.duration) * 100 
    : 0;

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

            <div className="flex flex-col items-center space-y-1 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-foreground text-xl">{formatKarma(totalKps)}</span>
                <span>Karma / second</span>
                <KpsBreakdown />
              </div>
              <div className="text-[10px] flex gap-4">
                <span>Passive: {formatKarma(breakdown.subreddits.reduce((acc, s) => acc + s.finalKps, 0) * passiveUpgradeMultiplier * globalMultiplier)}</span>
                <span>Active Posts: {formatKarma(postKps * passiveUpgradeMultiplier * globalMultiplier)}</span>
              </div>
            </div>

            <div className="relative w-full max-w-xs space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Post Slots</span>
                  <span>{activePosts.length} / {currentTier.maxPostSlots}</span>
                </div>
                <Progress value={(activePosts.length / currentTier.maxPostSlots) * 100} className="h-1" />
              </div>

              <Button
                size="lg"
                className="w-full h-16 text-xl font-bold bg-orange-500 hover:bg-orange-600 transition-all active:scale-95 relative overflow-hidden"
                onClick={handleCreateContent}
                disabled={activePosts.length >= currentTier.maxPostSlots || !!crafting}
                data-testid="create-content-btn"
              >
                <div 
                  className="absolute bottom-0 left-0 h-full bg-white/20 transition-all duration-100 ease-linear" 
                  style={{ width: `${craftingProgress}%` }} 
                />
                <MousePointer2 className="mr-2 h-6 w-6" />
                {activePosts.length >= currentTier.maxPostSlots 
                  ? 'Slots Full' 
                  : crafting 
                    ? 'Crafting...' 
                    : 'Create Content'}
              </Button>
              
              <AnimatePresence>
                {floatingTexts.map((text) => (
                  <motion.span
                    key={text.id}
                    initial={{ opacity: 1, y: text.y, x: text.x }}
                    animate={{ opacity: 0, y: text.y - 100 }}
                    exit={{ opacity: 0 }}
                    className={`absolute pointer-events-none font-bold z-10 whitespace-nowrap ${typeof text.value === 'string' ? 'text-2xl text-orange-500' : 'text-xl text-orange-600'}`}
                    style={{ left: 0, top: 0 }}
                  >
                    {text.value}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full lg:col-span-1 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Active Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {activePosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No active posts. Start creating content!</p>
                ) : (
                  activePosts.map((post) => {
                    const sub = subreddits.find(s => s.id === post.subredditId);
                    const t = (now - post.createdAt) / 1000;
                    const progress = (t / post.duration) * 100;
                    const ratio = t / post.peakTime;
                    const currentKps = post.peakKps * Math.pow(ratio, post.k) * Math.exp(post.k * (1 - ratio));
                    
                    return (
                      <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold">{sub?.name || 'Unknown Sub'}</span>
                          <span className="text-[10px] font-mono text-orange-600 font-bold">
                            +{formatKarma(currentKps)} KPS
                          </span>
                        </div>
                        <Progress value={progress} className="h-1" />
                        <div className="flex justify-between text-[8px] text-muted-foreground uppercase">
                          <span>{t < post.peakTime ? 'Rising' : 'Fading'}</span>
                          <span>{Math.max(0, post.duration - t).toFixed(0)}s left</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              Top Subreddits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSubreddits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No subreddits owned yet.</p>
              ) : (
                topSubreddits.map((sub, index) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{sub.name}</span>
                        <span className="text-[10px] text-muted-foreground">Level {sub.level}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-orange-600">
                        {formatKarma(sub.finalKps * passiveUpgradeMultiplier * globalMultiplier)} KPS
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {(((sub.finalKps * passiveUpgradeMultiplier * globalMultiplier) / totalKps) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TierInfoModal
        isOpen={isTierModalOpen} 
        onClose={() => setIsTierModalOpen(false)} 
        currentTier={currentTier.tier}
      />
    </div>
  );
};
