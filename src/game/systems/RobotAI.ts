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
        // Pass next piece for look-ahead if available
        const nextPiece = state.nextPieces.length > 0 ? state.nextPieces[0] : undefined;
        state.targetPlacement = calculateBestMove(
          grid,
          state.currentPiece,
          state.config.placementSkill,
          state.config.aggressiveness,
          nextPiece
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

// Weights for evaluation - adjusted based on skill level
interface EvaluationWeights {
  linesClear: number;
  holes: number;
  height: number;
  bumpiness: number;
  edgeBonus: number;
  wellBonus: number;
  blockade: number;
  flatness: number;
  rowTransitions: number;
  columnTransitions: number;
}

function getEvaluationWeights(skill: number, aggressiveness: number): EvaluationWeights {
  // Higher skill = better weights
  return {
    linesClear: 1000 * aggressiveness * (1 + skill),
    holes: -500 * (0.5 + skill * 0.5),
    height: -10 * (0.3 + skill * 0.7),
    bumpiness: -15 * (0.5 + skill * 0.5),
    edgeBonus: 25 * aggressiveness,
    wellBonus: 150 * skill,
    blockade: -300 * skill,
    flatness: 50 * skill,
    rowTransitions: -10 * skill,
    columnTransitions: -15 * skill,
  };
}

export function calculateBestMove(
  grid: GameGrid,
  tetromino: Tetromino,
  skill: number,
  aggressiveness: number,
  nextPiece?: Tetromino
): PlacementDecision {
  const options: PlacementOption[] = [];
  const weights = getEvaluationWeights(skill, aggressiveness);
  const currentHeight = getStackHeight(grid);

  // Adjust strategy based on stack height
  const isInDanger = currentHeight > grid.config.height - grid.config.dangerZone - 5;
  const adjustedWeights = isInDanger
    ? { ...weights, linesClear: weights.linesClear * 2, height: weights.height * 2 }
    : weights;

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
        let score = evaluatePlacement(grid, rotatedPiece, x, y, adjustedWeights);

        // Look-ahead: if skill is high enough, consider next piece
        if (skill > 0.6 && nextPiece) {
          const simulatedGrid = placeTetromino(grid, rotatedPiece, x, y, 1);
          const nextBestScore = findBestScoreForPiece(simulatedGrid, nextPiece, adjustedWeights);
          score += nextBestScore * 0.3 * skill; // Weight future moves less
        }

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
  const choiceRange = Math.max(1, Math.floor(options.length * (1 - skill * skill))); // Quadratic for sharper skill curve
  const choiceIndex = Math.floor(Math.random() * choiceRange);
  const chosen = options[choiceIndex];

  return {
    tetromino: chosen.tetromino,
    targetX: chosen.x,
    targetY: chosen.y,
    rotation: chosen.rotation,
  };
}

// Find the best score for a piece without returning the full option
function findBestScoreForPiece(grid: GameGrid, tetromino: Tetromino, weights: EvaluationWeights): number {
  let bestScore = -Infinity;

  let rotatedPiece = tetromino;
  for (let rotation = 0; rotation < 4; rotation++) {
    if (rotation > 0) {
      rotatedPiece = rotateTetromino(rotatedPiece);
    }

    const pieceWidth = getTetrominoWidth(rotatedPiece);

    for (let x = 0; x <= grid.config.width - pieceWidth; x++) {
      const y = findLowestPlacement(grid, rotatedPiece, x);

      if (canPlaceTetromino(grid, rotatedPiece, x, y)) {
        const score = evaluatePlacement(grid, rotatedPiece, x, y, weights);
        if (score > bestScore) {
          bestScore = score;
        }
      }
    }
  }

  return bestScore === -Infinity ? 0 : bestScore;
}

function evaluatePlacement(
  grid: GameGrid,
  tetromino: Tetromino,
  x: number,
  y: number,
  weights: EvaluationWeights
): number {
  // Simulate placing the piece
  const simulatedGrid = placeTetromino(grid, tetromino, x, y, 1);

  let score = 0;

  // Count completed lines (big reward)
  const completedLines = countCompletedLines(simulatedGrid);
  score += completedLines * weights.linesClear;

  // Extra bonus for multiple lines (Tetris = 4 lines is very valuable)
  if (completedLines >= 4) {
    score += 2000;
  } else if (completedLines >= 2) {
    score += 500 * completedLines;
  }

  // Penalize holes
  const holes = countHoles(simulatedGrid);
  const originalHoles = countHoles(grid);
  const newHoles = holes - originalHoles;
  score += newHoles * weights.holes;

  // Penalize covered holes (holes with blocks above them)
  const coveredHoles = countCoveredHoles(simulatedGrid);
  score += coveredHoles * weights.blockade;

  // Penalize height
  const height = getStackHeight(simulatedGrid);
  score += height * weights.height;

  // Reward placing near edges (harder for player to reach)
  const pieceWidth = getTetrominoWidth(tetromino);
  const centerDistance = Math.abs(x + pieceWidth / 2 - grid.config.width / 2);
  score += centerDistance * weights.edgeBonus;

  // Penalize bumpiness (height differences between columns)
  const bumpiness = calculateBumpiness(simulatedGrid);
  score += bumpiness * weights.bumpiness;

  // Reward creating wells (single-column gaps for I pieces)
  const wellScore = evaluateWells(simulatedGrid);
  score += wellScore * weights.wellBonus;

  // Reward flat surfaces
  const flatness = calculateFlatness(simulatedGrid);
  score += flatness * weights.flatness;

  // Penalize row and column transitions (indicators of holes and gaps)
  const rowTransitions = countRowTransitions(simulatedGrid);
  const colTransitions = countColumnTransitions(simulatedGrid);
  score += rowTransitions * weights.rowTransitions;
  score += colTransitions * weights.columnTransitions;

  // Bonus for completing lines that are already mostly filled
  for (let row = 0; row < grid.config.height - grid.config.dangerZone; row++) {
    const filled = countFilledBlocks(grid, row);
    if (filled >= 7 && filled < 10) {
      // Check if this placement helps complete this row
      const blocks = getTetrominoBlocks(tetromino, x, y);
      for (const block of blocks) {
        if (block.y === row) {
          score += 300;
        }
      }
    }
  }

  // Bonus for placing piece low (good for building)
  score += y * 5;

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

// Get column heights for reuse
function getColumnHeights(grid: GameGrid): number[] {
  const heights: number[] = [];
  const maxY = grid.config.height - grid.config.dangerZone;

  for (let x = 0; x < grid.config.width; x++) {
    let height = 0;
    for (let y = 0; y < maxY; y++) {
      if (grid.blocks[y]?.[x]) {
        height = maxY - y;
        break;
      }
    }
    heights.push(height);
  }

  return heights;
}

function calculateBumpiness(grid: GameGrid): number {
  const heights = getColumnHeights(grid);

  // Sum of absolute differences between adjacent columns
  let bumpiness = 0;
  for (let i = 0; i < heights.length - 1; i++) {
    bumpiness += Math.abs(heights[i] - heights[i + 1]);
  }

  return bumpiness;
}

// Count holes that have blocks above them (very bad)
function countCoveredHoles(grid: GameGrid): number {
  let coveredHoles = 0;
  const maxY = grid.config.height - grid.config.dangerZone;

  for (let x = 0; x < grid.config.width; x++) {
    let blocksAbove = 0;
    for (let y = 0; y < maxY; y++) {
      if (grid.blocks[y]?.[x]) {
        blocksAbove++;
      } else if (blocksAbove > 0) {
        // This is a hole with blocks above it
        coveredHoles += blocksAbove; // Weight by how many blocks are above
      }
    }
  }

  return coveredHoles;
}

// Evaluate wells (single-column gaps that are good for I pieces)
function evaluateWells(grid: GameGrid): number {
  const heights = getColumnHeights(grid);
  let wellScore = 0;

  for (let x = 0; x < grid.config.width; x++) {
    const leftHeight = x > 0 ? heights[x - 1] : 999;
    const rightHeight = x < grid.config.width - 1 ? heights[x + 1] : 999;
    const currentHeight = heights[x];

    // A well is when both neighbors are higher
    if (leftHeight > currentHeight && rightHeight > currentHeight) {
      const wellDepth = Math.min(leftHeight, rightHeight) - currentHeight;
      // Good wells are 1-4 deep (for I piece), bad if too deep
      if (wellDepth >= 1 && wellDepth <= 4) {
        wellScore += wellDepth;
      } else if (wellDepth > 4) {
        wellScore -= wellDepth - 4; // Penalize too deep wells
      }
    }
  }

  return wellScore;
}

// Calculate flatness (reward flat surfaces)
function calculateFlatness(grid: GameGrid): number {
  const heights = getColumnHeights(grid);
  let flatness = 0;

  // Count consecutive columns with same height
  for (let i = 0; i < heights.length - 1; i++) {
    if (heights[i] === heights[i + 1]) {
      flatness++;
    }
  }

  return flatness;
}

// Count row transitions (empty to filled or filled to empty in a row)
function countRowTransitions(grid: GameGrid): number {
  let transitions = 0;
  const maxY = grid.config.height - grid.config.dangerZone;

  for (let y = 0; y < maxY; y++) {
    // Count transitions including boundaries
    let lastFilled = true; // Treat left boundary as filled
    for (let x = 0; x < grid.config.width; x++) {
      const filled = !!grid.blocks[y]?.[x];
      if (filled !== lastFilled) {
        transitions++;
      }
      lastFilled = filled;
    }
    // Right boundary
    if (!lastFilled) {
      transitions++;
    }
  }

  return transitions;
}

// Count column transitions (empty to filled or filled to empty in a column)
function countColumnTransitions(grid: GameGrid): number {
  let transitions = 0;
  const maxY = grid.config.height - grid.config.dangerZone;

  for (let x = 0; x < grid.config.width; x++) {
    let lastFilled = true; // Treat top as filled
    for (let y = 0; y < maxY; y++) {
      const filled = !!grid.blocks[y]?.[x];
      if (filled !== lastFilled) {
        transitions++;
      }
      lastFilled = filled;
    }
    // Bottom boundary - if last cell was empty, that's a transition
    if (!lastFilled) {
      transitions++;
    }
  }

  return transitions;
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
