import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useStageCelebration() {
  const celebrate = useCallback(async () => {
    // Get the center of the screen
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from center
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  const celebrateStageCompletion = useCallback((stageName: string) => {
    // Play celebration animation
    celebrate();
  }, [celebrate]);

  return { celebrateStageCompletion };
}
