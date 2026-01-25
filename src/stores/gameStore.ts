import { create } from 'zustand';
import type { GameEngineState } from '../game/Engine';
import type { GameMode, Difficulty } from '../types/game.types';
import type { TetrisInput } from '../game/systems/HumanTetris';
import {
  createInitialState,
  startGame,
  pauseGame,
  resumeGame,
  launchBallAction,
  updateGame,
} from '../game/Engine';

interface GameStore extends GameEngineState {
  // Actions
  start: (mode?: GameMode, difficulty?: Difficulty, startingLevel?: number) => void;
  pause: () => void;
  resume: () => void;
  launchBall: () => void;
  update: (
    deltaTime: number,
    mouseX: number | null,
    leftPressed: boolean,
    rightPressed: boolean,
    tetrisInput?: TetrisInput
  ) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialState(),

  start: (mode: GameMode = 'CLASSIC', difficulty: Difficulty = 'MEDIUM', startingLevel: number = 1) =>
    set((state) => startGame(state, mode, difficulty, startingLevel)),

  pause: () => set((state) => pauseGame(state)),

  resume: () => set((state) => resumeGame(state)),

  launchBall: () => set((state) => launchBallAction(state)),

  update: (deltaTime, mouseX, leftPressed, rightPressed, tetrisInput) =>
    set((state) => updateGame(state, deltaTime, mouseX, leftPressed, rightPressed, tetrisInput)),

  reset: () => set(createInitialState()),
}));
