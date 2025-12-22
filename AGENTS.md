# Project Overview
Karma Tycoon is an incremental (idle) game built with Next.js where players grow a network of subreddits to earn "Karma". The goal is to reach the front page of the internet and dominate the karma leaderboards.

# Tech Stack
- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (with persist middleware)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev)

# Core Concepts & Data Structures
- **Karma**: The primary currency.
- **Subreddits**: The main income source. Each has `subscribers`, `karmaPerSecond`, `level`, and `baseCost`.
- **Game Loop**: Managed via a `useGameLoop` hook, updating at 60fps using `requestAnimationFrame`.
- **State**: Persisted in LocalStorage via Zustand.

# Conventions
- Use functional components and Tailwind CSS for styling.
- Follow shadcn/ui patterns for reusable components.
- All game logic should be centralized in the Zustand store or dedicated hooks.
- Cost scaling formula: $Cost = BaseCost \times 1.15^{Level}$.
- Use `Lucide React` for all iconography.
- Implement responsive design for mobile "toilet gaming" experience.

# Development Commands
- Enable Node 24: `nvm use 24`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
