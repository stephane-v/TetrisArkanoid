import type { DifficultyConfig } from '../../types/game.types';
import {
  getDifficultyConfig,
  LEVEL_UP_SURVIVAL_TIME,
  LEVEL_UP_BLOCKS_DESTROYED,
} from '../utils/constants';

export interface LevelProgress {
  currentLevel: number;
  survivalTime: number;
  blocksDestroyed: number;
  survivalProgress: number; // 0-1
  blocksProgress: number; // 0-1
}

export function calculateLevelProgress(
  level: number,
  survivalTime: number,
  blocksDestroyed: number
): LevelProgress {
  const survivalTarget = LEVEL_UP_SURVIVAL_TIME * level;
  const blocksTarget = LEVEL_UP_BLOCKS_DESTROYED * level;

  return {
    currentLevel: level,
    survivalTime,
    blocksDestroyed,
    survivalProgress: Math.min(1, survivalTime / survivalTarget),
    blocksProgress: Math.min(1, blocksDestroyed / blocksTarget),
  };
}

export function checkLevelUp(progress: LevelProgress): boolean {
  // Level up when either condition is met
  return progress.survivalProgress >= 1 || progress.blocksProgress >= 1;
}

export function getNextLevel(currentLevel: number): number {
  return Math.min(currentLevel + 1, 20); // Max level 20
}

export function getDifficultyForLevel(level: number): DifficultyConfig {
  return getDifficultyConfig(level);
}

export function getLevelDisplayInfo(level: number): {
  name: string;
  description: string;
  color: string;
} {
  if (level <= 5) {
    return {
      name: 'Beginner',
      description: 'Robot is learning',
      color: '#4ade80', // Green
    };
  } else if (level <= 10) {
    return {
      name: 'Intermediate',
      description: 'Robot is getting smarter',
      color: '#fbbf24', // Yellow
    };
  } else if (level <= 15) {
    return {
      name: 'Advanced',
      description: 'Robot is skilled',
      color: '#f97316', // Orange
    };
  } else {
    return {
      name: 'Master',
      description: 'Robot is nearly perfect',
      color: '#ef4444', // Red
    };
  }
}
