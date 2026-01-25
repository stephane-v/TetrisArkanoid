import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
      <h1 className="text-4xl font-bold mb-2 text-cyan-400">TETRIKANOID</h1>
      <p className="text-lg mb-8 text-gray-400">Robot vs Player</p>

      <div className="max-w-sm text-center mb-8 text-sm text-gray-300 space-y-2">
        <p>The ROBOT plays Tetris - placing blocks to complete lines.</p>
        <p>YOU control a paddle and ball to DESTROY blocks before lines complete!</p>
        <p className="text-red-400">If a line completes, ALL blocks drop down!</p>
        <p className="text-yellow-400">If blocks reach the danger zone - GAME OVER!</p>
      </div>

      <div className="mb-8 text-sm text-gray-400">
        <p className="mb-2 font-bold text-white">Controls:</p>
        <p>Mouse / Touch - Move paddle</p>
        <p>Arrow keys / A-D - Move paddle</p>
        <p>Space / Click - Launch ball</p>
        <p>Escape - Pause</p>
      </div>

      <button
        onClick={onStart}
        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-xl"
      >
        START GAME
      </button>

      <p className="mt-4 text-xs text-gray-500">Press SPACE to start</p>
    </div>
  );
};
