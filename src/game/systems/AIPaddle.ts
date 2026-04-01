import type { AIPaddleState, Ball, Paddle, GameGrid } from '../../types/game.types';
import { CANVAS_CONFIG } from '../utils/constants';

export function createAIPaddleState(level: number): AIPaddleState {
  // AI gets better with level
  const baseAccuracy = 0.7;
  const baseReactionTime = 200; // ms
  const basePrediction = 0.5;

  return {
    targetX: CANVAS_CONFIG.width / 2,
    reactionTime: Math.max(50, baseReactionTime - level * 10),
    accuracy: Math.min(0.98, baseAccuracy + level * 0.02),
    predictionSkill: Math.min(0.95, basePrediction + level * 0.03),
  };
}

export interface AIPaddleUpdateResult {
  state: AIPaddleState;
  paddle: Paddle;
}

export function updateAIPaddle(
  state: AIPaddleState,
  paddle: Paddle,
  balls: Ball[],
  grid: GameGrid,
  deltaTime: number
): AIPaddleUpdateResult {
  if (balls.length === 0) {
    return { state, paddle };
  }

  // Find the most threatening ball (closest to paddle, moving down)
  let targetBall: Ball | null = null;
  let closestDistance = Infinity;

  for (const ball of balls) {
    if (ball.vy > 0) { // Ball moving toward paddle
      const distance = paddle.y - ball.y;
      if (distance > 0 && distance < closestDistance) {
        closestDistance = distance;
        targetBall = ball;
      }
    }
  }

  // If no ball moving toward paddle, track the fastest ball
  if (!targetBall && balls.length > 0) {
    targetBall = balls.reduce((fastest, ball) =>
      Math.abs(ball.vy) > Math.abs(fastest.vy) ? ball : fastest
    , balls[0]);
  }

  if (!targetBall) {
    return { state, paddle };
  }

  // Calculate where the ball will be when it reaches paddle height
  let predictedX = targetBall.x;

  if (state.predictionSkill > 0 && targetBall.vy > 0) {
    const timeToReach = (paddle.y - targetBall.y) / targetBall.vy;

    if (timeToReach > 0) {
      // Simple prediction - linear trajectory with wall bounces
      predictedX = predictBallPosition(
        targetBall,
        grid,
        timeToReach,
        state.predictionSkill
      );
    }
  }

  // Add some inaccuracy based on AI skill
  const inaccuracy = (1 - state.accuracy) * 50;
  const noise = (Math.random() - 0.5) * inaccuracy;
  predictedX += noise;

  // Smooth movement toward target (simulates reaction time)
  const reactionFactor = Math.min(1, (deltaTime * 1000) / state.reactionTime);
  const newTargetX = state.targetX + (predictedX - state.targetX) * reactionFactor;

  // Move paddle toward target
  const paddleCenterX = paddle.x + paddle.width / 2;
  const diff = newTargetX - paddleCenterX;
  const moveSpeed = paddle.speed * deltaTime;

  let newPaddleX = paddle.x;
  if (Math.abs(diff) > 5) {
    if (diff > 0) {
      newPaddleX = Math.min(paddle.x + moveSpeed, CANVAS_CONFIG.width - paddle.width);
    } else {
      newPaddleX = Math.max(paddle.x - moveSpeed, 0);
    }
  }

  return {
    state: { ...state, targetX: newTargetX },
    paddle: { ...paddle, x: newPaddleX },
  };
}

function predictBallPosition(
  ball: Ball,
  grid: GameGrid,
  timeToReach: number,
  skill: number
): number {
  // Simulate ball trajectory
  let x = ball.x;
  let vx = ball.vx;
  const steps = Math.min(50, Math.floor(timeToReach * 60)); // 60 fps simulation
  const dt = timeToReach / steps;

  const gridRight = grid.config.width * grid.config.cellSize;

  for (let i = 0; i < steps; i++) {
    x += vx * dt * 60; // Multiply by 60 to match frame rate

    // Wall bounces
    if (x < ball.radius) {
      x = ball.radius;
      vx = -vx;
    } else if (x > gridRight - ball.radius) {
      x = gridRight - ball.radius;
      vx = -vx;
    }
  }

  // Add uncertainty based on skill
  const uncertainty = (1 - skill) * (CANVAS_CONFIG.width / 4);
  return x + (Math.random() - 0.5) * uncertainty;
}

// Helper to get AI paddle position for rendering
export function getAIPaddleTargetX(state: AIPaddleState): number {
  return state.targetX;
}
