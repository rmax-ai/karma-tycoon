'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { generateUsername } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Rocket, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const WelcomeModal = () => {
  const hasSeenWelcome = useGameStore((state) => state.hasSeenWelcome);
  const completeWelcome = useGameStore((state) => state.completeWelcome);
  const startTour = useGameStore((state) => state.startTour);
  const hasCompletedTour = useGameStore((state) => state.hasCompletedTour);
  const [randomName, setRandomName] = useState('');

  useEffect(() => {
    if (!hasSeenWelcome) {
      setRandomName(generateUsername());
    }
  }, [hasSeenWelcome]);

  const handleJoin = () => {
    completeWelcome(randomName);
    if (!hasCompletedTour) {
      startTour();
    }
  };

  const handleRegenerate = () => {
    setRandomName(generateUsername());
  };

  return (
    <AnimatePresence>
      {!hasSeenWelcome && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            className="w-full max-w-lg"
          >
            <Card className="border-orange-500 shadow-2xl overflow-hidden bg-card/95">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400" />
              
              <CardHeader className="text-center pt-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-orange-100 dark:bg-orange-950 p-5 rounded-full ring-4 ring-orange-500/20">
                    <Rocket className="h-12 w-12 text-orange-600 dark:text-orange-400 animate-bounce" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                  Welcome to Karma Tycoon!
                </CardTitle>
                <CardDescription className="text-lg mt-2 font-medium">
                  The front page of the internet is waiting for you.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 px-8 py-4">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground italic">
                    "Every legend starts with a random username and a dream of internet points."
                  </p>
                  
                  <div className="bg-muted p-6 rounded-xl border-2 border-dashed border-muted-foreground/30 relative group">
                    <p className="text-sm uppercase tracking-widest text-muted-foreground font-bold mb-2">Your Assigned Identity</p>
                    <div className="flex items-center justify-center gap-3">
                      <User className="h-5 w-5 text-orange-500" />
                      <span className="text-2xl font-mono font-bold tracking-tight text-foreground">u/{randomName}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 text-xs hover:text-orange-500"
                      onClick={handleRegenerate}
                    >
                      Wait, I want a different one!
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-bold">Grow your network:</span> Purchase and upgrade subreddits to increase your passive Karma flow.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 p-1 rounded">
                      <Rocket className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold">Go Viral:</span> Create content to trigger viral loops and dominate the trending tab.
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 p-8 bg-muted/30">
                <Button 
                  className="w-full h-14 text-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                  onClick={handleJoin}
                >
                  Join the Front Page
                </Button>
                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                  By clicking, you agree to farm fake internet points forever.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
