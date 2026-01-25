import type { GameGrid } from '../../types/game.types';
import {
  findCompletedLines,
  removeLines,
  dropAllBlocks,
  applyGravity,
  updateLineWarnings,
  hasBlocksInDangerZone,
  countFilledBlocks,
} from '../entities/Grid';

export interface LineCompletionResult {
  grid: GameGrid;
  linesCompleted: number;
  blocksInDangerZone: boolean;
}

export function processLineCompletion(
  grid: GameGrid,
  hasShield: boolean
): LineCompletionResult {
  // Find completed lines
  const completedLines = findCompletedLines(grid);

  if (completedLines.length === 0) {
    return {
      grid: updateLineWarnings(grid),
      linesCompleted: 0,
      blocksInDangerZone: hasBlocksInDangerZone(grid),
    };
  }

  // Remove completed lines
  let newGrid = removeLines(grid, completedLines);

  // If player has shield, don't apply gravity penalty
  if (!hasShield) {
    // Apply gravity penalty - all blocks drop down by number of lines completed
    for (let i = 0; i < completedLines.length; i++) {
      newGrid = dropAllBlocks(newGrid, 1);
    }
  }

  // Apply normal gravity to fill gaps
  newGrid = applyGravity(newGrid);

  // Update warning states
  newGrid = updateLineWarnings(newGrid);

  return {
    grid: newGrid,
    linesCompleted: completedLines.length,
    blocksInDangerZone: hasBlocksInDangerZone(newGrid),
  };
}

export interface LineWarningInfo {
  row: number;
  filledCount: number;
  isCritical: boolean;
}

export function getLineWarnings(grid: GameGrid): LineWarningInfo[] {
  const warnings: LineWarningInfo[] = [];

  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    const filledCount = countFilledBlocks(grid, y);

    if (filledCount >= 6) {
      warnings.push({
        row: y,
        filledCount,
        isCritical: filledCount >= 8,
      });
    }
  }

  return warnings;
}

export function checkLinePrevention(
  oldGrid: GameGrid,
  newGrid: GameGrid
): number {
  // Check if player destroyed a block that prevented a line from completing
  let linesPrevented = 0;

  for (let y = 0; y < oldGrid.config.height - oldGrid.config.dangerZone; y++) {
    const oldCount = countFilledBlocks(oldGrid, y);
    const newCount = countFilledBlocks(newGrid, y);

    // If a row went from 9 to less than 9, player prevented a line
    if (oldCount === 9 && newCount < 9) {
      linesPrevented++;
    }
  }

  return linesPrevented;
}
