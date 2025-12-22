'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Cat, Dog, Rocket, Ghost, Trophy, LucideIcon } from 'lucide-react';
import { useGameStore, TIER_THRESHOLDS } from '@/store/useGameStore';

interface MascotConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  tier: number;
  color: string;
  fillColor: string;
  darkFillColor: string;
}

const MASCOTS: MascotConfig[] = [
  {
    id: 'cat',
    name: 'Karma Cat',
    icon: Cat,
    tier: 1,
    color: 'text-orange-500',
    fillColor: 'fill-orange-200',
    darkFillColor: 'dark:fill-orange-900',
  },
  {
    id: 'dog',
    name: 'Doge',
    icon: Dog,
    tier: 2,
    color: 'text-yellow-600',
    fillColor: 'fill-yellow-200',
    darkFillColor: 'dark:fill-yellow-900',
  },
  {
    id: 'rocket',
    name: 'To the Moon',
    icon: Rocket,
    tier: 3,
    color: 'text-blue-500',
    fillColor: 'fill-blue-200',
    darkFillColor: 'dark:fill-blue-900',
  },
  {
    id: 'alien',
    name: 'Snoo',
    icon: Ghost,
    tier: 4,
    color: 'text-red-500',
    fillColor: 'fill-red-200',
    darkFillColor: 'dark:fill-red-900',
  },
  {
    id: 'king',
    name: 'Front Page King',
    icon: Trophy,
    tier: 5,
    color: 'text-purple-500',
    fillColor: 'fill-purple-200',
    darkFillColor: 'dark:fill-purple-900',
  },
];

const Mascot = ({ config, isJumping }: { config: MascotConfig; isJumping: boolean }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  const getRandomPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    // Keep mascots within viewport, with some padding
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    return { x, y };
  }, []);

  useEffect(() => {
    setPosition(getRandomPosition());
    
    const interval = setInterval(() => {
      setPosition(getRandomPosition());
    }, 3000 + Math.random() * 4000); // Move every 3-7 seconds

    return () => clearInterval(interval);
  }, [getRandomPosition]);

  useEffect(() => {
    if (isJumping) {
      controls.start({
        scale: [1, 1.5, 1],
        rotate: [0, 360, 0],
        transition: { duration: 0.5, ease: "easeInOut" }
      });
    }
  }, [isJumping, controls]);

  const Icon = config.icon;

  return (
    <motion.div
      className="fixed pointer-events-auto z-[100] cursor-help"
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
      }}
      style={{ left: 0, top: 0 }}
    >
      <motion.div
        animate={controls}
        className="flex flex-col items-center group"
      >
        <motion.div
          animate={{
            rotate: [0, -5, 5, 0],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <Icon size={64} className={`${config.color} ${config.fillColor} ${config.darkFillColor} drop-shadow-lg`} />
          {/* Annoying "blocking" effect: a larger invisible area to catch clicks */}
          <div className="absolute inset-0 -m-8 rounded-full" />
        </motion.div>
        <div className={`text-[10px] font-bold ${config.color} bg-white/90 dark:bg-black/90 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity`}>
          {config.name}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const MascotAnimations = () => {
  const lifetimeKarma = useGameStore((state) => state.lifetimeKarma);
  const activeEvents = useGameStore((state) => state.activeEvents);
  const [lastEventCount, setLastEventCount] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Determine current tier
  const currentTier = TIER_THRESHOLDS.reduce((acc, threshold) => {
    if (lifetimeKarma >= threshold.minKarma) {
      return threshold.tier;
    }
    return acc;
  }, 1);

  // Handle jumping when a viral event occurs
  useEffect(() => {
    if (activeEvents.length > lastEventCount) {
      setIsJumping(true);
      const timer = setTimeout(() => setIsJumping(false), 500);
      return () => clearTimeout(timer);
    }
    setLastEventCount(activeEvents.length);
  }, [activeEvents.length, lastEventCount]);

  const unlockedMascots = MASCOTS.filter(m => m.tier <= currentTier);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {unlockedMascots.map((mascot) => (
        <Mascot key={mascot.id} config={mascot} isJumping={isJumping} />
      ))}
    </div>
  );
};
