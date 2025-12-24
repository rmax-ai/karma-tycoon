'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, CelebrationType } from '@/store/useGameStore';
import { Sparkles, ArrowUpCircle, LockOpen, MousePointer2, ShieldCheck, Zap } from 'lucide-react';

const CelebrationIcon = ({ type }: { type: CelebrationType }) => {
  switch (type) {
    case 'content':
      return <MousePointer2 className="w-12 h-12 text-orange-500" />;
    case 'upgrade':
      return <Sparkles className="w-16 h-16 text-yellow-400" />;
    case 'unlock':
      return <LockOpen className="w-20 h-20 text-green-500" />;
    case 'levelup':
      return <ArrowUpCircle className="w-16 h-16 text-blue-500" />;
    case 'modqueue':
      return <ShieldCheck className="w-16 h-16 text-emerald-500" />;
    case 'energy-error':
      return <Zap className="w-16 h-16 text-rose-500 fill-rose-500" />;
    default:
      return null;
  }
};

const CelebrationText = ({ type, message }: { type: CelebrationType, message?: string }) => {
  if (message) return message;
  switch (type) {
    case 'content':
      return "Post Created!";
    case 'upgrade':
      return "Upgrade Purchased!";
    case 'unlock':
      return "Subreddit Unlocked!";
    case 'levelup':
      return "Level Up!";
    case 'modqueue':
      return "Queue Cleared!";
    case 'energy-error':
      return "Not Enough Energy!";
    default:
      return "";
  }
};

export const CelebrationOverlay = () => {
  const celebrations = useGameStore((state) => state.celebrations);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {celebrations.map((celebration) => (
          <motion.div
            key={celebration.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1.2, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ 
                rotate: celebration.type === 'upgrade' ? [0, 15, -15, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <CelebrationIcon type={celebration.type} />
            </motion.div>
            <motion.span 
              className={`text-2xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-tighter ${celebration.type === 'energy-error' ? 'text-rose-500' : 'text-white'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {CelebrationText({ type: celebration.type, message: celebration.message })}
            </motion.span>
            
            {/* Particle effects for unlock and modqueue */}
            {(celebration.type === 'unlock' || celebration.type === 'modqueue') && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${celebration.type === 'unlock' ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                    initial={{ x: 0, y: 0 }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 300, 
                      y: (Math.random() - 0.5) * 300,
                      opacity: 0,
                      scale: 0
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
