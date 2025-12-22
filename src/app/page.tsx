'use client';

import { Dashboard } from '@/components/Dashboard';
import { SubredditList } from '@/components/SubredditList';
import { UpgradesList } from '@/components/UpgradesList';
import { useGameLoop } from '@/hooks/useGameLoop';
import { ViralEventPopup } from '@/components/ViralEventPopup';
import { MascotAnimations } from '@/components/MascotAnimations';

export default function Home() {
  // Initialize the game loop
  useGameLoop();

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-orange-600">
          Karma Tycoon
        </h1>
        <p className="text-muted-foreground mt-2">
          Grow your network, dominate the front page.
        </p>
      </header>

      <div className="space-y-8">
        <Dashboard />
        
        <section>
          <h2 className="text-2xl font-bold mb-4 px-1">Global Upgrades</h2>
          <UpgradesList />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 px-1">Subreddits</h2>
          <SubredditList />
        </section>
      </div>
      <ViralEventPopup />
      <MascotAnimations />
    </main>
  );
}
