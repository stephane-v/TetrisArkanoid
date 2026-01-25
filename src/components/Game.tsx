import { useRef, useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { useResponsive } from '../hooks/useResponsive';
import { useSound } from '../hooks/useSound';
import { Canvas } from './Canvas';
import { StartScreen } from './UI/StartScreen';
import { PauseMenu } from './UI/PauseMenu';
import { GameOver } from './UI/GameOver';
import { HUD } from './UI/HUD';
import { RobotStatus } from './UI/RobotStatus';

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { width, height } = useResponsive();
  const sound = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    gameState,
    stats,
    robot,
    hasShield,
    activePowerUps,
    gameOverReason,
    ballLaunched,
    balls,
    powerUps,
    start,
    pause,
    resume,
    launchBall,
    update,
    reset,
  } = useGameStore();

  // Track previous values for sound effects
  const prevStatsRef = useRef(stats);
  const prevBallsRef = useRef(balls.length);
  const prevPowerUpsRef = useRef(powerUps.length);
  const prevRobotLinesRef = useRef(robot.linesCompleted);
  const prevGameStateRef = useRef(gameState);

  // Sound effects based on state changes
  useEffect(() => {
    const prevStats = prevStatsRef.current;
    const prevBallCount = prevBallsRef.current;
    const prevPowerUpCount = prevPowerUpsRef.current;
    const prevRobotLines = prevRobotLinesRef.current;
    const prevGameState = prevGameStateRef.current;

    // Ball lost
    if (balls.length < prevBallCount && gameState === 'PLAYING') {
      sound.ballLost();
    }

    // Block destroyed
    if (stats.blocksDestroyed > prevStats.blocksDestroyed) {
      sound.blockDestroy();
    }

    // Power-up collected
    if (powerUps.length < prevPowerUpCount && stats.score > prevStats.score) {
      sound.powerUp();
    }

    // Robot completed a line
    if (robot.linesCompleted > prevRobotLines) {
      sound.lineComplete();
    }

    // Level up
    if (stats.level > prevStats.level) {
      sound.levelUp();
    }

    // Game state changes
    if (gameState !== prevGameState) {
      if (gameState === 'PLAYING' && prevGameState === 'START') {
        sound.gameStart();
      } else if (gameState === 'PAUSED') {
        sound.pause();
      } else if (gameState === 'PLAYING' && prevGameState === 'PAUSED') {
        sound.resume();
      } else if (gameState === 'GAME_OVER') {
        sound.gameOver();
      }
    }

    // Update refs
    prevStatsRef.current = stats;
    prevBallsRef.current = balls.length;
    prevPowerUpsRef.current = powerUps.length;
    prevRobotLinesRef.current = robot.linesCompleted;
    prevGameStateRef.current = gameState;
  }, [stats, balls.length, powerUps.length, robot.linesCompleted, gameState, sound]);

  const handleSpace = useCallback(() => {
    if (gameState === 'START') {
      start();
    } else if (gameState === 'PAUSED') {
      resume();
    } else if (gameState === 'GAME_OVER') {
      reset();
      start();
    } else if (gameState === 'PLAYING' && !ballLaunched) {
      sound.launch();
      launchBall();
    }
  }, [gameState, ballLaunched, start, resume, reset, launchBall, sound]);

  const handlePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      pause();
    } else if (gameState === 'PAUSED') {
      resume();
    }
  }, [gameState, pause, resume]);

  const handleEscape = useCallback(() => {
    handlePause();
  }, [handlePause]);

  const input = useInput({
    canvasRef,
    onSpace: handleSpace,
    onEscape: handleEscape,
    onPause: handlePause,
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

  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    sound.setEnabled(newEnabled);
  }, [soundEnabled, sound]);

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
            <PauseMenu
              onResume={handleResume}
              onRestart={handleRestart}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
            />
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
        <p>Move: Mouse/Touch or Arrow Keys | Launch: Space/Click | Pause: P or Escape</p>
      </div>
    </div>
  );
};
