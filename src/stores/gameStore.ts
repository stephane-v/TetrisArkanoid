import { create } from 'zustand';
import type { GameEngineState } from '../game/Engine';
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
  start: () => void;
  pause: () => void;
  resume: () => void;
  launchBall: () => void;
  update: (
    deltaTime: number,
    mouseX: number | null,
    leftPressed: boolean,
    rightPressed: boolean
  ) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...createInitialState(),

  start: () => set((state) => startGame(state)),

  pause: () => set((state) => pauseGame(state)),

  resume: () => set((state) => resumeGame(state)),

  launchBall: () => set((state) => launchBallAction(state)),

  update: (deltaTime, mouseX, leftPressed, rightPressed) =>
    set((state) => updateGame(state, deltaTime, mouseX, leftPressed, rightPressed)),

  reset: () => set(createInitialState()),
}));
