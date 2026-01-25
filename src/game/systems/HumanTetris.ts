import type { HumanTetrisState, Tetromino, GameGrid } from '../../types/game.types';
import {
  rotateTetromino,
  getTetrominoWidth,
  generateTetrominoBag,
} from '../utils/tetrominos';
import {
  canPlaceTetromino,
  placeTetromino,
} from '../entities/Grid';
import { GRID_CONFIG } from '../utils/constants';

// DAS (Delayed Auto Shift) settings
const DAS_DELAY = 170; // ms before auto-repeat starts
const DAS_REPEAT = 50;  // ms between auto-repeats

export function createHumanTetrisState(): HumanTetrisState {
  const bag = generateTetrominoBag();
  const firstPiece = bag[0];

  return {
    currentPiece: firstPiece,
    nextPieces: bag.slice(1),
    currentX: Math.floor((GRID_CONFIG.width - getTetrominoWidth(firstPiece)) / 2),
    currentY: 0,
    dropTimer: 0,
    dropSpeed: 1000,  // 1 second between drops at start
    softDropping: false,
    score: 0,
    linesCompleted: 0,
    lastInput: {
      left: false,
      right: false,
      rotateLeft: false,
      rotateRight: false,
      hardDrop: false,
    },
    dasTimer: 0,
    dasDirection: null,
  };
}

export interface TetrisInput {
  left: boolean;
  right: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  softDrop: boolean;
  hardDrop: boolean;
}

export interface HumanTetrisUpdateResult {
  state: HumanTetrisState;
  grid: GameGrid;
  piecePlaced: boolean;
  linesCleared: number;
}

export function updateHumanTetris(
  state: HumanTetrisState,
  grid: GameGrid,
  input: TetrisInput,
  deltaTime: number,
  level: number
): HumanTetrisUpdateResult {
  if (!state.currentPiece) {
    return { state, grid, piecePlaced: false, linesCleared: 0 };
  }

  // Store current piece in a local variable that TypeScript knows is non-null
  let currentPiece: Tetromino = state.currentPiece;
  let newState = { ...state, lastInput: { ...state.lastInput } };
  let newGrid = grid;
  let piecePlaced = false;
  let linesCleared = 0;

  const deltaMs = deltaTime * 1000;

  // Calculate drop speed based on level
  const baseSpeed = 1000;
  const speedMultiplier = Math.pow(0.9, level - 1);
  newState.dropSpeed = Math.max(100, baseSpeed * speedMultiplier);

  // Detect edge (just pressed) for each input
  const justPressed = {
    left: input.left && !state.lastInput.left,
    right: input.right && !state.lastInput.right,
    rotateLeft: input.rotateLeft && !state.lastInput.rotateLeft,
    rotateRight: input.rotateRight && !state.lastInput.rotateRight,
    hardDrop: input.hardDrop && !state.lastInput.hardDrop,
  };

  // Update last input state
  newState.lastInput = {
    left: input.left,
    right: input.right,
    rotateLeft: input.rotateLeft,
    rotateRight: input.rotateRight,
    hardDrop: input.hardDrop,
  };

  // Handle horizontal movement with DAS (Delayed Auto Shift)
  let shouldMoveLeft = false;
  let shouldMoveRight = false;

  if (justPressed.left) {
    shouldMoveLeft = true;
    newState.dasTimer = 0;
    newState.dasDirection = 'left';
  } else if (justPressed.right) {
    shouldMoveRight = true;
    newState.dasTimer = 0;
    newState.dasDirection = 'right';
  } else if (input.left && newState.dasDirection === 'left') {
    newState.dasTimer += deltaMs;
    if (newState.dasTimer >= DAS_DELAY) {
      // Auto-repeat mode
      const repeatTime = newState.dasTimer - DAS_DELAY;
      if (repeatTime >= DAS_REPEAT) {
        shouldMoveLeft = true;
        newState.dasTimer = DAS_DELAY; // Reset to start of repeat phase
      }
    }
  } else if (input.right && newState.dasDirection === 'right') {
    newState.dasTimer += deltaMs;
    if (newState.dasTimer >= DAS_DELAY) {
      // Auto-repeat mode
      const repeatTime = newState.dasTimer - DAS_DELAY;
      if (repeatTime >= DAS_REPEAT) {
        shouldMoveRight = true;
        newState.dasTimer = DAS_DELAY; // Reset to start of repeat phase
      }
    }
  } else {
    // No direction held or direction changed
    if (!input.left && !input.right) {
      newState.dasTimer = 0;
      newState.dasDirection = null;
    }
  }

  if (shouldMoveLeft) {
    const newX = newState.currentX - 1;
    if (canPlaceTetromino(grid, currentPiece, newX, newState.currentY)) {
      newState.currentX = newX;
    }
  }
  if (shouldMoveRight) {
    const newX = newState.currentX + 1;
    if (canPlaceTetromino(grid, currentPiece, newX, newState.currentY)) {
      newState.currentX = newX;
    }
  }

  // Handle rotation (only on just pressed)
  if (justPressed.rotateRight || justPressed.rotateLeft) {
    const rotated = rotateTetromino(currentPiece, justPressed.rotateRight);
    // Try rotation at current position
    if (canPlaceTetromino(grid, rotated, newState.currentX, newState.currentY)) {
      currentPiece = rotated;
      newState.currentPiece = rotated;
    } else {
      // Wall kick - try shifting left or right
      for (const offset of [-1, 1, -2, 2]) {
        if (canPlaceTetromino(grid, rotated, newState.currentX + offset, newState.currentY)) {
          currentPiece = rotated;
          newState.currentPiece = rotated;
          newState.currentX += offset;
          break;
        }
      }
    }
  }

  // Handle hard drop (only on just pressed)
  if (justPressed.hardDrop) {
    // Find the lowest valid position
    let dropY = newState.currentY;
    while (canPlaceTetromino(grid, currentPiece, newState.currentX, dropY + 1)) {
      dropY++;
    }
    // Add bonus score for hard drop distance
    newState.score += (dropY - newState.currentY) * 2;
    newState.currentY = dropY;

    // Place the piece immediately
    newGrid = placeTetromino(grid, currentPiece, newState.currentX, newState.currentY, level);
    piecePlaced = true;
  } else {
    // Handle soft drop and natural drop
    newState.softDropping = input.softDrop;
    const effectiveDropSpeed = input.softDrop ? newState.dropSpeed / 10 : newState.dropSpeed;

    newState.dropTimer += deltaMs;

    if (newState.dropTimer >= effectiveDropSpeed) {
      newState.dropTimer = 0;

      // Try to move down
      if (canPlaceTetromino(grid, currentPiece, newState.currentX, newState.currentY + 1)) {
        newState.currentY++;
        if (input.softDrop) {
          newState.score += 1;  // Bonus for soft drop
        }
      } else {
        // Can't move down - place the piece
        newGrid = placeTetromino(grid, currentPiece, newState.currentX, newState.currentY, level);
        piecePlaced = true;
      }
    }
  }

  // If piece was placed, get next piece
  if (piecePlaced) {
    const result = getNextPiece(newState);
    newState = result.state;

    // Check for completed lines and clear them
    const lineResult = clearCompletedLines(newGrid);
    newGrid = lineResult.grid;
    linesCleared = lineResult.linesCleared;

    if (linesCleared > 0) {
      newState.linesCompleted += linesCleared;
      // Scoring based on lines cleared
      const lineScores = [0, 100, 300, 500, 800];
      newState.score += lineScores[Math.min(linesCleared, 4)] * level;
    }
  }

  return {
    state: newState,
    grid: newGrid,
    piecePlaced,
    linesCleared,
  };
}

function getNextPiece(state: HumanTetrisState): { state: HumanTetrisState } {
  let nextPieces = [...state.nextPieces];

  // If running low on pieces, generate more
  if (nextPieces.length < 4) {
    nextPieces = [...nextPieces, ...generateTetrominoBag()];
  }

  const nextPiece = nextPieces[0];

  return {
    state: {
      ...state,
      currentPiece: nextPiece,
      nextPieces: nextPieces.slice(1),
      currentX: Math.floor((GRID_CONFIG.width - getTetrominoWidth(nextPiece)) / 2),
      currentY: 0,
      dropTimer: 0,
      // Reset DAS when getting new piece
      dasTimer: 0,
      dasDirection: null,
    },
  };
}

function clearCompletedLines(grid: GameGrid): { grid: GameGrid; linesCleared: number } {
  const newBlocks = [...grid.blocks.map(row => [...row])];
  const completedLines: number[] = [];

  // Find completed lines (excluding danger zone)
  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    let isComplete = true;
    for (let x = 0; x < grid.config.width; x++) {
      if (!newBlocks[y][x]) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      completedLines.push(y);
    }
  }

  if (completedLines.length === 0) {
    return { grid, linesCleared: 0 };
  }

  // Remove completed lines
  for (const lineY of completedLines) {
    newBlocks[lineY] = new Array(grid.config.width).fill(null);
  }

  // Apply gravity - move blocks down to fill gaps
  for (let x = 0; x < grid.config.width; x++) {
    let writeY = grid.config.height - grid.config.dangerZone - 1;
    for (let y = grid.config.height - grid.config.dangerZone - 1; y >= 0; y--) {
      if (newBlocks[y][x]) {
        if (y !== writeY) {
          newBlocks[writeY][x] = newBlocks[y][x];
          newBlocks[y][x] = null;
        }
        writeY--;
      }
    }
  }

  return {
    grid: { ...grid, blocks: newBlocks },
    linesCleared: completedLines.length,
  };
}

export function canSpawnPiece(grid: GameGrid, piece: Tetromino): boolean {
  const spawnX = Math.floor((grid.config.width - getTetrominoWidth(piece)) / 2);
  return canPlaceTetromino(grid, piece, spawnX, 0);
}

export function getGhostPieceY(
  grid: GameGrid,
  piece: Tetromino,
  currentX: number,
  currentY: number
): number {
  let ghostY = currentY;
  while (canPlaceTetromino(grid, piece, currentX, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}
