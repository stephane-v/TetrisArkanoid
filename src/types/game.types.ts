// Core game types for TetriKanoid

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Block {
  exists: boolean;
  color: string;
  health: number;
  maxHealth: number;
  isPartOfLine: boolean;
  isWarning: boolean;
}

export interface GridConfig {
  width: number;
  height: number;
  dangerZone: number;
  cellSize: number;
}

export interface GameGrid {
  config: GridConfig;
  blocks: (Block | null)[][];
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPowered: boolean;
  color: string;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
  rotation: number;
}

export interface PlacementDecision {
  tetromino: Tetromino;
  targetX: number;
  targetY: number;
  rotation: number;
}

export interface RobotConfig {
  level: number;
  thinkingTime: number;
  placementSkill: number;
  aggressiveness: number;
  previewPieces: number;
}

export interface RobotState {
  config: RobotConfig;
  currentPiece: Tetromino | null;
  nextPieces: Tetromino[];
  targetPlacement: PlacementDecision | null;
  placementProgress: number;
  score: number;
  linesCompleted: number;
  isThinking: boolean;
  isFrozen: boolean;
  thinkingTimeRemaining: number;
}

export type PowerUpType =
  | 'MULTI_BALL'
  | 'LARGE_PADDLE'
  | 'POWER_BALL'
  | 'FREEZE_ROBOT'
  | 'LINE_BOMB'
  | 'SHIELD'
  | 'EXTRA_LIFE';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number | null;
  remainingTime: number | null;
}

export interface DifficultyConfig {
  robotThinkTime: number;
  robotSkill: number;
  ballSpeed: number;
  paddleWidth: number;
  blockHealth: number;
}

export type GameOverReason = 'NO_BALLS' | 'BLOCKS_REACHED_BOTTOM' | null;

export type GameState = 'START' | 'MODE_SELECT' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

// Game modes
export type GameMode =
  | 'CLASSIC'      // Robot plays Tetris, Human plays Arkanoid
  | 'REVERSED'     // Human plays Tetris, Robot plays Arkanoid
  | 'TWO_PLAYER';  // Human vs Human

// Human Tetris player state (for reversed and 2-player modes)
export interface HumanTetrisState {
  currentPiece: Tetromino | null;
  nextPieces: Tetromino[];
  currentX: number;
  currentY: number;
  dropTimer: number;
  dropSpeed: number;  // ms between drops
  softDropping: boolean;
  score: number;
  linesCompleted: number;
}

// AI Paddle controller state (for reversed mode)
export interface AIPaddleState {
  targetX: number;
  reactionTime: number;
  accuracy: number;  // 0-1, how accurately it tracks the ball
  predictionSkill: number;  // 0-1, how well it predicts ball trajectory
}

export interface GameStats {
  score: number;
  lives: number;
  level: number;
  blocksDestroyed: number;
  linesPreventedCount: number;
  survivalTime: number;
  combo: number;
  maxCombo: number;
  lastComboTime: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  gridOffsetX: number;
  gridOffsetY: number;
}

export interface InputState {
  mouseX: number;
  leftPressed: boolean;
  rightPressed: boolean;
  spacePressed: boolean;
  escapePressed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
