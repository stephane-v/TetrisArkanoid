import type {
  Ball,
  Paddle,
  GameGrid,
  PowerUp,
  ActivePowerUp,
  GameState,
  GameStats,
  RobotState,
  GameOverReason,
  Particle,
} from '../types/game.types';
import { CANVAS_CONFIG, GRID_CONFIG, getDifficultyConfig, SCORING, COMBO_TIMEOUT } from './utils/constants';
import { createEmptyGrid, updateLineWarnings } from './entities/Grid';
import { createBall, launchBall } from './entities/Ball';
import { createPaddle, updatePaddleWithInput, getPaddleCenter } from './entities/Paddle';
import { updatePhysics } from './systems/Physics';
import { createRobotState, updateRobot, commitPlacement, freezeRobot, unfreezeRobot, incrementRobotLines } from './systems/RobotAI';
import { processLineCompletion, checkLinePrevention } from './systems/LineDetection';
import {
  maybeSpawnPowerUp,
  updatePowerUp,
  checkPowerUpPaddleCollision,
  applyPowerUp,
  updateActivePowerUps,
} from './systems/PowerUps';
import { checkLevelUp, getNextLevel, calculateLevelProgress } from './systems/Difficulty';
import { gridToCanvas } from './utils/collision';

export interface GameEngineState {
  gameState: GameState;
  balls: Ball[];
  paddle: Paddle;
  grid: GameGrid;
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  robot: RobotState;
  stats: GameStats;
  hasShield: boolean;
  gameOverReason: GameOverReason;
  particles: Particle[];
  ballLaunched: boolean;
}

export function createInitialState(): GameEngineState {
  const diffConfig = getDifficultyConfig(1);
  const paddle = createPaddle(diffConfig.paddleWidth);
  const paddleCenter = getPaddleCenter(paddle);

  return {
    gameState: 'START',
    balls: [createBall(paddleCenter.x, paddle.y - 20)],
    paddle,
    grid: createEmptyGrid(),
    powerUps: [],
    activePowerUps: [],
    robot: createRobotState(1),
    stats: {
      score: 0,
      lives: 3,
      level: 1,
      blocksDestroyed: 0,
      linesPreventedCount: 0,
      survivalTime: 0,
      combo: 0,
      maxCombo: 0,
      lastComboTime: 0,
    },
    hasShield: false,
    gameOverReason: null,
    particles: [],
    ballLaunched: false,
  };
}

export function startGame(_state: GameEngineState): GameEngineState {
  return {
    ...createInitialState(),
    gameState: 'PLAYING',
  };
}

export function pauseGame(state: GameEngineState): GameEngineState {
  if (state.gameState !== 'PLAYING') return state;
  return { ...state, gameState: 'PAUSED' };
}

export function resumeGame(state: GameEngineState): GameEngineState {
  if (state.gameState !== 'PAUSED') return state;
  return { ...state, gameState: 'PLAYING' };
}

export function launchBallAction(state: GameEngineState): GameEngineState {
  if (state.ballLaunched || state.balls.length === 0) return state;

  const diffConfig = getDifficultyConfig(state.stats.level);
  const launchedBall = launchBall(state.balls[0], diffConfig.ballSpeed);

  return {
    ...state,
    balls: [launchedBall, ...state.balls.slice(1)],
    ballLaunched: true,
  };
}

export function updateGame(
  state: GameEngineState,
  deltaTime: number,
  mouseX: number | null,
  leftPressed: boolean,
  rightPressed: boolean
): GameEngineState {
  if (state.gameState !== 'PLAYING') return state;

  let newState = { ...state };
  const now = Date.now();
  const diffConfig = getDifficultyConfig(state.stats.level);

  // Update survival time
  newState.stats = {
    ...newState.stats,
    survivalTime: newState.stats.survivalTime + deltaTime,
  };

  // Update paddle
  newState.paddle = updatePaddleWithInput(
    newState.paddle,
    deltaTime,
    leftPressed,
    rightPressed,
    mouseX
  );

  // If ball not launched, keep it on paddle
  if (!newState.ballLaunched && newState.balls.length > 0) {
    const paddleCenter = getPaddleCenter(newState.paddle);
    newState.balls = [
      {
        ...newState.balls[0],
        x: paddleCenter.x,
        y: newState.paddle.y - 20,
      },
      ...newState.balls.slice(1),
    ];
  }

  // Update physics (ball movement and collisions)
  if (newState.ballLaunched) {
    const oldGrid = newState.grid;
    const physicsResult = updatePhysics(
      newState.balls,
      newState.grid,
      newState.paddle,
      deltaTime,
      diffConfig.ballSpeed
    );

    newState.balls = physicsResult.balls;
    newState.grid = physicsResult.grid;

    // Handle lost balls
    if (physicsResult.lostBalls.length > 0) {
      newState.stats = {
        ...newState.stats,
        lives: newState.stats.lives - physicsResult.lostBalls.length,
      };
    }

    // Handle destroyed blocks
    if (physicsResult.blocksDestroyed.length > 0) {
      // Update combo
      const timeSinceLastHit = now - newState.stats.lastComboTime;
      let newCombo = timeSinceLastHit < COMBO_TIMEOUT
        ? newState.stats.combo + physicsResult.blocksDestroyed.length
        : physicsResult.blocksDestroyed.length;

      // Calculate score with combo multiplier
      const comboMultiplier = Math.pow(SCORING.comboBase, newCombo - 1);
      const blockScore = Math.floor(physicsResult.score * comboMultiplier);

      // Check if player prevented any lines
      const linesPrevented = checkLinePrevention(oldGrid, newState.grid);
      const preventedBonus = linesPrevented * SCORING.linePrevented;

      newState.stats = {
        ...newState.stats,
        score: newState.stats.score + blockScore + preventedBonus,
        blocksDestroyed: newState.stats.blocksDestroyed + physicsResult.blocksDestroyed.length,
        linesPreventedCount: newState.stats.linesPreventedCount + linesPrevented,
        combo: newCombo,
        maxCombo: Math.max(newState.stats.maxCombo, newCombo),
        lastComboTime: now,
      };

      // Spawn power-ups from destroyed blocks
      for (const block of physicsResult.blocksDestroyed) {
        const canvasPos = gridToCanvas(block.x, block.y);
        const powerUp = maybeSpawnPowerUp(
          canvasPos.x + GRID_CONFIG.cellSize / 2,
          canvasPos.y + GRID_CONFIG.cellSize / 2
        );
        if (powerUp) {
          newState.powerUps = [...newState.powerUps, powerUp];
        }

        // Create particles
        newState.particles = [
          ...newState.particles,
          ...createBlockParticles(canvasPos.x + GRID_CONFIG.cellSize / 2, canvasPos.y + GRID_CONFIG.cellSize / 2),
        ];
      }
    }

    // Decay combo if no recent hits
    if (now - newState.stats.lastComboTime > COMBO_TIMEOUT && newState.stats.combo > 0) {
      newState.stats = { ...newState.stats, combo: 0 };
    }
  }

  // Check for all balls lost
  if (newState.balls.length === 0) {
    if (newState.stats.lives > 0) {
      // Respawn ball
      const paddleCenter = getPaddleCenter(newState.paddle);
      newState.balls = [createBall(paddleCenter.x, newState.paddle.y - 20)];
      newState.ballLaunched = false;
    } else {
      // Game over
      newState.gameState = 'GAME_OVER';
      newState.gameOverReason = 'NO_BALLS';
      return newState;
    }
  }

  // Update robot
  newState.robot = updateRobot(newState.robot, newState.grid, deltaTime, newState.stats.level);

  // Check if robot placement is complete
  if (newState.robot.placementProgress >= 1 && newState.robot.targetPlacement) {
    const commitResult = commitPlacement(newState.robot, newState.grid, newState.stats.level);
    newState.robot = commitResult.robotState;
    newState.grid = commitResult.grid;

    // Check for completed lines
    const lineResult = processLineCompletion(newState.grid, newState.hasShield);
    newState.grid = lineResult.grid;

    if (lineResult.linesCompleted > 0) {
      // Robot scored!
      newState.robot = incrementRobotLines(newState.robot, lineResult.linesCompleted);
      newState.stats = {
        ...newState.stats,
        score: newState.stats.score + SCORING.robotLineCompleted * lineResult.linesCompleted,
      };

      // Shield consumed
      if (newState.hasShield) {
        newState.hasShield = false;
      }
    }

    // Check if blocks reached danger zone
    if (lineResult.blocksInDangerZone) {
      newState.gameState = 'GAME_OVER';
      newState.gameOverReason = 'BLOCKS_REACHED_BOTTOM';
      return newState;
    }
  }

  // Update line warnings
  newState.grid = updateLineWarnings(newState.grid);

  // Update power-ups
  newState.powerUps = newState.powerUps
    .map(p => updatePowerUp(p, deltaTime))
    .filter(p => p.y < CANVAS_CONFIG.height + 50); // Remove off-screen power-ups

  // Check power-up collection
  const collectedPowerUps: PowerUp[] = [];
  const remainingPowerUps: PowerUp[] = [];

  for (const powerUp of newState.powerUps) {
    if (checkPowerUpPaddleCollision(powerUp, newState.paddle)) {
      collectedPowerUps.push(powerUp);
    } else {
      remainingPowerUps.push(powerUp);
    }
  }

  newState.powerUps = remainingPowerUps;

  // Apply collected power-ups
  for (const powerUp of collectedPowerUps) {
    const result = applyPowerUp(
      powerUp.type,
      newState.balls,
      newState.paddle,
      newState.grid,
      newState.stats.lives,
      newState.activePowerUps,
      newState.hasShield,
      diffConfig.paddleWidth
    );

    newState.balls = result.balls;
    newState.paddle = result.paddle;
    newState.grid = result.grid;
    newState.stats = { ...newState.stats, lives: result.lives };
    newState.activePowerUps = result.activePowerUps;
    newState.hasShield = result.hasShield;

    if (result.freezeRobot) {
      newState.robot = freezeRobot(newState.robot);
    }

    newState.stats = {
      ...newState.stats,
      score: newState.stats.score + SCORING.powerUpCollected,
    };
  }

  // Update active power-ups (check for expiration)
  const powerUpUpdate = updateActivePowerUps(
    newState.activePowerUps,
    newState.balls,
    newState.paddle,
    deltaTime,
    diffConfig.paddleWidth
  );

  newState.activePowerUps = powerUpUpdate.activePowerUps;
  newState.balls = powerUpUpdate.balls;
  newState.paddle = powerUpUpdate.paddle;

  if (powerUpUpdate.unfreezeRobot) {
    newState.robot = unfreezeRobot(newState.robot);
  }

  // Check for level up
  const levelProgress = calculateLevelProgress(
    newState.stats.level,
    newState.stats.survivalTime,
    newState.stats.blocksDestroyed
  );

  if (checkLevelUp(levelProgress)) {
    const newLevel = getNextLevel(newState.stats.level);
    if (newLevel > newState.stats.level) {
      const newDiffConfig = getDifficultyConfig(newLevel);
      newState.stats = { ...newState.stats, level: newLevel };

      // Update paddle width for new level (only if not enlarged by power-up)
      const hasLargePaddle = newState.activePowerUps.some(p => p.type === 'LARGE_PADDLE');
      if (!hasLargePaddle) {
        newState.paddle = { ...newState.paddle, width: newDiffConfig.paddleWidth };
      }
    }
  }

  // Update particles
  newState.particles = updateParticles(newState.particles, deltaTime);

  // Add survival score
  newState.stats = {
    ...newState.stats,
    score: newState.stats.score + Math.floor(SCORING.survivalPerSecond * deltaTime),
  };

  return newState;
}

function createBlockParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#ffffff', '#ffff00', '#ff8800', '#ff0000'];

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
    const speed = 100 + Math.random() * 100;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3,
    });
  }

  return particles;
}

function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * deltaTime,
      y: p.y + p.vy * deltaTime,
      vy: p.vy + 200 * deltaTime, // Gravity
      life: p.life - deltaTime,
    }))
    .filter(p => p.life > 0);
}
