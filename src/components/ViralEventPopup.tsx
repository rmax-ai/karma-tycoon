'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore, ViralEvent } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  return (
    <AnimatePresence>
      {show && currentEvent && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-sm"
        >
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950 shadow-lg overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 p-2 rounded-full">
                  <Zap className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-800 dark:text-orange-200">Viral Event!</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {currentEvent.name}
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs font-bold bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
                      {currentEvent.multiplier}x Boost
                    </span>
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {Math.ceil(currentEvent.remainingTime)}s left
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
                  onClick={() => setShow(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <motion.div 
              className="h-1 bg-orange-500"
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
