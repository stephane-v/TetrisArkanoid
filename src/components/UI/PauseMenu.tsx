import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
      <h2 className="text-3xl font-bold mb-8 text-yellow-400">PAUSED</h2>

      <div className="flex flex-col gap-4">
        <button
          onClick={onResume}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors"
        >
          RESUME
        </button>

        <button
          onClick={onRestart}
          className="px-8 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
        >
          RESTART
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-400">Press ESC or SPACE to resume</p>
    </div>
  );
};
