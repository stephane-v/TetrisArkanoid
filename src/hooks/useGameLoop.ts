import { useEffect, useRef, useCallback } from 'react';

interface GameLoopOptions {
  onUpdate: (deltaTime: number) => void;
  targetFPS?: number;
  isRunning: boolean;
}

export function useGameLoop({ onUpdate, targetFPS = 60, isRunning }: GameLoopOptions) {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const fixedDeltaTime = 1 / targetFPS;
  const maxDeltaTime = 0.1; // Cap delta time to prevent spiral of death

  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!isRunning) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      let deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Cap delta time
      if (deltaTime > maxDeltaTime) {
        deltaTime = maxDeltaTime;
      }

      accumulatorRef.current += deltaTime;

      // Fixed time step updates
      while (accumulatorRef.current >= fixedDeltaTime) {
        onUpdate(fixedDeltaTime);
        accumulatorRef.current -= fixedDeltaTime;
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    },
    [onUpdate, fixedDeltaTime, isRunning]
  );

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameLoop, isRunning]);
}
