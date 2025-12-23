'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const TOUR_STEPS = [
  {
    target: '[data-tour="dashboard"]',
    title: 'The Dashboard (Karma & KPS)',
    content: 'Welcome to your Dashboard! This is where you track your Total Karma and Karma Per Second (KPS). KPS is your passive income—the higher it is, the faster you grow!',
  },
  {
    target: '[data-tour="create-content"]',
    title: 'Creating Content',
    content: 'Need a boost? Click Create Content to start a post. Posts provide a temporary surge in KPS as they go through their lifecycle. Watch out for your Post Slots limit!',
  },
  {
    target: '[data-tour="viral-events"]',
    title: 'Viral Events',
    content: "Keep an eye out for Viral Events! These random occurrences can massively boost your KPS for a short time. But beware—negative events like 'Mod Abuse' can also happen!",
  },
  {
    target: '[data-tour="subreddits"]',
    title: 'Subreddits',
    content: 'Subreddits are your main source of passive income. Unlock new ones and level them up to increase your base KPS. Keep an eye on Community Health and Algorithm Fatigue!',
  },
  {
    target: '[data-tour="upgrades"]',
    title: 'Global Upgrades',
    content: 'Invest your Karma in Global Upgrades to permanently boost your efficiency. Some upgrades increase click power, while others multiply your passive income or viral event frequency.',
  },
  {
    target: '[data-tour="tier-info"]',
    title: 'Tiers & Progression',
    content: 'Your goal is to reach the Front Page. Accumulate Lifetime Karma to advance through Tiers, unlocking more post slots, better energy recharge rates, and massive multipliers.',
  },
];

export const WelcomeTour = () => {
  const isTourActive = useGameStore((state) => state.isTourActive);
  const currentStepIndex = useGameStore((state) => state.currentTourStep);
  const nextStep = useGameStore((state) => state.nextTourStep);
  const prevStep = useGameStore((state) => state.prevTourStep);
  const completeTour = useGameStore((state) => state.completeTour);
  const skipTour = useGameStore((state) => state.skipTour);

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const currentStep = TOUR_STEPS[currentStepIndex];

  useEffect(() => {
    if (isTourActive && currentStep) {
      const updatePosition = () => {
        const element = document.querySelector(currentStep.target);
        const vWidth = window.innerWidth;
        const vHeight = window.innerHeight;

        if (element) {
          const rect = element.getBoundingClientRect();
          setSpotlightRect(rect);

          const cardWidth = 300;
          const cardHeight = 250; // Estimated max height
          const margin = 20;

          let top = rect.bottom + margin;
          let left = rect.left + rect.width / 2 - cardWidth / 2;

          // Adjust horizontal position
          if (left < margin) left = margin;
          if (left + cardWidth > vWidth - margin) left = vWidth - cardWidth - margin;

          // Adjust vertical position
          if (top + cardHeight > vHeight - margin) {
            // Try showing above the element
            top = rect.top - cardHeight - margin;
          }

          // Final safety check for vertical
          if (top < margin) top = margin;
          if (top + cardHeight > vHeight - margin) {
            // If it still doesn't fit, center it vertically as a fallback
            top = Math.max(margin, (vHeight - cardHeight) / 2);
          }

          setCardPosition({ top, left });
          
          // Scroll into view if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // If element not found (e.g. viral event popup not visible), skip or show in center
          setSpotlightRect(null);
          setCardPosition({ top: vHeight / 2 - 100, left: vWidth / 2 - 150 });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isTourActive, currentStepIndex, currentStep]);

  if (!isTourActive) return null;

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with Spotlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: spotlightRect.left - 10,
                  y: spotlightRect.top - 10,
                  width: spotlightRect.width + 20,
                  height: spotlightRect.height + 20,
                }}
                rx="8"
                ry="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
          onClick={skipTour}
        />
      </svg>

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            top: cardPosition.top,
            left: cardPosition.left
          }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute w-[300px] pointer-events-auto"
          style={{ position: 'fixed' }}
        >
          <Card className="shadow-2xl border-orange-500 border-2">
            <CardHeader className="pb-2 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 h-6 w-6" 
                onClick={skipTour}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg font-bold text-orange-600">
                {currentStep?.title}
              </CardTitle>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm leading-relaxed">
                {currentStep?.content}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="flex gap-2">
                {!isLastStep ? (
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="bg-orange-500 hover:bg-orange-600 gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={completeTour}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Finish
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
