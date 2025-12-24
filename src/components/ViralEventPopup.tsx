'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore, ViralEvent } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, AlertTriangle, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ViralEventPopup = () => {
  const activeEvents = useGameStore((state) => state.activeEvents);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ViralEvent | null>(null);

  useEffect(() => {
    if (activeEvents.length > 0) {
      const latestEvent = activeEvents[activeEvents.length - 1];
      if (latestEvent.id !== lastEventId) {
        setLastEventId(latestEvent.id);
        setCurrentEvent(latestEvent);
        setShow(true);
        
        // Auto hide after 5 seconds
        const timer = setTimeout(() => {
          setShow(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [activeEvents, lastEventId]);

  if (!currentEvent) return null;

  const isNegative = currentEvent.isNegative;
  const Icon = isNegative ? (currentEvent.name.includes('Drama') ? Flame : AlertTriangle) : Zap;
  const title = isNegative ? 'Crisis!' : 'Viral Opportunity!';
  const subtext = isNegative
    ? currentEvent.description || 'Something went wrong...'
    : 'Post in this subreddit now to claim the boost!';
  
  const formatMultiplier = (value: number) => Number.isInteger(value) ? value.toString() : value.toFixed(1);
  const energyMultiplierValue = currentEvent.energyMultiplier ?? 1;
  const showsEnergyBoost = !isNegative && energyMultiplierValue > 1;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-sm"
          data-tour="viral-events"
        >
          <Card className={cn(
            "shadow-2xl overflow-hidden border-2",
            isNegative 
              ? "border-rose-500 bg-rose-100 dark:bg-rose-900" 
              : "border-orange-500 bg-orange-100 dark:bg-orange-900"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "p-2 rounded-full shadow-inner",
                  isNegative ? "bg-rose-500" : "bg-orange-500"
                )}>
                  <Icon className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    "font-bold text-lg",
                    isNegative ? "text-rose-900 dark:text-rose-100" : "text-orange-900 dark:text-orange-100"
                  )}>{title}</h3>
                  <p className={cn(
                    "text-sm font-medium",
                    isNegative ? "text-rose-800 dark:text-rose-200" : "text-orange-800 dark:text-orange-200"
                  )}>
                    {currentEvent.name}
                  </p>
                  <p className={cn(
                    "text-[11px] mt-1 italic",
                    isNegative ? "text-rose-700 dark:text-rose-300" : "text-orange-700 dark:text-orange-300"
                  )}>
                    {subtext}
                  </p>
                  {showsEnergyBoost && (
                    <p className="text-[11px] font-semibold mt-1 text-orange-700 dark:text-orange-300">
                      Energy recharge ×{formatMultiplier(energyMultiplierValue)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center space-x-2">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded shadow-sm",
                      isNegative 
                        ? "bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100" 
                        : "bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100"
                    )}>
                      {currentEvent.multiplier}x {isNegative ? 'Penalty' : 'Boost'}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold",
                      isNegative ? "text-rose-700 dark:text-rose-300" : "text-orange-700 dark:text-orange-300"
                    )}>
                      {Math.ceil(currentEvent.remainingTime)}s left
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0",
                    isNegative 
                      ? "text-rose-600 hover:text-rose-700 hover:bg-rose-200 dark:hover:bg-rose-800" 
                      : "text-orange-600 hover:text-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800"
                  )}
                  onClick={() => setShow(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <motion.div 
              className={cn(
                "h-1.5",
                isNegative ? "bg-rose-600" : "bg-orange-600"
              )}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
