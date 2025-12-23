'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { User, Flame } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UserProfile } from './UserProfile';

export const Header = () => {
  const username = useGameStore((state) => state.username);
  const hasSeenWelcome = useGameStore((state) => state.hasSeenWelcome);

  if (!hasSeenWelcome) return null;

  return (
    <header className="flex items-center justify-between mb-8 pb-4 border-b">
      <div className="flex items-center gap-2">
        <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-600/20">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-orange-600 uppercase italic">
            Karma Tycoon
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
            The Front Page Awaits
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 h-10 px-3 border-orange-200 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all rounded-full"
            >
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <span className="text-sm font-bold truncate max-w-[100px]">
                u/{username}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-orange-500/20 shadow-2xl" align="end">
            <UserProfile />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};
