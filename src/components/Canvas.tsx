import React, { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CANVAS_CONFIG, GRID_CONFIG, COLORS, POWERUP_CONFIG } from '../game/utils/constants';
import { gridToCanvas } from '../game/utils/collision';
import { getBlockDamageColor } from '../game/entities/Block';
import { getTetrominoBlocks } from '../game/utils/tetrominos';
import { getPowerUpColor, getPowerUpIcon } from '../game/systems/PowerUps';
import type { GameGrid, RobotState, PowerUp, Paddle, Ball, Particle } from '../types/game.types';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const Canvas: React.FC<CanvasProps> = ({ canvasRef }) => {
  const gameState = useGameStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    // Draw grid background
    drawGridBackground(ctx);

    // Draw danger zone
    drawDangerZone(ctx);

    // Draw blocks
    drawBlocks(ctx, gameState.grid);

    // Draw robot's current placement (ghost piece)
    if (gameState.robot.targetPlacement && !gameState.robot.isThinking) {
      drawGhostPiece(ctx, gameState.robot);
    }

    // Draw robot's thinking indicator
    if (gameState.robot.isThinking && gameState.robot.currentPiece) {
      drawThinkingPiece(ctx, gameState.robot);
    }

    // Draw power-ups
    drawPowerUps(ctx, gameState.powerUps);

    // Draw paddle
    drawPaddle(ctx, gameState.paddle);

    // Draw balls
    gameState.balls.forEach((ball) => {
      drawBall(ctx, ball);
    });

    // Draw particles
    drawParticles(ctx, gameState.particles);

    // Draw launch indicator if ball not launched
    if (!gameState.ballLaunched && gameState.balls.length > 0) {
      drawLaunchIndicator(ctx, gameState.balls[0]);
    }
  }, [canvasRef, gameState]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_CONFIG.width}
      height={CANVAS_CONFIG.height}
      className="block touch-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

function drawGridBackground(ctx: CanvasRenderingContext2D) {
  const { gridOffsetX, gridOffsetY } = CANVAS_CONFIG;
  const { width, height, dangerZone, cellSize } = GRID_CONFIG;

  // Grid border
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    gridOffsetX - 1,
    gridOffsetY - 1,
    width * cellSize + 2,
    (height - dangerZone) * cellSize + 2
  );

  // Grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  for (let x = 0; x <= width; x++) {
    ctx.beginPath();
    ctx.moveTo(gridOffsetX + x * cellSize, gridOffsetY);
    ctx.lineTo(gridOffsetX + x * cellSize, gridOffsetY + (height - dangerZone) * cellSize);
    ctx.stroke();
  }

  for (let y = 0; y <= height - dangerZone; y++) {
    ctx.beginPath();
    ctx.moveTo(gridOffsetX, gridOffsetY + y * cellSize);
    ctx.lineTo(gridOffsetX + width * cellSize, gridOffsetY + y * cellSize);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawDangerZone(ctx: CanvasRenderingContext2D) {
  const { gridOffsetX, gridOffsetY } = CANVAS_CONFIG;
  const { width, height, dangerZone, cellSize } = GRID_CONFIG;

  const dangerY = gridOffsetY + (height - dangerZone) * cellSize;

  // Danger zone background
  ctx.fillStyle = COLORS.dangerZone;
  ctx.fillRect(gridOffsetX, dangerY, width * cellSize, dangerZone * cellSize);

  // Danger zone border
  ctx.strokeStyle = COLORS.dangerZoneBorder;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(gridOffsetX, dangerY);
  ctx.lineTo(gridOffsetX + width * cellSize, dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBlocks(ctx: CanvasRenderingContext2D, grid: GameGrid) {
  const { cellSize } = GRID_CONFIG;

  for (let y = 0; y < grid.config.height; y++) {
    for (let x = 0; x < grid.config.width; x++) {
      const block = grid.blocks[y]?.[x];
      if (!block) continue;

      const canvasPos = gridToCanvas(x, y);
      const padding = 1;

      // Block color (with damage effect)
      const color = getBlockDamageColor(block);
      ctx.fillStyle = color;
      ctx.fillRect(
        canvasPos.x + padding,
        canvasPos.y + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );

      // Warning effect for blocks in almost-complete lines
      if (block.isWarning) {
        ctx.strokeStyle = COLORS.critical;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          canvasPos.x + padding,
          canvasPos.y + padding,
          cellSize - padding * 2,
          cellSize - padding * 2
        );

        // Pulsing effect
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
        ctx.fillRect(
          canvasPos.x + padding,
          canvasPos.y + padding,
          cellSize - padding * 2,
          cellSize - padding * 2
        );
      } else if (block.isPartOfLine) {
        ctx.strokeStyle = COLORS.warning;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          canvasPos.x + padding,
          canvasPos.y + padding,
          cellSize - padding * 2,
          cellSize - padding * 2
        );
      }

      // Health indicator for reinforced blocks
      if (block.maxHealth > 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          block.health.toString(),
          canvasPos.x + cellSize / 2,
          canvasPos.y + cellSize / 2
        );
      }

      // Highlight effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvasPos.x + padding, canvasPos.y + cellSize - padding);
      ctx.lineTo(canvasPos.x + padding, canvasPos.y + padding);
      ctx.lineTo(canvasPos.x + cellSize - padding, canvasPos.y + padding);
      ctx.stroke();
    }
  }
}

function drawGhostPiece(ctx: CanvasRenderingContext2D, robot: RobotState) {
  if (!robot.targetPlacement) return;

  const { tetromino, targetX, targetY } = robot.targetPlacement;
  const blocks = getTetrominoBlocks(tetromino, targetX, targetY);
  const { cellSize } = GRID_CONFIG;
  const progress = robot.placementProgress;

  // Animate from top
  const startY = -2;
  const currentY = startY + (targetY - startY) * progress;

  ctx.globalAlpha = 0.6;

  for (const block of blocks) {
    const canvasPos = gridToCanvas(block.x, currentY + (block.y - targetY));

    ctx.fillStyle = tetromino.color;
    ctx.fillRect(canvasPos.x + 2, canvasPos.y + 2, cellSize - 4, cellSize - 4);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasPos.x + 2, canvasPos.y + 2, cellSize - 4, cellSize - 4);
  }

  ctx.globalAlpha = 1;
}

function drawThinkingPiece(ctx: CanvasRenderingContext2D, robot: RobotState) {
  if (!robot.currentPiece) return;

  // Draw next piece preview at top
  const previewX = CANVAS_CONFIG.width - 80;
  const previewY = 60;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(previewX - 10, previewY - 30, 70, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', previewX + 25, previewY - 15);

  // Draw the piece
  const blocks = getTetrominoBlocks(robot.currentPiece, 0, 0);
  const pieceSize = 16;

  for (const block of blocks) {
    ctx.fillStyle = robot.currentPiece.color;
    ctx.fillRect(
      previewX + block.x * pieceSize,
      previewY + block.y * pieceSize,
      pieceSize - 2,
      pieceSize - 2
    );
  }

  // Thinking indicator
  const thinkProgress = 1 - robot.thinkingTimeRemaining / robot.config.thinkingTime;
  ctx.fillStyle = '#333';
  ctx.fillRect(previewX - 5, previewY + 50, 60, 8);
  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(previewX - 5, previewY + 50, 60 * thinkProgress, 8);
}

function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: PowerUp[]) {
  const size = POWERUP_CONFIG.size;

  for (const powerUp of powerUps) {
    const color = getPowerUpColor(powerUp.type);
    const icon = getPowerUpIcon(powerUp.type);

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Power-up background
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Icon
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, powerUp.x, powerUp.y);
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle) {
  // Glow effect
  ctx.shadowColor = COLORS.paddle;
  ctx.shadowBlur = 10;

  // Main paddle
  ctx.fillStyle = COLORS.paddle;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 4);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddle.x + 4, paddle.y + 2);
  ctx.lineTo(paddle.x + paddle.width - 4, paddle.y + 2);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  // Glow effect
  ctx.shadowColor = ball.color;
  ctx.shadowBlur = ball.isPowered ? 20 : 10;

  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLaunchIndicator(ctx: CanvasRenderingContext2D, ball: Ball) {
  const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SPACE or CLICK to launch', ball.x, ball.y - 30);
  ctx.globalAlpha = 1;
}
