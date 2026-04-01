import type { Paddle } from '../../types/game.types';
import { PADDLE_CONFIG, CANVAS_CONFIG, GRID_CONFIG } from '../utils/constants';

export function createPaddle(width: number = PADDLE_CONFIG.defaultWidth): Paddle {
  const gridLeft = CANVAS_CONFIG.gridOffsetX;
  const gridWidth = GRID_CONFIG.width * GRID_CONFIG.cellSize;

  return {
    x: gridLeft + (gridWidth - width) / 2,
    y: CANVAS_CONFIG.height - PADDLE_CONFIG.bottomMargin - PADDLE_CONFIG.height,
    width,
    height: PADDLE_CONFIG.height,
    speed: PADDLE_CONFIG.speed,
  };
}

export function movePaddle(paddle: Paddle, deltaX: number): Paddle {
  const gridLeft = CANVAS_CONFIG.gridOffsetX;
  const gridRight = CANVAS_CONFIG.gridOffsetX + GRID_CONFIG.width * GRID_CONFIG.cellSize;

  const newX = Math.max(
    gridLeft,
    Math.min(gridRight - paddle.width, paddle.x + deltaX)
  );

  return {
    ...paddle,
    x: newX,
  };
}

export function setPaddlePosition(paddle: Paddle, x: number): Paddle {
  const gridLeft = CANVAS_CONFIG.gridOffsetX;
  const gridRight = CANVAS_CONFIG.gridOffsetX + GRID_CONFIG.width * GRID_CONFIG.cellSize;

  // Center paddle on x position
  const targetX = x - paddle.width / 2;
  const clampedX = Math.max(gridLeft, Math.min(gridRight - paddle.width, targetX));

  return {
    ...paddle,
    x: clampedX,
  };
}

export function updatePaddleWithInput(
  paddle: Paddle,
  deltaTime: number,
  leftPressed: boolean,
  rightPressed: boolean,
  mouseX: number | null
): Paddle {
  // Priority: mouse position > keyboard
  if (mouseX !== null) {
    return setPaddlePosition(paddle, mouseX);
  }

  let deltaX = 0;
  if (leftPressed) deltaX -= paddle.speed * deltaTime;
  if (rightPressed) deltaX += paddle.speed * deltaTime;

  if (deltaX !== 0) {
    return movePaddle(paddle, deltaX);
  }

  return paddle;
}

export function setPaddleWidth(paddle: Paddle, width: number): Paddle {
  const gridLeft = CANVAS_CONFIG.gridOffsetX;
  const gridRight = CANVAS_CONFIG.gridOffsetX + GRID_CONFIG.width * GRID_CONFIG.cellSize;

  // Keep paddle centered when changing width
  const centerX = paddle.x + paddle.width / 2;
  const newX = Math.max(
    gridLeft,
    Math.min(gridRight - width, centerX - width / 2)
  );

  return {
    ...paddle,
    x: newX,
    width,
  };
}

export function enlargePaddle(paddle: Paddle, multiplier: number = 1.5): Paddle {
  return setPaddleWidth(paddle, paddle.width * multiplier);
}

export function getPaddleCenter(paddle: Paddle): { x: number; y: number } {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y + paddle.height / 2,
  };
}
