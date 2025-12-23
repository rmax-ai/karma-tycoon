'use client';

import { Dashboard } from '@/components/Dashboard';
import { SubredditList } from '@/components/SubredditList';
import { UpgradesList } from '@/components/UpgradesList';
import { useGameLoop } from '@/hooks/useGameLoop';
import { ViralEventPopup } from '@/components/ViralEventPopup';
import { MascotAnimations } from '@/components/MascotAnimations';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { GameOverModal } from '@/components/GameOverModal';
import { ActionOverlay } from '@/components/ActionOverlay';

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
        
        <CollapsibleSection title="Global Upgrades">
          <UpgradesList />
        </CollapsibleSection>

        <CollapsibleSection title="Subreddits">
          <SubredditList />
        </CollapsibleSection>
      </div>
      <ViralEventPopup />
      <MascotAnimations />
      <CelebrationOverlay />
      <GameOverModal />
      <ActionOverlay />
    </main>
  );
}
