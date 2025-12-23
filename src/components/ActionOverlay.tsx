'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export const ActionOverlay = () => {
  const activeAction = useGameStore((state) => state.activeAction);

  if (!activeAction) return null;

  const progress = ((activeAction.duration - activeAction.remainingTime) / activeAction.duration) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <Card className="w-full max-w-md mx-4 overflow-hidden border-2 border-orange-500 shadow-2xl">
          <CardContent className="p-8 flex flex-col items-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="bg-orange-100 p-4 rounded-full"
            >
              <Hourglass className="w-12 h-12 text-orange-600" />
            </motion.div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{activeAction.label}</h2>
              <p className="text-sm text-muted-foreground">Please wait while the action completes...</p>
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Progress</span>
                <span>{Math.max(0, activeAction.remainingTime).toFixed(1)}s remaining</span>
              </div>
              <Progress value={progress} className="h-3 bg-orange-100" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
