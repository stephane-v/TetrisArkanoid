import { useState, useEffect, useCallback, useRef } from 'react';
import { CANVAS_CONFIG } from '../game/utils/constants';

interface InputState {
  mouseX: number | null;
  leftPressed: boolean;
  rightPressed: boolean;
  spacePressed: boolean;
  escapePressed: boolean;
}

interface UseInputOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSpace?: () => void;
  onEscape?: () => void;
}

export function useInput({ canvasRef, onSpace, onEscape }: UseInputOptions): InputState {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const keysRef = useRef({
    left: false,
    right: false,
    space: false,
    escape: false,
  });
  const [, forceUpdate] = useState({});

  // Handle mouse/touch movement
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_CONFIG.width / rect.width;

      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0]?.clientX ?? 0;
      } else {
        clientX = e.clientX;
      }

      const x = (clientX - rect.left) * scaleX;
      setMouseX(x);
    },
    [canvasRef]
  );

  const handlePointerLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = true;
          forceUpdate({});
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = true;
          forceUpdate({});
          break;
        case 'Space':
          e.preventDefault();
          if (!keysRef.current.space) {
            keysRef.current.space = true;
            onSpace?.();
            forceUpdate({});
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (!keysRef.current.escape) {
            keysRef.current.escape = true;
            onEscape?.();
            forceUpdate({});
          }
          break;
      }
    },
    [onSpace, onEscape]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keysRef.current.left = false;
        forceUpdate({});
        break;
      case 'ArrowRight':
      case 'KeyD':
        keysRef.current.right = false;
        forceUpdate({});
        break;
      case 'Space':
        keysRef.current.space = false;
        forceUpdate({});
        break;
      case 'Escape':
        keysRef.current.escape = false;
        forceUpdate({});
        break;
    }
  }, []);

  // Handle touch for ball launch
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      handlePointerMove(e);
      onSpace?.();
    },
    [handlePointerMove, onSpace]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseleave', handlePointerLeave);

    // Touch events
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseleave', handlePointerLeave);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    canvasRef,
    handlePointerMove,
    handlePointerLeave,
    handleTouchStart,
    handleKeyDown,
    handleKeyUp,
  ]);

  return {
    mouseX,
    leftPressed: keysRef.current.left,
    rightPressed: keysRef.current.right,
    spacePressed: keysRef.current.space,
    escapePressed: keysRef.current.escape,
  };
}
