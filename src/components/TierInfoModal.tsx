'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Zap, Globe, Rocket } from 'lucide-react';
import { TIER_THRESHOLDS } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';

interface TierInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: number;
}

export const TierInfoModal = ({ isOpen, onClose, currentTier }: TierInfoModalProps) => {
  const getTierIcon = (tier: number) => {
    switch (tier) {
      case 1: return <Star className="w-5 h-5 text-yellow-500" />;
      case 2: return <Trophy className="w-5 h-5 text-blue-500" />;
      case 3: return <Zap className="w-5 h-5 text-orange-500" />;
      case 4: return <Globe className="w-5 h-5 text-green-500" />;
      case 5: return <Rocket className="w-5 h-5 text-purple-500" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b flex justify-between items-center bg-muted/30">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-orange-500" />
                Karma Tiers
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {TIER_THRESHOLDS.map((tier) => (
                <div 
                  key={tier.tier}
                  className={`p-4 rounded-lg border transition-all ${
                    currentTier === tier.tier 
                      ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500/20' 
                      : currentTier > tier.tier 
                        ? 'bg-muted/50 opacity-80' 
                        : 'bg-card opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      {getTierIcon(tier.tier)}
                      <span className="font-bold text-lg">Tier {tier.tier}: {tier.name}</span>
                    </div>
                    {currentTier === tier.tier && (
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Current</span>
                    )}
                    {currentTier > tier.tier && (
                      <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase">Unlocked</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.minKarma.toLocaleString()} - {tier.maxKarma.toLocaleString()} Lifetime Karma
                  </p>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-muted/30 border-t">
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={onClose}>
                Got it!
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
