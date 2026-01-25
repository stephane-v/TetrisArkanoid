import { useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { useResponsive } from '../hooks/useResponsive';
import { Canvas } from './Canvas';
import { StartScreen } from './UI/StartScreen';
import { PauseMenu } from './UI/PauseMenu';
import { GameOver } from './UI/GameOver';
import { HUD } from './UI/HUD';
import { RobotStatus } from './UI/RobotStatus';

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { width, height } = useResponsive();

  const {
    gameState,
    stats,
    robot,
    hasShield,
    activePowerUps,
    gameOverReason,
    ballLaunched,
    start,
    pause,
    resume,
    launchBall,
    update,
    reset,
  } = useGameStore();

  const handleSpace = useCallback(() => {
    if (gameState === 'START') {
      start();
    } else if (gameState === 'PAUSED') {
      resume();
    } else if (gameState === 'GAME_OVER') {
      reset();
      start();
    } else if (gameState === 'PLAYING' && !ballLaunched) {
      launchBall();
    }
  }, [gameState, ballLaunched, start, resume, reset, launchBall]);

  const handleEscape = useCallback(() => {
    if (gameState === 'PLAYING') {
      pause();
    } else if (gameState === 'PAUSED') {
      resume();
    }
  }, [gameState, pause, resume]);

  const input = useInput({
    canvasRef,
    onSpace: handleSpace,
    onEscape: handleEscape,
  });

  const handleUpdate = useCallback(
    (deltaTime: number) => {
      update(deltaTime, input.mouseX, input.leftPressed, input.rightPressed);
    },
    [update, input.mouseX, input.leftPressed, input.rightPressed]
  );

  useGameLoop({
    onUpdate: handleUpdate,
    isRunning: gameState === 'PLAYING',
  });

  const handleStart = useCallback(() => {
    start();
  }, [start]);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  const handleRestart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 py-4">
      <div
        className="relative overflow-hidden rounded-lg shadow-2xl border border-gray-800"
        style={{ width, height: height + 60 }}
      >
        <HUD stats={stats} hasShield={hasShield} activePowerUps={activePowerUps} />
        <RobotStatus robot={robot} />

        <div
          className="relative"
          style={{
            width,
            height,
            transform: `scale(${width / 480})`,
            transformOrigin: 'top left',
          }}
        >
          <Canvas canvasRef={canvasRef} />

          {gameState === 'START' && <StartScreen onStart={handleStart} />}

          {gameState === 'PAUSED' && (
            <PauseMenu onResume={handleResume} onRestart={handleRestart} />
          )}

          {gameState === 'GAME_OVER' && (
            <GameOver
              reason={gameOverReason}
              stats={stats}
              robotScore={robot.score}
              robotLines={robot.linesCompleted}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>

      <div className="mt-4 text-gray-600 text-xs text-center">
        <p>Move: Mouse/Touch or Arrow Keys | Launch: Space/Click | Pause: Escape</p>
      </div>
    </div>
  );
};
