import type { DifficultyConfig, GridConfig } from '../../types/game.types';

// Grid configuration
export const GRID_CONFIG: GridConfig = {
  width: 10,
  height: 20,
  dangerZone: 5,  // Increased from 3 to 5 rows
  cellSize: 28,
};

// Canvas configuration
export const CANVAS_CONFIG = {
  width: 480,
  height: 700,
  gridOffsetX: 100,
  gridOffsetY: 50,
};

// Paddle configuration
export const PADDLE_CONFIG = {
  defaultWidth: 100,
  height: 12,
  speed: 600,
  bottomMargin: 30,
};

// Ball configuration
export const BALL_CONFIG = {
  radius: 8,
  defaultSpeed: 350,
  maxSpeed: 800,
  defaultDamage: 1,
};

// Initial game state
export const INITIAL_LIVES = 3;
export const INITIAL_LEVEL = 1;

// Difficulty progression
export const DIFFICULTY_LEVELS: Record<number, DifficultyConfig> = {
  1: {
    robotThinkTime: 3000,
    robotSkill: 0.3,
    ballSpeed: 280,
    paddleWidth: 120,
    blockHealth: 1,
  },
  2: {
    robotThinkTime: 2800,
    robotSkill: 0.35,
    ballSpeed: 300,
    paddleWidth: 115,
    blockHealth: 1,
  },
  3: {
    robotThinkTime: 2600,
    robotSkill: 0.4,
    ballSpeed: 320,
    paddleWidth: 110,
    blockHealth: 1,
  },
  4: {
    robotThinkTime: 2400,
    robotSkill: 0.45,
    ballSpeed: 340,
    paddleWidth: 105,
    blockHealth: 1,
  },
  5: {
    robotThinkTime: 2200,
    robotSkill: 0.5,
    ballSpeed: 360,
    paddleWidth: 100,
    blockHealth: 1,
  },
  6: {
    robotThinkTime: 2000,
    robotSkill: 0.55,
    ballSpeed: 380,
    paddleWidth: 95,
    blockHealth: 1,
  },
  7: {
    robotThinkTime: 1800,
    robotSkill: 0.6,
    ballSpeed: 400,
    paddleWidth: 92,
    blockHealth: 1,
  },
  8: {
    robotThinkTime: 1600,
    robotSkill: 0.65,
    ballSpeed: 420,
    paddleWidth: 90,
    blockHealth: 1,
  },
  9: {
    robotThinkTime: 1500,
    robotSkill: 0.68,
    ballSpeed: 440,
    paddleWidth: 88,
    blockHealth: 2,
  },
  10: {
    robotThinkTime: 1400,
    robotSkill: 0.7,
    ballSpeed: 460,
    paddleWidth: 85,
    blockHealth: 2,
  },
  11: {
    robotThinkTime: 1300,
    robotSkill: 0.73,
    ballSpeed: 480,
    paddleWidth: 83,
    blockHealth: 2,
  },
  12: {
    robotThinkTime: 1200,
    robotSkill: 0.76,
    ballSpeed: 500,
    paddleWidth: 80,
    blockHealth: 2,
  },
  13: {
    robotThinkTime: 1100,
    robotSkill: 0.79,
    ballSpeed: 520,
    paddleWidth: 78,
    blockHealth: 2,
  },
  14: {
    robotThinkTime: 1050,
    robotSkill: 0.82,
    ballSpeed: 540,
    paddleWidth: 76,
    blockHealth: 2,
  },
  15: {
    robotThinkTime: 1000,
    robotSkill: 0.85,
    ballSpeed: 560,
    paddleWidth: 75,
    blockHealth: 2,
  },
  16: {
    robotThinkTime: 900,
    robotSkill: 0.87,
    ballSpeed: 580,
    paddleWidth: 73,
    blockHealth: 3,
  },
  17: {
    robotThinkTime: 800,
    robotSkill: 0.89,
    ballSpeed: 600,
    paddleWidth: 72,
    blockHealth: 3,
  },
  18: {
    robotThinkTime: 700,
    robotSkill: 0.91,
    ballSpeed: 620,
    paddleWidth: 71,
    blockHealth: 3,
  },
  19: {
    robotThinkTime: 600,
    robotSkill: 0.93,
    ballSpeed: 640,
    paddleWidth: 70,
    blockHealth: 3,
  },
  20: {
    robotThinkTime: 500,
    robotSkill: 0.95,
    ballSpeed: 660,
    paddleWidth: 68,
    blockHealth: 3,
  },
};

// Scoring constants
export const SCORING = {
  blockDestroyed: 10,
  reinforcedBlockDestroyed: 25,
  linePrevented: 200,
  robotLineCompleted: -50,
  powerUpCollected: 30,
  comboBase: 1.1,
  survivalPerSecond: 2,
};

// Time constants
export const COMBO_TIMEOUT = 2000; // ms
export const LEVEL_UP_SURVIVAL_TIME = 60; // seconds per level
export const LEVEL_UP_BLOCKS_DESTROYED = 30; // blocks per level

// Power-up configuration
export const POWERUP_CONFIG = {
  dropChance: 0.15,  // Default (MEDIUM)
  fallSpeed: 100,
  size: 20,
};

// Difficulty-based power-up drop chances
export const DIFFICULTY_POWERUP_CHANCE: Record<string, number> = {
  EASY: 0.25,    // 25% drop chance - lots of power-ups
  MEDIUM: 0.15,  // 15% drop chance - balanced
  HARD: 0.05,    // 5% drop chance - very few power-ups
};

// Colors
export const COLORS = {
  background: '#0a0a0f',
  grid: '#1a1a2e',
  gridLine: '#252540',
  dangerZone: 'rgba(255, 0, 0, 0.15)',
  dangerZoneBorder: 'rgba(255, 0, 0, 0.5)',
  paddle: '#4ecdc4',
  ball: '#ffffff',
  poweredBall: '#ffff00',
  warning: '#ff6b35',
  critical: '#ff0000',

  // Tetromino colors
  tetromino: {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000',
  },

  // Power-up colors
  powerUp: {
    MULTI_BALL: '#ff4444',
    LARGE_PADDLE: '#44ff44',
    POWER_BALL: '#ffff44',
    FREEZE_ROBOT: '#4444ff',
    LINE_BOMB: '#ff8844',
    SHIELD: '#44ffff',
    EXTRA_LIFE: '#ff44ff',
  },
};

// Power-up definitions
export const POWERUP_DEFINITIONS = {
  MULTI_BALL: {
    icon: '+2',
    name: 'Multi Ball',
    description: 'Adds 2 extra balls',
    duration: null,
  },
  LARGE_PADDLE: {
    icon: '<->',
    name: 'Large Paddle',
    description: 'Paddle x1.5 width',
    duration: 15000,
  },
  POWER_BALL: {
    icon: '***',
    name: 'Power Ball',
    description: 'Ball pierces blocks',
    duration: 10000,
  },
  FREEZE_ROBOT: {
    icon: '|||',
    name: 'Freeze Robot',
    description: 'Robot stops placing',
    duration: 8000,
  },
  LINE_BOMB: {
    icon: 'XXX',
    name: 'Line Bomb',
    description: 'Destroys a random line',
    duration: null,
  },
  SHIELD: {
    icon: '[=]',
    name: 'Shield',
    description: 'Blocks next penalty',
    duration: null,
  },
  EXTRA_LIFE: {
    icon: '<3',
    name: 'Extra Life',
    description: '+1 ball',
    duration: null,
  },
};

export function getDifficultyConfig(level: number): DifficultyConfig {
  const clampedLevel = Math.min(Math.max(level, 1), 20);
  return DIFFICULTY_LEVELS[clampedLevel];
}
