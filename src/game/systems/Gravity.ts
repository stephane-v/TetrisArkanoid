import type { GameGrid } from '../../types/game.types';
import { applyGravity as gridApplyGravity, dropAllBlocks } from '../entities/Grid';

// Re-export gravity functions for consistency
export function applyGravity(grid: GameGrid): GameGrid {
  return gridApplyGravity(grid);
}

export function applyPenaltyDrop(grid: GameGrid, lines: number): GameGrid {
  let currentGrid = grid;

  for (let i = 0; i < lines; i++) {
    currentGrid = dropAllBlocks(currentGrid, 1);
  }

  return currentGrid;
}
