import { useState, useEffect, useCallback, useRef } from 'react';
import { CANVAS_CONFIG } from '../game/utils/constants';
import type { TetrisInput } from '../game/systems/HumanTetris';

interface InputState {
  mouseX: number | null;
  leftPressed: boolean;
  rightPressed: boolean;
  spacePressed: boolean;
  escapePressed: boolean;
  // Tetris controls (arrow keys or WASD depending on mode)
  tetrisInput: TetrisInput;
}

interface UseInputOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSpace?: () => void;
  onEscape?: () => void;
  onPause?: () => void;
  // For 2-player mode: separate key sets
  useSeparateControls?: boolean;
}

export function useInput({ canvasRef, onSpace, onEscape, onPause, useSeparateControls = false }: UseInputOptions): InputState {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const keysRef = useRef({
    // Arkanoid controls (arrow keys + mouse)
    left: false,
    right: false,
    space: false,
    escape: false,
    pause: false,
    // Tetris controls (WASD for player 1, or arrow keys for single player tetris)
    tetrisLeft: false,
    tetrisRight: false,
    tetrisRotateLeft: false,
    tetrisRotateRight: false,
    tetrisSoftDrop: false,
    tetrisHardDrop: false,
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
      // In 2-player mode:
      // - WASD/Q/E controls Tetris (Player 1)
      // - Arrow keys/Space controls Arkanoid (Player 2)
      // In reversed/single player tetris mode:
      // - Arrow keys control Tetris
      // - Z/X for rotation

      if (useSeparateControls) {
        // 2-player mode: separate controls
        switch (e.code) {
          // Player 2 - Arkanoid (Arrow keys)
          case 'ArrowLeft':
            keysRef.current.left = true;
            forceUpdate({});
            break;
          case 'ArrowRight':
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

          // Player 1 - Tetris (WASD)
          case 'KeyA':
            keysRef.current.tetrisLeft = true;
            forceUpdate({});
            break;
          case 'KeyD':
            keysRef.current.tetrisRight = true;
            forceUpdate({});
            break;
          case 'KeyW':
          case 'KeyE':
            keysRef.current.tetrisRotateRight = true;
            forceUpdate({});
            break;
          case 'KeyS':
            keysRef.current.tetrisSoftDrop = true;
            forceUpdate({});
            break;
          case 'KeyQ':
            e.preventDefault();
            if (!keysRef.current.tetrisHardDrop) {
              keysRef.current.tetrisHardDrop = true;
              forceUpdate({});
            }
            break;

          // Common controls
          case 'Escape':
            e.preventDefault();
            if (!keysRef.current.escape) {
              keysRef.current.escape = true;
              onEscape?.();
              forceUpdate({});
            }
            break;
          case 'KeyP':
            e.preventDefault();
            if (!keysRef.current.pause) {
              keysRef.current.pause = true;
              onPause?.();
              forceUpdate({});
            }
            break;
        }
      } else {
        // Single player mode: arrow keys can be used for Tetris in reversed mode
        switch (e.code) {
          // Arkanoid paddle controls (when not in tetris mode, or arrow-based)
          case 'ArrowLeft':
            keysRef.current.left = true;
            keysRef.current.tetrisLeft = true;
            forceUpdate({});
            break;
          case 'ArrowRight':
            keysRef.current.right = true;
            keysRef.current.tetrisRight = true;
            forceUpdate({});
            break;
          case 'ArrowUp':
          case 'KeyX':
            keysRef.current.tetrisRotateRight = true;
            forceUpdate({});
            break;
          case 'KeyZ':
            keysRef.current.tetrisRotateLeft = true;
            forceUpdate({});
            break;
          case 'ArrowDown':
            keysRef.current.tetrisSoftDrop = true;
            forceUpdate({});
            break;

          // Also support WASD for paddle
          case 'KeyA':
            keysRef.current.left = true;
            forceUpdate({});
            break;
          case 'KeyD':
            keysRef.current.right = true;
            forceUpdate({});
            break;

          case 'Space':
            e.preventDefault();
            if (!keysRef.current.space) {
              keysRef.current.space = true;
              keysRef.current.tetrisHardDrop = true;
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
          case 'KeyP':
            e.preventDefault();
            if (!keysRef.current.pause) {
              keysRef.current.pause = true;
              onPause?.();
              forceUpdate({});
            }
            break;
        }
      }
    },
    [onSpace, onEscape, onPause, useSeparateControls]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
        keysRef.current.left = false;
        keysRef.current.tetrisLeft = false;
        forceUpdate({});
        break;
      case 'ArrowRight':
        keysRef.current.right = false;
        keysRef.current.tetrisRight = false;
        forceUpdate({});
        break;
      case 'ArrowUp':
      case 'KeyX':
        keysRef.current.tetrisRotateRight = false;
        forceUpdate({});
        break;
      case 'KeyZ':
        keysRef.current.tetrisRotateLeft = false;
        forceUpdate({});
        break;
      case 'ArrowDown':
        keysRef.current.tetrisSoftDrop = false;
        forceUpdate({});
        break;
      case 'KeyA':
        keysRef.current.left = false;
        keysRef.current.tetrisLeft = false;
        forceUpdate({});
        break;
      case 'KeyD':
        keysRef.current.right = false;
        keysRef.current.tetrisRight = false;
        forceUpdate({});
        break;
      case 'KeyW':
      case 'KeyE':
        keysRef.current.tetrisRotateRight = false;
        forceUpdate({});
        break;
      case 'KeyS':
        keysRef.current.tetrisSoftDrop = false;
        forceUpdate({});
        break;
      case 'KeyQ':
        keysRef.current.tetrisHardDrop = false;
        forceUpdate({});
        break;
      case 'Space':
        keysRef.current.space = false;
        keysRef.current.tetrisHardDrop = false;
        forceUpdate({});
        break;
      case 'Escape':
        keysRef.current.escape = false;
        forceUpdate({});
        break;
      case 'KeyP':
        keysRef.current.pause = false;
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
    tetrisInput: {
      left: keysRef.current.tetrisLeft,
      right: keysRef.current.tetrisRight,
      rotateLeft: keysRef.current.tetrisRotateLeft,
      rotateRight: keysRef.current.tetrisRotateRight,
      softDrop: keysRef.current.tetrisSoftDrop,
      hardDrop: keysRef.current.tetrisHardDrop,
    },
  };
}
