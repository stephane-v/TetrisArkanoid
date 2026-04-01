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
import type { GameMode, Difficulty } from '../types/game.types';

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { width, height } = useResponsive();
  const sound = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    gameState,
    gameMode,
    stats,
    robot,
    humanTetris,
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

    // Robot completed a line (only in classic mode)
    if (gameMode === 'CLASSIC' && robot.linesCompleted > prevRobotLines) {
      sound.lineComplete();
    }

    // Human completed a line (in reversed or 2-player modes)
    if ((gameMode === 'REVERSED' || gameMode === 'TWO_PLAYER') && humanTetris) {
      const prevHumanLines = prevStatsRef.current.linesPreventedCount;
      if (humanTetris.linesCompleted > prevHumanLines) {
        sound.lineComplete();
      }
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
  }, [stats, balls.length, powerUps.length, robot.linesCompleted, humanTetris, gameState, gameMode, sound]);

  const handleSpace = useCallback(() => {
    if (gameState === 'START') {
      // Don't start here, let StartScreen handle mode selection
    } else if (gameState === 'PAUSED') {
      resume();
    } else if (gameState === 'GAME_OVER') {
      reset();
      // Will need to select mode again
    } else if (gameState === 'PLAYING' && !ballLaunched && gameMode !== 'REVERSED') {
      // In reversed mode, AI handles ball launch
      sound.launch();
      launchBall();
    }
  }, [gameState, gameMode, ballLaunched, resume, reset, launchBall, sound]);

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

  // Use separate controls for 2-player mode
  const useSeparateControls = gameMode === 'TWO_PLAYER';

  const input = useInput({
    canvasRef,
    onSpace: handleSpace,
    onEscape: handleEscape,
    onPause: handlePause,
    useSeparateControls,
  });

  const handleUpdate = useCallback(
    (deltaTime: number) => {
      // Pass tetris input for reversed and 2-player modes
      const tetrisInput = (gameMode === 'REVERSED' || gameMode === 'TWO_PLAYER')
        ? input.tetrisInput
        : undefined;

      update(deltaTime, input.mouseX, input.leftPressed, input.rightPressed, tetrisInput);
    },
    [update, input.mouseX, input.leftPressed, input.rightPressed, input.tetrisInput, gameMode]
  );

  useGameLoop({
    onUpdate: handleUpdate,
    isRunning: gameState === 'PLAYING',
  });

  const handleStart = useCallback((mode: GameMode, difficulty: Difficulty, startingLevel: number) => {
    start(mode, difficulty, startingLevel);
  }, [start]);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  const handleRestart = useCallback(() => {
    reset();
    // Go back to start screen to choose mode
  }, [reset]);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    sound.setEnabled(newEnabled);
  }, [soundEnabled, sound]);

  // Get mode-specific title for display
  const getModeTitle = () => {
    switch (gameMode) {
      case 'CLASSIC': return 'Robot vs Player';
      case 'REVERSED': return 'Vous jouez Tetris';
      case 'TWO_PLAYER': return 'Joueur 1 vs Joueur 2';
      default: return '';
    }
  };

  // Fixed header heights: HUD=28px, RobotStatus=20px
  const headerHeight = gameMode === 'CLASSIC' ? 48 : 28;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 py-2 overflow-hidden">
      <div
        className="relative overflow-hidden rounded-lg shadow-2xl border border-gray-800 flex flex-col"
        style={{ width, height: height + headerHeight }}
      >
        <HUD
          stats={stats}
          hasShield={hasShield}
          activePowerUps={activePowerUps}
          modeTitle={gameMode !== 'CLASSIC' ? getModeTitle() : undefined}
          humanTetrisScore={humanTetris?.score}
        />
        {gameMode === 'CLASSIC' && <RobotStatus robot={robot} />}

        <div
          className="relative flex-grow"
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
              robotScore={gameMode === 'CLASSIC' ? robot.score : undefined}
              robotLines={gameMode === 'CLASSIC' ? robot.linesCompleted : undefined}
              humanTetrisScore={humanTetris?.score}
              humanTetrisLines={humanTetris?.linesCompleted}
              gameMode={gameMode}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>

      <div className="mt-4 text-gray-600 text-xs text-center">
        {gameMode === 'CLASSIC' && (
          <p>Déplacer: Souris/Tactile ou Flèches | Lancer: Espace/Clic | Pause: P ou Echap</p>
        )}
        {gameMode === 'REVERSED' && (
          <p>Tetris: Flèches + Z/X rotation + Espace (drop) | Pause: P ou Echap</p>
        )}
        {gameMode === 'TWO_PLAYER' && (
          <p>J1 Tetris: WASD+Q | J2 Arkanoid: Flèches+Espace | Pause: P</p>
        )}
      </div>
    </div>
  );
};
