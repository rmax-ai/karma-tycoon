import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

export const useGameLoop = () => {
  const tick = useGameStore((state) => state.tick);
  const lastTickRef = useRef<number>(Date.now());
  const requestRef = useRef<number>(0);

  const animate = (time: number) => {
    const now = Date.now();
    const delta = (now - lastTickRef.current) / 1000; // delta in seconds

    if (delta >= 0.1) { // Tick at most every 100ms to avoid excessive updates, but smooth enough
      tick(delta);
      lastTickRef.current = now;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [tick]);
};
