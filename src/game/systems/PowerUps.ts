import type { PowerUp, PowerUpType, ActivePowerUp, Ball, Paddle, GameGrid } from '../../types/game.types';
import { POWERUP_CONFIG, POWERUP_DEFINITIONS, COLORS } from '../utils/constants';
import { cloneBall, powerUpBall, unpowerBall } from '../entities/Ball';
import { enlargePaddle, setPaddleWidth } from '../entities/Paddle';
import { destroyRandomLine } from '../entities/Grid';

let powerUpIdCounter = 0;

const POWERUP_TYPES: PowerUpType[] = [
  'MULTI_BALL',
  'LARGE_PADDLE',
  'POWER_BALL',
  'FREEZE_ROBOT',
  'LINE_BOMB',
  'SHIELD',
  'EXTRA_LIFE',
];

const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  MULTI_BALL: 15,
  LARGE_PADDLE: 20,
  POWER_BALL: 15,
  FREEZE_ROBOT: 10,
  LINE_BOMB: 10,
  SHIELD: 10,
  EXTRA_LIFE: 20,
};

export function maybeSpawnPowerUp(x: number, y: number, dropChance?: number): PowerUp | null {
  const effectiveDropChance = dropChance ?? POWERUP_CONFIG.dropChance;
  if (Math.random() > effectiveDropChance) {
    return null;
  }

  const type = getWeightedRandomPowerUp();

  return {
    id: `powerup_${++powerUpIdCounter}`,
    type,
    x,
    y,
    vy: POWERUP_CONFIG.fallSpeed,
  };
}

function getWeightedRandomPowerUp(): PowerUpType {
  const totalWeight = Object.values(POWERUP_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const type of POWERUP_TYPES) {
    random -= POWERUP_WEIGHTS[type];
    if (random <= 0) {
      return type;
    }
  }

  return 'EXTRA_LIFE';
}

export function updatePowerUp(powerUp: PowerUp, deltaTime: number): PowerUp {
  return {
    ...powerUp,
    y: powerUp.y + powerUp.vy * deltaTime,
  };
}

export function checkPowerUpPaddleCollision(powerUp: PowerUp, paddle: Paddle): boolean {
  return (
    powerUp.x >= paddle.x &&
    powerUp.x <= paddle.x + paddle.width &&
    powerUp.y + POWERUP_CONFIG.size / 2 >= paddle.y &&
    powerUp.y - POWERUP_CONFIG.size / 2 <= paddle.y + paddle.height
  );
}

export interface PowerUpApplicationResult {
  balls: Ball[];
  paddle: Paddle;
  grid: GameGrid;
  lives: number;
  activePowerUps: ActivePowerUp[];
  hasShield: boolean;
  freezeRobot: boolean;
}

export function applyPowerUp(
  type: PowerUpType,
  balls: Ball[],
  paddle: Paddle,
  grid: GameGrid,
  lives: number,
  activePowerUps: ActivePowerUp[],
  hasShield: boolean,
  _defaultPaddleWidth: number
): PowerUpApplicationResult {
  const definition = POWERUP_DEFINITIONS[type];
  let newBalls = [...balls];
  let newPaddle = { ...paddle };
  let newGrid = grid;
  let newLives = lives;
  let newActivePowerUps = [...activePowerUps];
  let newHasShield = hasShield;
  let freezeRobot = false;

  switch (type) {
    case 'MULTI_BALL':
      // Add 2 balls split from the first ball
      if (balls.length > 0) {
        const sourceBall = balls[0];
        newBalls.push(cloneBall(sourceBall, Math.PI / 6));
        newBalls.push(cloneBall(sourceBall, -Math.PI / 6));
      }
      break;

    case 'LARGE_PADDLE':
      newPaddle = enlargePaddle(paddle, 1.5);
      newActivePowerUps = addOrRefreshPowerUp(newActivePowerUps, type, definition.duration);
      break;

    case 'POWER_BALL':
      newBalls = balls.map(ball => powerUpBall(ball));
      newActivePowerUps = addOrRefreshPowerUp(newActivePowerUps, type, definition.duration);
      break;

    case 'FREEZE_ROBOT':
      freezeRobot = true;
      newActivePowerUps = addOrRefreshPowerUp(newActivePowerUps, type, definition.duration);
      break;

    case 'LINE_BOMB':
      newGrid = destroyRandomLine(grid);
      break;

    case 'SHIELD':
      newHasShield = true;
      break;

    case 'EXTRA_LIFE':
      newLives++;
      break;
  }

  return {
    balls: newBalls,
    paddle: newPaddle,
    grid: newGrid,
    lives: newLives,
    activePowerUps: newActivePowerUps,
    hasShield: newHasShield,
    freezeRobot,
  };
}

function addOrRefreshPowerUp(
  activePowerUps: ActivePowerUp[],
  type: PowerUpType,
  duration: number | null
): ActivePowerUp[] {
  const existing = activePowerUps.findIndex(p => p.type === type);

  if (existing !== -1) {
    // Refresh duration
    const updated = [...activePowerUps];
    updated[existing] = {
      ...updated[existing],
      remainingTime: duration,
    };
    return updated;
  }

  // Add new power-up
  return [
    ...activePowerUps,
    {
      type,
      duration,
      remainingTime: duration,
    },
  ];
}

export interface PowerUpExpireResult {
  activePowerUps: ActivePowerUp[];
  balls: Ball[];
  paddle: Paddle;
  unfreezeRobot: boolean;
}

export function updateActivePowerUps(
  activePowerUps: ActivePowerUp[],
  balls: Ball[],
  paddle: Paddle,
  deltaTime: number,
  defaultPaddleWidth: number
): PowerUpExpireResult {
  const remaining: ActivePowerUp[] = [];
  let newBalls = balls;
  let newPaddle = paddle;
  let unfreezeRobot = false;

  for (const powerUp of activePowerUps) {
    if (powerUp.remainingTime === null) {
      remaining.push(powerUp);
      continue;
    }

    const newRemainingTime = powerUp.remainingTime - deltaTime * 1000;

    if (newRemainingTime <= 0) {
      // Power-up expired
      switch (powerUp.type) {
        case 'LARGE_PADDLE':
          newPaddle = setPaddleWidth(paddle, defaultPaddleWidth);
          break;
        case 'POWER_BALL':
          newBalls = balls.map(ball => unpowerBall(ball));
          break;
        case 'FREEZE_ROBOT':
          unfreezeRobot = true;
          break;
      }
    } else {
      remaining.push({
        ...powerUp,
        remainingTime: newRemainingTime,
      });
    }
  }

  return {
    activePowerUps: remaining,
    balls: newBalls,
    paddle: newPaddle,
    unfreezeRobot,
  };
}

export function getPowerUpColor(type: PowerUpType): string {
  return COLORS.powerUp[type];
}

export function getPowerUpIcon(type: PowerUpType): string {
  return POWERUP_DEFINITIONS[type].icon;
}

export function isPowerUpActive(activePowerUps: ActivePowerUp[], type: PowerUpType): boolean {
  return activePowerUps.some(p => p.type === type);
}

export function getPowerUpRemainingTime(
  activePowerUps: ActivePowerUp[],
  type: PowerUpType
): number | null {
  const powerUp = activePowerUps.find(p => p.type === type);
  return powerUp?.remainingTime ?? null;
}
