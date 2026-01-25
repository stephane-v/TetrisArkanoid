import type { Ball } from '../../types/game.types';
import { BALL_CONFIG, COLORS } from '../utils/constants';

let ballIdCounter = 0;

export function createBall(
  x: number,
  y: number,
  vx: number = 0,
  vy: number = 0,
  options: Partial<Ball> = {}
): Ball {
  return {
    id: `ball_${++ballIdCounter}`,
    x,
    y,
    vx,
    vy,
    radius: BALL_CONFIG.radius,
    damage: BALL_CONFIG.defaultDamage,
    isPowered: false,
    color: COLORS.ball,
    ...options,
  };
}

export function launchBall(ball: Ball, speed: number): Ball {
  // Launch at a random angle between 45 and 135 degrees (upward)
  const angle = (Math.random() * Math.PI / 2) + Math.PI / 4;
  return {
    ...ball,
    vx: speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1),
    vy: -speed * Math.sin(angle),
  };
}

export function updateBallPosition(ball: Ball, deltaTime: number): Ball {
  return {
    ...ball,
    x: ball.x + ball.vx * deltaTime,
    y: ball.y + ball.vy * deltaTime,
  };
}

export function setBallVelocity(ball: Ball, vx: number, vy: number): Ball {
  // Ensure minimum vertical velocity to prevent horizontal-only movement
  const minVerticalSpeed = 50;
  const adjustedVy = Math.abs(vy) < minVerticalSpeed
    ? (vy >= 0 ? minVerticalSpeed : -minVerticalSpeed)
    : vy;

  return {
    ...ball,
    vx,
    vy: adjustedVy,
  };
}

export function reflectBallX(ball: Ball): Ball {
  return {
    ...ball,
    vx: -ball.vx,
  };
}

export function reflectBallY(ball: Ball): Ball {
  return {
    ...ball,
    vy: -ball.vy,
  };
}

export function normalizeBallSpeed(ball: Ball, targetSpeed: number): Ball {
  const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (currentSpeed === 0) return ball;

  const scale = targetSpeed / currentSpeed;
  return {
    ...ball,
    vx: ball.vx * scale,
    vy: ball.vy * scale,
  };
}

export function clampBallSpeed(ball: Ball, minSpeed: number, maxSpeed: number): Ball {
  const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

  if (currentSpeed < minSpeed) {
    return normalizeBallSpeed(ball, minSpeed);
  }

  if (currentSpeed > maxSpeed) {
    return normalizeBallSpeed(ball, maxSpeed);
  }

  return ball;
}

export function powerUpBall(ball: Ball): Ball {
  return {
    ...ball,
    isPowered: true,
    damage: BALL_CONFIG.defaultDamage * 2,
    color: COLORS.poweredBall,
  };
}

export function unpowerBall(ball: Ball): Ball {
  return {
    ...ball,
    isPowered: false,
    damage: BALL_CONFIG.defaultDamage,
    color: COLORS.ball,
  };
}

export function cloneBall(ball: Ball, angleOffset: number): Ball {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  const currentAngle = Math.atan2(ball.vy, ball.vx);
  const newAngle = currentAngle + angleOffset;

  return createBall(ball.x, ball.y, speed * Math.cos(newAngle), speed * Math.sin(newAngle), {
    damage: ball.damage,
    isPowered: ball.isPowered,
    color: ball.color,
  });
}
