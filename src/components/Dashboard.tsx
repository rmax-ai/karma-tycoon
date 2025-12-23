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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number | string;
}

export const Dashboard = () => {
  const totalKarma = useGameStore((state) => state.totalKarma);
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const lastKarmaUpdate = useGameStore((state) => state.lastKarmaUpdate);
  const startAction = useGameStore((state) => state.startAction);
  const activeAction = useGameStore((state) => state.activeAction);
  const subreddits = useGameStore((state) => state.subreddits);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const activePosts = useGameStore((state) => state.activePosts);
  const upgrades = useGameStore((state) => state.upgrades);
  const breakdown = useGameStore((state) => state.currentKpsBreakdown);

  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  // Tier Logic
  const currentTier = TIER_THRESHOLDS.find(t => lifetimeKarma >= t.minKarma && lifetimeKarma < t.maxKarma) || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
  const nextTier = TIER_THRESHOLDS.find(t => t.tier === currentTier.tier + 1);

  const { totalKps, postKps, passiveUpgradeMultiplier, globalMultiplier } = breakdown;

  const topSubreddits = useMemo(() => [...breakdown.subreddits]
    .map(sub => ({
      ...sub,
      totalSubKps: ((sub.finalKps || 0) + (sub.postKps || 0)) * (passiveUpgradeMultiplier || 1) * (globalMultiplier || 1)
    }))
    .filter(sub => sub.totalSubKps > 0)
    .sort((a, b) => b.totalSubKps - a.totalSubKps)
    .slice(0, 5), [breakdown.subreddits, passiveUpgradeMultiplier, globalMultiplier]);

  const tierProgress = nextTier 
    ? ((lifetimeKarma - currentTier.minKarma) / (currentTier.maxKarma - currentTier.minKarma)) * 100
    : 100;

  const availableSubs = useMemo(() => subreddits.filter(s => s.unlocked).filter(s => {
    const activeInSub = activePosts.filter(p => p.subredditId === s.id).length;
    let slots = 1;
    if (s.level >= 100) slots += 1;
    if (s.level >= 1000) slots += 1;
    return activeInSub < slots;
  }), [subreddits, activePosts]);

  const noSubsAvailable = availableSubs.length === 0 && subreddits.some(s => s.unlocked);

  const handleCreateContent = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (activePosts.length >= currentTier.maxPostSlots || activeAction) return;
    
    startAction('post', { qualityMultiplier: 1 });

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newText: FloatingText = {
      id: Date.now(),
      x,
      y,
      value: 'Crafting Started...',
    };

    setFloatingTexts((prev: FloatingText[]) => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts((prev: FloatingText[]) => prev.filter((t: FloatingText) => t.id !== newText.id));
    }, 1000);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-2" data-tour="dashboard">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Karma Dashboard</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsTierModalOpen(true)}
              data-tour="tier-info"
            >
              <Trophy className="w-4 h-4 text-orange-500" />
              Tier {currentTier.tier}
              <Info className="w-3 h-3 text-muted-foreground" />
            </Button>
            <TrendingUp className="h-6 w-6 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-8">
            {/* 1. Highlighted KPS */}
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Karma / Second</p>
              <div className="flex items-center space-x-3">
                <motion.h2 
                  key={Math.floor(totalKps)}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-extrabold text-orange-600 tabular-nums"
                >
                  {formatKarma(totalKps)}
                </motion.h2>
                <KpsBreakdown />
              </div>
              <div className="text-[10px] flex gap-4 text-muted-foreground">
                <span>Passive: {formatKarma(breakdown.subreddits.reduce((acc, s) => acc + s.finalKps, 0) * passiveUpgradeMultiplier * globalMultiplier)}</span>
                <span>Active Posts: {formatKarma(postKps * passiveUpgradeMultiplier * globalMultiplier)}</span>
              </div>
            </div>

            {/* 2. Create Content Button */}
            <div className="relative w-full max-w-xs space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Post Slots</span>
                  <span>{activePosts.length} / {currentTier.maxPostSlots}</span>
                </div>
                <Progress value={(activePosts.length / currentTier.maxPostSlots) * 100} className="h-1" />
              </div>

              <Popover open={noSubsAvailable && !activeAction && activePosts.length < currentTier.maxPostSlots}>
                <PopoverTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full h-16 text-xl font-bold bg-orange-500 hover:bg-orange-600 transition-all active:scale-95 relative overflow-hidden"
                    onClick={handleCreateContent}
                    disabled={activePosts.length >= currentTier.maxPostSlots || !!activeAction || noSubsAvailable}
                    data-testid="create-content-btn"
                    data-tour="create-content"
                  >
                    <MousePointer2 className="mr-2 h-6 w-6" />
                    {activePosts.length >= currentTier.maxPostSlots
                      ? 'Slots Full'
                      : activeAction
                        ? 'Busy...'
                        : noSubsAvailable
                          ? 'Subs Full'
                          : 'Create Content'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-destructive text-destructive-foreground border-none shadow-xl">
                  <div className="space-y-2">
                    <p className="text-sm font-bold">No Subreddits Available!</p>
                    <p className="text-xs opacity-90">All your subreddits are currently at their post limit. Unlock more subreddits or level them up to 100/1000 to increase their capacity.</p>
                  </div>
                </PopoverContent>
              </Popover>
              
              <AnimatePresence>
                {floatingTexts.map((text: FloatingText) => (
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

            {/* 3. Normal Size Total Karma */}
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Karma</p>
              <motion.h3 
                key={Math.floor(totalKarma)}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-foreground tabular-nums"
                data-testid="total-karma"
              >
                {formatKarma(totalKarma)}
              </motion.h3>
            </div>
            
            {/* 4. Tier Accounting */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                <span>Tier {currentTier.tier}: {currentTier.name}</span>
                {nextTier && <span>Next: {nextTier.name}</span>}
              </div>
              <Progress value={tierProgress} className="h-1.5" />
              <p className="text-[10px] text-center text-muted-foreground">
                {formatKarma(lifetimeKarma)} / {formatKarma(currentTier.maxKarma)} Lifetime Karma
              </p>
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
                    const now = Date.now();
                    const t = (now - post.createdAt) / 1000;
                    const tThrottled = Math.max(0, (lastKarmaUpdate - post.createdAt) / 1000);
                    const progress = (t / post.duration) * 100;
                    const ratio = Math.max(0, tThrottled / post.peakTime);
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
                <p className="text-sm text-muted-foreground text-center py-8">No active subreddits.</p>
              ) : (
                topSubreddits.map((sub: any, index: number) => (
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
                        {formatKarma(sub.totalSubKps)} KPS
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {((sub.totalSubKps / totalKps) * 100).toFixed(1)}% of total
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
