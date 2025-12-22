'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Frown, RefreshCw, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const GameOverModal = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const resetGame = useGameStore((state) => state.resetGame);
  const continueGame = useGameStore((state) => state.continueGame);

  return (
    <AnimatePresence>
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <Card className="border-rose-500 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-rose-100 dark:bg-rose-900 p-4 rounded-full">
                    <Frown className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                  Your Karma has Stagnated!
                </CardTitle>
                <CardDescription className="text-rose-600 dark:text-rose-400">
                  Your communities have gone silent. Without active content or passive growth, your influence is fading.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can choose to fight for your relevance or start fresh with a new strategy.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="w-full border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  onClick={resetGame}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Game
                </Button>
                <Button 
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={continueGame}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continue (60s Grace)
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
