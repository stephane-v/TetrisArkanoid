import type { GameOverReason, GameStats } from '../../types/game.types';

interface GameOverProps {
  reason: GameOverReason;
  stats: GameStats;
  robotScore: number;
  robotLines: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  reason,
  stats,
  robotScore,
  robotLines,
  onRestart,
}) => {
  const reasonText =
    reason === 'NO_BALLS'
      ? 'You ran out of balls!'
      : 'Blocks reached the danger zone!';

  const won = stats.score > robotScore;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
      <h2 className={`text-4xl font-bold mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
        GAME OVER
      </h2>
      <p className="text-lg mb-6 text-gray-400">{reasonText}</p>

      <div className="bg-gray-800 rounded-lg p-6 mb-6 min-w-[280px]">
        <h3 className="text-xl font-bold mb-4 text-center border-b border-gray-600 pb-2">
          FINAL SCORES
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-cyan-400 font-bold">YOU</p>
            <p className="text-3xl font-bold">{stats.score.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-red-400 font-bold">ROBOT</p>
            <p className="text-3xl font-bold">{robotScore.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-600 text-sm text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>Level reached:</span>
            <span className="font-bold">{stats.level}</span>
          </div>
          <div className="flex justify-between">
            <span>Blocks destroyed:</span>
            <span className="font-bold">{stats.blocksDestroyed}</span>
          </div>
          <div className="flex justify-between">
            <span>Lines prevented:</span>
            <span className="font-bold">{stats.linesPreventedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Max combo:</span>
            <span className="font-bold">x{stats.maxCombo}</span>
          </div>
          <div className="flex justify-between">
            <span>Survival time:</span>
            <span className="font-bold">{Math.floor(stats.survivalTime)}s</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>Robot lines:</span>
            <span className="font-bold">{robotLines}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-xl"
      >
        PLAY AGAIN
      </button>

      <p className="mt-4 text-xs text-gray-500">Press SPACE to restart</p>
    </div>
  );
};
