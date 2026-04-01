import type { Ball, GameGrid, Paddle } from '../../types/game.types';
import {
  checkBallPaddleCollision,
  checkBallBlockCollision,
  checkBallWallCollision,
  gridToCanvas,
  calculatePaddleBounce,
} from '../utils/collision';
import { GRID_CONFIG, BALL_CONFIG } from '../utils/constants';
import {
  updateBallPosition,
  reflectBallX,
  reflectBallY,
  setBallVelocity,
  clampBallSpeed,
} from '../entities/Ball';
import { damageBlock } from '../entities/Grid';

export interface PhysicsUpdateResult {
  balls: Ball[];
  grid: GameGrid;
  lostBalls: Ball[];
  blocksDestroyed: { x: number; y: number; wasReinforced: boolean }[];
  score: number;
}

export function updatePhysics(
  balls: Ball[],
  grid: GameGrid,
  paddle: Paddle,
  deltaTime: number,
  currentBallSpeed: number
): PhysicsUpdateResult {
  const updatedBalls: Ball[] = [];
  const lostBalls: Ball[] = [];
  const blocksDestroyed: { x: number; y: number; wasReinforced: boolean }[] = [];
  let currentGrid = grid;
  let score = 0;

  for (const ball of balls) {
    let updatedBall = updateBallPosition(ball, deltaTime);

    // Check wall collisions
    const wallCollision = checkBallWallCollision(updatedBall);

    if (wallCollision.hitLeft || wallCollision.hitRight) {
      updatedBall = reflectBallX(updatedBall);

      // Clamp position
      if (wallCollision.hitLeft) {
        updatedBall = { ...updatedBall, x: updatedBall.radius + 100 }; // gridOffsetX
      }
      if (wallCollision.hitRight) {
        const gridRight = 100 + GRID_CONFIG.width * GRID_CONFIG.cellSize;
        updatedBall = { ...updatedBall, x: gridRight - updatedBall.radius };
      }
    }

    if (wallCollision.hitTop) {
      updatedBall = reflectBallY(updatedBall);
      updatedBall = { ...updatedBall, y: updatedBall.radius + 50 }; // gridOffsetY
    }

    if (wallCollision.hitBottom) {
      lostBalls.push(ball);
      continue;
    }

    // Check paddle collision
    const paddleCollision = checkBallPaddleCollision(updatedBall, paddle);
    if (paddleCollision.collided && updatedBall.vy > 0) {
      const newVelocity = calculatePaddleBounce(updatedBall, paddle);
      updatedBall = setBallVelocity(updatedBall, newVelocity.vx, newVelocity.vy);

      // Push ball out of paddle
      updatedBall = {
        ...updatedBall,
        y: paddle.y - updatedBall.radius - 1,
      };
    }

    // Check block collisions
    const blockCollisions = checkBlockCollisions(updatedBall, currentGrid);

    for (const collision of blockCollisions) {
      // Reflect ball (unless powered)
      if (!updatedBall.isPowered) {
        if (collision.normalX !== 0) {
          updatedBall = reflectBallX(updatedBall);
        }
        if (collision.normalY !== 0) {
          updatedBall = reflectBallY(updatedBall);
        }
      }

      // Damage block
      const damageResult = damageBlock(
        currentGrid,
        collision.gridX,
        collision.gridY,
        updatedBall.damage
      );

      currentGrid = damageResult.grid;

      if (damageResult.destroyed) {
        blocksDestroyed.push({
          x: collision.gridX,
          y: collision.gridY,
          wasReinforced: damageResult.wasReinforced,
        });
        score += damageResult.wasReinforced ? 25 : 10;
      }

      // Only process one collision per frame if not powered
      if (!updatedBall.isPowered) {
        break;
      }
    }

    // Normalize ball speed
    updatedBall = clampBallSpeed(updatedBall, currentBallSpeed * 0.9, BALL_CONFIG.maxSpeed);

    updatedBalls.push(updatedBall);
  }

  return {
    balls: updatedBalls,
    grid: currentGrid,
    lostBalls,
    blocksDestroyed,
    score,
  };
}

interface BlockCollision {
  gridX: number;
  gridY: number;
  normalX: number;
  normalY: number;
}

function checkBlockCollisions(ball: Ball, grid: GameGrid): BlockCollision[] {
  const collisions: BlockCollision[] = [];
  const cellSize = GRID_CONFIG.cellSize;

  // Check blocks near the ball
  const ballGridX = Math.floor((ball.x - 100) / cellSize); // gridOffsetX = 100
  const ballGridY = Math.floor((ball.y - 50) / cellSize); // gridOffsetY = 50

  // Check a 3x3 area around the ball
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const gridX = ballGridX + dx;
      const gridY = ballGridY + dy;

      if (
        gridX < 0 ||
        gridX >= grid.config.width ||
        gridY < 0 ||
        gridY >= grid.config.height
      ) {
        continue;
      }

      const block = grid.blocks[gridY]?.[gridX];
      if (!block) continue;

      const canvasPos = gridToCanvas(gridX, gridY);
      const collision = checkBallBlockCollision(
        ball,
        canvasPos.x,
        canvasPos.y,
        cellSize,
        cellSize
      );

      if (collision.collided && collision.normal) {
        collisions.push({
          gridX,
          gridY,
          normalX: collision.normal.x,
          normalY: collision.normal.y,
        });
      }
    }
  }

  return collisions;
}
