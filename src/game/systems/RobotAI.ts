import type {
  GameGrid,
  Tetromino,
  PlacementDecision,
  RobotConfig,
  RobotState,
} from '../../types/game.types';
import {
  rotateTetromino,
  getTetrominoWidth,
  getTetrominoBlocks,
  generateTetrominoBag,
} from '../utils/tetrominos';
import {
  canPlaceTetromino,
  placeTetromino,
  findLowestPlacement,
  countFilledBlocks,
  countHoles,
  getStackHeight,
} from '../entities/Grid';
import { getDifficultyConfig } from '../utils/constants';

export function createRobotState(level: number): RobotState {
  const config = getRobotConfig(level);
  const bag = generateTetrominoBag();

  return {
    config,
    currentPiece: bag[0],
    nextPieces: bag.slice(1),
    targetPlacement: null,
    placementProgress: 0,
    score: 0,
    linesCompleted: 0,
    isThinking: true,
    isFrozen: false,
    thinkingTimeRemaining: config.thinkingTime,
  };
}

export function getRobotConfig(level: number): RobotConfig {
  const diffConfig = getDifficultyConfig(level);

  return {
    level,
    thinkingTime: diffConfig.robotThinkTime,
    placementSkill: diffConfig.robotSkill,
    aggressiveness: Math.min(0.3 + level * 0.03, 0.8),
    previewPieces: Math.min(1 + Math.floor(level / 5), 4),
  };
}

export function updateRobot(
  robotState: RobotState,
  grid: GameGrid,
  deltaTime: number,
  level: number
): RobotState {
  if (robotState.isFrozen) {
    return robotState;
  }

  let state = { ...robotState };

  // Update config if level changed
  if (state.config.level !== level) {
    state.config = getRobotConfig(level);
  }

  // If no current piece, get next one
  if (!state.currentPiece) {
    state = getNextPiece(state);
  }

  // Thinking phase
  if (state.isThinking) {
    state.thinkingTimeRemaining -= deltaTime * 1000;

    if (state.thinkingTimeRemaining <= 0) {
      // Done thinking, calculate placement
      if (state.currentPiece) {
        state.targetPlacement = calculateBestMove(
          grid,
          state.currentPiece,
          state.config.placementSkill,
          state.config.aggressiveness
        );
      }
      state.isThinking = false;
      state.placementProgress = 0;
    }

    return state;
  }

  // Placement animation phase
  if (state.targetPlacement) {
    // Animate placement (1 second to fully place)
    const placementSpeed = 1000 / Math.max(state.config.thinkingTime / 2, 300);
    state.placementProgress += deltaTime * placementSpeed;

    if (state.placementProgress >= 1) {
      // Piece fully placed
      state.placementProgress = 1;
    }
  }

  return state;
}

export function commitPlacement(
  robotState: RobotState,
  grid: GameGrid,
  level: number
): { robotState: RobotState; grid: GameGrid } {
  if (!robotState.targetPlacement || robotState.placementProgress < 1) {
    return { robotState, grid };
  }

  const { targetX, targetY, tetromino } = robotState.targetPlacement;

  // Place the piece
  const newGrid = placeTetromino(grid, tetromino, targetX, targetY, level);

  // Get next piece
  let newState = getNextPiece(robotState);
  newState = {
    ...newState,
    targetPlacement: null,
    placementProgress: 0,
    isThinking: true,
    thinkingTimeRemaining: newState.config.thinkingTime,
  };

  return { robotState: newState, grid: newGrid };
}

function getNextPiece(state: RobotState): RobotState {
  if (state.nextPieces.length === 0) {
    const newBag = generateTetrominoBag();
    return {
      ...state,
      currentPiece: newBag[0],
      nextPieces: newBag.slice(1),
    };
  }

  return {
    ...state,
    currentPiece: state.nextPieces[0],
    nextPieces: state.nextPieces.slice(1),
  };
}

interface PlacementOption {
  x: number;
  y: number;
  rotation: number;
  tetromino: Tetromino;
  score: number;
}

export function calculateBestMove(
  grid: GameGrid,
  tetromino: Tetromino,
  skill: number,
  aggressiveness: number
): PlacementDecision {
  const options: PlacementOption[] = [];

  // Try all rotations
  let rotatedPiece = tetromino;
  for (let rotation = 0; rotation < 4; rotation++) {
    if (rotation > 0) {
      rotatedPiece = rotateTetromino(rotatedPiece);
    }

    const pieceWidth = getTetrominoWidth(rotatedPiece);

    // Try all horizontal positions
    for (let x = 0; x <= grid.config.width - pieceWidth; x++) {
      // Find lowest valid position
      const y = findLowestPlacement(grid, rotatedPiece, x);

      if (canPlaceTetromino(grid, rotatedPiece, x, y)) {
        const score = evaluatePlacement(grid, rotatedPiece, x, y, aggressiveness);
        options.push({
          x,
          y,
          rotation,
          tetromino: rotatedPiece,
          score,
        });
      }
    }
  }

  if (options.length === 0) {
    // No valid placements, just return center
    return {
      tetromino,
      targetX: Math.floor((grid.config.width - getTetrominoWidth(tetromino)) / 2),
      targetY: 0,
      rotation: 0,
    };
  }

  // Sort by score (highest first)
  options.sort((a, b) => b.score - a.score);

  // Based on skill, choose from top options
  // skill = 1.0 -> always best
  // skill = 0.0 -> random from all options
  const choiceRange = Math.max(1, Math.floor(options.length * (1 - skill)));
  const choiceIndex = Math.floor(Math.random() * choiceRange);
  const chosen = options[choiceIndex];

  return {
    tetromino: chosen.tetromino,
    targetX: chosen.x,
    targetY: chosen.y,
    rotation: chosen.rotation,
  };
}

function evaluatePlacement(
  grid: GameGrid,
  tetromino: Tetromino,
  x: number,
  y: number,
  aggressiveness: number
): number {
  // Simulate placing the piece
  const simulatedGrid = placeTetromino(grid, tetromino, x, y, 1);

  let score = 0;

  // Count completed lines (big reward)
  const completedLines = countCompletedLines(simulatedGrid);
  score += completedLines * 1000 * aggressiveness;

  // Penalize holes
  const holes = countHoles(simulatedGrid);
  const originalHoles = countHoles(grid);
  score -= (holes - originalHoles) * 500;

  // Penalize height
  const height = getStackHeight(simulatedGrid);
  score -= height * 10;

  // Reward placing near edges (harder for player to reach)
  const centerDistance = Math.abs(x + getTetrominoWidth(tetromino) / 2 - grid.config.width / 2);
  score += centerDistance * 20;

  // Bonus for completing lines that are already mostly filled
  for (let row = 0; row < grid.config.height - grid.config.dangerZone; row++) {
    const filled = countFilledBlocks(grid, row);
    if (filled >= 7 && filled < 10) {
      // Check if this placement helps complete this row
      const blocks = getTetrominoBlocks(tetromino, x, y);
      for (const block of blocks) {
        if (block.y === row) {
          score += 300 * aggressiveness;
        }
      }
    }
  }

  // Penalize bumpiness (height differences between columns)
  const bumpiness = calculateBumpiness(simulatedGrid);
  score -= bumpiness * 15;

  return score;
}

function countCompletedLines(grid: GameGrid): number {
  let count = 0;
  for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
    if (countFilledBlocks(grid, y) === grid.config.width) {
      count++;
    }
  }
  return count;
}

function calculateBumpiness(grid: GameGrid): number {
  const heights: number[] = [];

  // Calculate height of each column
  for (let x = 0; x < grid.config.width; x++) {
    let height = 0;
    for (let y = 0; y < grid.config.height - grid.config.dangerZone; y++) {
      if (grid.blocks[y]?.[x]) {
        height = grid.config.height - grid.config.dangerZone - y;
        break;
      }
    }
    heights.push(height);
  }

  // Sum of absolute differences between adjacent columns
  let bumpiness = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  return bumpiness;
}

export function freezeRobot(state: RobotState): RobotState {
  return { ...state, isFrozen: true };
}

export function unfreezeRobot(state: RobotState): RobotState {
  return { ...state, isFrozen: false };
}

export function addRobotScore(state: RobotState, points: number): RobotState {
  return { ...state, score: state.score + points };
}

export function incrementRobotLines(state: RobotState, count: number): RobotState {
  return {
    ...state,
    linesCompleted: state.linesCompleted + count,
    score: state.score + count * 100,
  };
}
