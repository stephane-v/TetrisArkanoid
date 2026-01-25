import type { Block, GameGrid, Tetromino } from '../../types/game.types';
import { GRID_CONFIG, getDifficultyConfig } from '../utils/constants';
import { getTetrominoBlocks } from '../utils/tetrominos';

export function createEmptyGrid(): GameGrid {
  const blocks: (Block | null)[][] = [];

  for (let y = 0; y < GRID_CONFIG.height; y++) {
    blocks[y] = [];
    for (let x = 0; x < GRID_CONFIG.width; x++) {
      blocks[y][x] = null;
    }
  }

  return {
    config: { ...GRID_CONFIG },
    blocks,
  };
}

export function createBlock(color: string, health = 1): Block {
  return {
    exists: true,
    color,
    health,
    maxHealth: health,
    isPartOfLine: false,
    isWarning: false,
  };
}

export function canPlaceTetromino(
  grid: GameGrid,
  tetromino: Tetromino,
  x: number,
  y: number
): boolean {
  const blocks = getTetrominoBlocks(tetromino, x, y);

  for (const block of blocks) {
    // Check bounds
    if (
      block.x < 0 ||
      block.x >= grid.config.width ||
      block.y < 0 ||
      block.y >= grid.config.height - grid.config.dangerZone
    ) {
      return false;
    }

    // Check collision with existing blocks
    if (grid.blocks[block.y]?.[block.x]) {
      return false;
    }
  }

  return true;
}

export function placeTetromino(
  grid: GameGrid,
  tetromino: Tetromino,
  x: number,
  y: number,
  level: number
): GameGrid {
  const blocks = getTetrominoBlocks(tetromino, x, y);
  const newBlocks = grid.blocks.map(row => [...row]);
  const difficultyConfig = getDifficultyConfig(level);

  for (const block of blocks) {
    if (
      block.y >= 0 &&
      block.y < grid.config.height &&
      block.x >= 0 &&
      block.x < grid.config.width
    ) {
      newBlocks[block.y][block.x] = createBlock(tetromino.color, difficultyConfig.blockHealth);
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function findLowestPlacement(
  grid: GameGrid,
  tetromino: Tetromino,
  x: number
): number {
  // Start from top and find the lowest valid position
  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    if (!canPlaceTetromino(grid, tetromino, x, y + 1)) {
      return y;
    }
  }
  return grid.config.height - grid.config.dangerZone - 1;
}

export function countFilledBlocks(grid: GameGrid, row: number): number {
  if (row < 0 || row >= grid.config.height) return 0;

  let count = 0;
  for (let x = 0; x < grid.config.width; x++) {
    if (grid.blocks[row]?.[x]) {
      count++;
    }
  }
  return count;
}

export function isLineComplete(grid: GameGrid, row: number): boolean {
  return countFilledBlocks(grid, row) === grid.config.width;
}

export function findCompletedLines(grid: GameGrid): number[] {
  const completedLines: number[] = [];

  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    if (isLineComplete(grid, y)) {
      completedLines.push(y);
    }
  }

  return completedLines;
}

export function removeLines(grid: GameGrid, lines: number[]): GameGrid {
  if (lines.length === 0) return grid;

  const sortedLines = [...lines].sort((a, b) => a - b);
  const newBlocks = grid.blocks.map(row => [...row]);

  // Remove the lines (set to null)
  for (const lineIndex of sortedLines) {
    for (let x = 0; x < grid.config.width; x++) {
      newBlocks[lineIndex][x] = null;
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function applyGravity(grid: GameGrid): GameGrid {
  const newBlocks: (Block | null)[][] = [];

  // Initialize with null
  for (let y = 0; y < grid.config.height; y++) {
    newBlocks[y] = new Array(grid.config.width).fill(null);
  }

  // Process each column - blocks fall to fill gaps but stay above danger zone
  for (let x = 0; x < grid.config.width; x++) {
    let writeY = grid.config.height - grid.config.dangerZone - 1;

    // Scan from bottom to top (excluding danger zone)
    for (let y = grid.config.height - grid.config.dangerZone - 1; y >= 0; y--) {
      if (grid.blocks[y]?.[x]) {
        newBlocks[writeY][x] = grid.blocks[y][x];
        writeY--;
      }
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

// Apply gravity that allows blocks to fall into danger zone (used for penalty)
export function applyGravityIntoDangerZone(grid: GameGrid): GameGrid {
  const newBlocks: (Block | null)[][] = [];

  // Initialize with null
  for (let y = 0; y < grid.config.height; y++) {
    newBlocks[y] = new Array(grid.config.width).fill(null);
  }

  // Process each column - blocks can fall all the way to the bottom
  for (let x = 0; x < grid.config.width; x++) {
    let writeY = grid.config.height - 1;

    // Scan from bottom to top (including danger zone)
    for (let y = grid.config.height - 1; y >= 0; y--) {
      if (grid.blocks[y]?.[x]) {
        newBlocks[writeY][x] = grid.blocks[y][x];
        writeY--;
      }
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function dropAllBlocks(grid: GameGrid, amount = 1): GameGrid {
  const newBlocks: (Block | null)[][] = [];

  // Initialize with null
  for (let y = 0; y < grid.config.height; y++) {
    newBlocks[y] = new Array(grid.config.width).fill(null);
  }

  // Drop all blocks down by the specified amount
  for (let y = 0; y < grid.config.height - amount; y++) {
    for (let x = 0; x < grid.config.width; x++) {
      if (grid.blocks[y]?.[x]) {
        newBlocks[y + amount][x] = grid.blocks[y][x];
      }
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function hasBlocksInDangerZone(grid: GameGrid): boolean {
  for (let y = grid.config.height - grid.config.dangerZone; y < grid.config.height; y++) {
    for (let x = 0; x < grid.config.width; x++) {
      if (grid.blocks[y]?.[x]) {
        return true;
      }
    }
  }
  return false;
}

export function updateLineWarnings(grid: GameGrid): GameGrid {
  const newBlocks = grid.blocks.map(row =>
    row.map(block => (block ? { ...block, isWarning: false, isPartOfLine: false } : null))
  );

  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    const filledCount = countFilledBlocks(grid, y);

    if (filledCount >= 8) {
      // Critical warning - 8 or 9 out of 10
      for (let x = 0; x < grid.config.width; x++) {
        if (newBlocks[y][x]) {
          newBlocks[y][x] = {
            ...newBlocks[y][x]!,
            isWarning: true,
            isPartOfLine: true,
          };
        }
      }
    } else if (filledCount >= 6) {
      // Warning - 6 or 7 out of 10
      for (let x = 0; x < grid.config.width; x++) {
        if (newBlocks[y][x]) {
          newBlocks[y][x] = {
            ...newBlocks[y][x]!,
            isPartOfLine: true,
          };
        }
      }
    }
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function destroyBlock(grid: GameGrid, gridX: number, gridY: number): GameGrid {
  if (gridX < 0 || gridX >= grid.config.width || gridY < 0 || gridY >= grid.config.height) {
    return grid;
  }

  const newBlocks = grid.blocks.map(row => [...row]);
  newBlocks[gridY][gridX] = null;

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function damageBlock(
  grid: GameGrid,
  gridX: number,
  gridY: number,
  damage: number
): { grid: GameGrid; destroyed: boolean; wasReinforced: boolean } {
  const block = grid.blocks[gridY]?.[gridX];

  if (!block) {
    return { grid, destroyed: false, wasReinforced: false };
  }

  const wasReinforced = block.maxHealth > 1;
  const newHealth = block.health - damage;

  if (newHealth <= 0) {
    return {
      grid: destroyBlock(grid, gridX, gridY),
      destroyed: true,
      wasReinforced,
    };
  }

  const newBlocks = grid.blocks.map(row => [...row]);
  newBlocks[gridY][gridX] = {
    ...block,
    health: newHealth,
  };

  return {
    grid: { ...grid, blocks: newBlocks },
    destroyed: false,
    wasReinforced,
  };
}

export function destroyRandomLine(grid: GameGrid): GameGrid {
  // Find all rows that have at least one block
  const rowsWithBlocks: number[] = [];
  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    if (countFilledBlocks(grid, y) > 0) {
      rowsWithBlocks.push(y);
    }
  }

  if (rowsWithBlocks.length === 0) return grid;

  // Pick a random row to destroy
  const targetRow = rowsWithBlocks[Math.floor(Math.random() * rowsWithBlocks.length)];

  const newBlocks = grid.blocks.map(row => [...row]);
  for (let x = 0; x < grid.config.width; x++) {
    newBlocks[targetRow][x] = null;
  }

  return {
    ...grid,
    blocks: newBlocks,
  };
}

export function getStackHeight(grid: GameGrid): number {
  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    for (let x = 0; x < grid.config.width; x++) {
      if (grid.blocks[y]?.[x]) {
        return grid.config.height - grid.config.dangerZone - y;
      }
    }
  }
  return 0;
}

export function countHoles(grid: GameGrid): number {
  let holes = 0;

  for (let x = 0; x < grid.config.width; x++) {
    let foundBlock = false;

    for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
      if (grid.blocks[y]?.[x]) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }

  return holes;
}
