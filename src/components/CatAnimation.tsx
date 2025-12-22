'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Cat } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

export const CatAnimation = () => {
  const activeEvents = useGameStore((state) => state.activeEvents);
  const [lastEventCount, setLastEventCount] = useState(0);
  const controls = useAnimation();

  // Handle jumping when a viral event occurs
  useEffect(() => {
    if (activeEvents.length > lastEventCount) {
      // Trigger jump
      controls.start({
        y: [0, -100, 0],
        transition: { duration: 0.5, ease: "easeOut" }
      });
    }
    setLastEventCount(activeEvents.length);
  }, [activeEvents.length, controls, lastEventCount]);

  return (
    <div className="fixed bottom-0 left-0 w-full h-24 pointer-events-none z-40 overflow-hidden">
      <motion.div
        className="absolute bottom-4"
        initial={{ x: "-10%" }}
        animate={{
          x: ["-10%", "110%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          animate={controls}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Cat size={48} className="text-orange-500 fill-orange-200 dark:fill-orange-900" />
          </motion.div>
          <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-white/80 dark:bg-black/80 px-1 rounded mt-1">
            Karma Cat
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
