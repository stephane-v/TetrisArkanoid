import type { Tetromino, TetrominoType } from '../../types/game.types';
import { COLORS } from './constants';

// Tetromino shape definitions (standard Tetris pieces)
// Each shape is a 2D array where 1 indicates a filled cell

const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [1, 1],
      [1, 0],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  ],
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function createTetromino(type: TetrominoType, rotation = 0): Tetromino {
  return {
    type,
    shape: TETROMINO_SHAPES[type][rotation % 4],
    color: COLORS.tetromino[type],
    rotation: rotation % 4,
  };
}

export function getRandomTetrominoType(): TetrominoType {
  return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

export function createRandomTetromino(): Tetromino {
  return createTetromino(getRandomTetrominoType());
}

export function rotateTetromino(tetromino: Tetromino, clockwise = true): Tetromino {
  const newRotation = clockwise
    ? (tetromino.rotation + 1) % 4
    : (tetromino.rotation + 3) % 4;
  return createTetromino(tetromino.type, newRotation);
}

export function getTetrominoWidth(tetromino: Tetromino): number {
  return tetromino.shape[0]?.length || 0;
}

export function getTetrominoHeight(tetromino: Tetromino): number {
  return tetromino.shape.length;
}

export function getTetrominoBlocks(
  tetromino: Tetromino,
  x: number,
  y: number
): { x: number; y: number }[] {
  const blocks: { x: number; y: number }[] = [];

  for (let row = 0; row < tetromino.shape.length; row++) {
    for (let col = 0; col < tetromino.shape[row].length; col++) {
      if (tetromino.shape[row][col] === 1) {
        blocks.push({ x: x + col, y: y + row });
      }
    }
  }

  return blocks;
}

// Generate a bag of tetrominos (7-bag randomizer like modern Tetris)
export function generateTetrominoBag(): Tetromino[] {
  const shuffled = [...TETROMINO_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.map(type => createTetromino(type));
}
