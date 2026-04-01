import type { Ball, Paddle, Block, GameGrid } from '../../types/game.types';
import { CANVAS_CONFIG, GRID_CONFIG } from './constants';

export interface CollisionResult {
  collided: boolean;
  normal?: { x: number; y: number };
  penetration?: number;
}

// Check ball vs paddle collision
export function checkBallPaddleCollision(ball: Ball, paddle: Paddle): CollisionResult {
  // Find closest point on paddle to ball center
  const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
  const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));

  const distanceX = ball.x - closestX;
  const distanceY = ball.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  if (distanceSquared < ball.radius * ball.radius) {
    const distance = Math.sqrt(distanceSquared) || 1;
    return {
      collided: true,
      normal: { x: distanceX / distance, y: distanceY / distance },
      penetration: ball.radius - distance,
    };
  }

  return { collided: false };
}

// Check ball vs block collision
export function checkBallBlockCollision(
  ball: Ball,
  blockX: number,
  blockY: number,
  blockWidth: number,
  blockHeight: number
): CollisionResult {
  // Find closest point on block to ball center
  const closestX = Math.max(blockX, Math.min(ball.x, blockX + blockWidth));
  const closestY = Math.max(blockY, Math.min(ball.y, blockY + blockHeight));

  const distanceX = ball.x - closestX;
  const distanceY = ball.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  if (distanceSquared < ball.radius * ball.radius) {
    const distance = Math.sqrt(distanceSquared) || 1;

    // Determine collision normal based on which side was hit
    let normalX = 0;
    let normalY = 0;

    // Check which edge the ball is closest to
    const dx = ball.x - (blockX + blockWidth / 2);
    const dy = ball.y - (blockY + blockHeight / 2);

    const overlapX = blockWidth / 2 + ball.radius - Math.abs(dx);
    const overlapY = blockHeight / 2 + ball.radius - Math.abs(dy);

    if (overlapX < overlapY) {
      normalX = dx > 0 ? 1 : -1;
    } else {
      normalY = dy > 0 ? 1 : -1;
    }

    return {
      collided: true,
      normal: { x: normalX, y: normalY },
      penetration: ball.radius - distance,
    };
  }

  return { collided: false };
}

// Check ball vs walls collision
export function checkBallWallCollision(ball: Ball): {
  hitLeft: boolean;
  hitRight: boolean;
  hitTop: boolean;
  hitBottom: boolean;
} {
  const gridLeft = CANVAS_CONFIG.gridOffsetX;
  const gridRight = CANVAS_CONFIG.gridOffsetX + GRID_CONFIG.width * GRID_CONFIG.cellSize;
  const gridTop = CANVAS_CONFIG.gridOffsetY;
  const gridBottom = CANVAS_CONFIG.height - 10;

  return {
    hitLeft: ball.x - ball.radius <= gridLeft,
    hitRight: ball.x + ball.radius >= gridRight,
    hitTop: ball.y - ball.radius <= gridTop,
    hitBottom: ball.y + ball.radius >= gridBottom,
  };
}

// Convert grid coordinates to canvas coordinates
export function gridToCanvas(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: CANVAS_CONFIG.gridOffsetX + gridX * GRID_CONFIG.cellSize,
    y: CANVAS_CONFIG.gridOffsetY + gridY * GRID_CONFIG.cellSize,
  };
}

// Convert canvas coordinates to grid coordinates
export function canvasToGrid(canvasX: number, canvasY: number): { x: number; y: number } {
  return {
    x: Math.floor((canvasX - CANVAS_CONFIG.gridOffsetX) / GRID_CONFIG.cellSize),
    y: Math.floor((canvasY - CANVAS_CONFIG.gridOffsetY) / GRID_CONFIG.cellSize),
  };
}

// Get block at grid position
export function getBlockAt(grid: GameGrid, gridX: number, gridY: number): Block | null {
  if (gridX < 0 || gridX >= grid.config.width || gridY < 0 || gridY >= grid.config.height) {
    return null;
  }
  return grid.blocks[gridY]?.[gridX] || null;
}

// Check if position is in danger zone
export function isInDangerZone(gridY: number): boolean {
  return gridY >= GRID_CONFIG.height - GRID_CONFIG.dangerZone;
}

// Reflect ball velocity based on collision normal
export function reflectVelocity(
  vx: number,
  vy: number,
  normalX: number,
  normalY: number
): { vx: number; vy: number } {
  const dotProduct = vx * normalX + vy * normalY;
  return {
    vx: vx - 2 * dotProduct * normalX,
    vy: vy - 2 * dotProduct * normalY,
  };
}

// Calculate paddle bounce angle
export function calculatePaddleBounce(
  ball: Ball,
  paddle: Paddle
): { vx: number; vy: number } {
  // Calculate where on the paddle the ball hit (-1 to 1)
  const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);

  // Calculate ball speed
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

  // Calculate new angle based on hit position
  // Center hit = straight up, edges = angled
  const maxAngle = Math.PI / 3; // 60 degrees max
  const angle = hitPosition * maxAngle;

  return {
    vx: speed * Math.sin(angle),
    vy: -Math.abs(speed * Math.cos(angle)), // Always go up
  };
}
