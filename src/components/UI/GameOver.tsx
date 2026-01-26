import type { GameOverReason, GameStats, GameMode } from '../../types/game.types';

interface GameOverProps {
  reason: GameOverReason;
  stats: GameStats;
  robotScore?: number;
  robotLines?: number;
  humanTetrisScore?: number;
  humanTetrisLines?: number;
  gameMode: GameMode;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  reason,
  stats,
  robotScore,
  robotLines,
  humanTetrisScore,
  humanTetrisLines,
  gameMode,
  onRestart,
}) => {
  const getReasonText = () => {
    if (reason === 'NO_BALLS') {
      return gameMode === 'CLASSIC'
        ? 'Plus de balles!'
        : 'Le joueur Arkanoid a perdu!';
    }
    return 'Les blocs ont atteint la zone de danger!';
  };

  const getWinnerText = () => {
    if (gameMode === 'CLASSIC') {
      // In classic mode, player plays Arkanoid - if player loses all balls, player loses
      // If blocks reach danger zone, the Tetris robot loses, so player wins
      return reason === 'NO_BALLS' ? 'DÉFAITE!' : 'VICTOIRE!';
    }
    if (gameMode === 'REVERSED') {
      // In reversed mode, player plays Tetris - if blocks reach danger, player loses
      return reason === 'NO_BALLS' ? 'VICTOIRE!' : 'DÉFAITE!';
    }
    if (gameMode === 'TWO_PLAYER') {
      if (reason === 'NO_BALLS') {
        return 'Joueur 1 (Tetris) GAGNE!';
      }
      return 'Joueur 2 (Arkanoid) GAGNE!';
    }
    return 'GAME OVER';
  };

  const isWin = () => {
    if (gameMode === 'CLASSIC') {
      // Player wins if blocks reached danger (robot lost)
      return reason !== 'NO_BALLS';
    }
    if (gameMode === 'REVERSED') {
      return reason === 'NO_BALLS';
    }
    return false;
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
      <h2 className={`text-4xl font-bold mb-2 ${isWin() ? 'text-green-400' : 'text-red-400'}`}>
        {getWinnerText()}
      </h2>
      <p className="text-lg mb-6 text-gray-400">{getReasonText()}</p>

      <div className="bg-gray-800 rounded-lg p-6 mb-6 min-w-[280px]">
        <h3 className="text-xl font-bold mb-4 text-center border-b border-gray-600 pb-2">
          SCORES FINAUX
        </h3>

        {gameMode === 'CLASSIC' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-cyan-400 font-bold">VOUS</p>
              <p className="text-3xl font-bold">{stats.score.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-bold">ROBOT</p>
              <p className="text-3xl font-bold">{(robotScore ?? 0).toLocaleString()}</p>
            </div>
          </div>
        )}

        {gameMode === 'REVERSED' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-purple-400 font-bold">VOUS (Tetris)</p>
              <p className="text-3xl font-bold">{stats.score.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{humanTetrisLines ?? 0} lignes</p>
            </div>
            <div className="text-center">
              <p className="text-cyan-400 font-bold">ROBOT (Arkanoid)</p>
              <p className="text-3xl font-bold">{stats.blocksDestroyed}</p>
              <p className="text-sm text-gray-400">blocs détruits</p>
            </div>
          </div>
        )}

        {gameMode === 'TWO_PLAYER' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-purple-400 font-bold">J1 (Tetris)</p>
              <p className="text-3xl font-bold">{(humanTetrisScore ?? 0).toLocaleString()}</p>
              <p className="text-sm text-gray-400">{humanTetrisLines ?? 0} lignes</p>
            </div>
            <div className="text-center">
              <p className="text-cyan-400 font-bold">J2 (Arkanoid)</p>
              <p className="text-3xl font-bold">{stats.score.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{stats.blocksDestroyed} blocs</p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-600 text-sm text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>Niveau atteint:</span>
            <span className="font-bold">{stats.level}</span>
          </div>
          <div className="flex justify-between">
            <span>Blocs détruits:</span>
            <span className="font-bold">{stats.blocksDestroyed}</span>
          </div>
          {gameMode === 'CLASSIC' && (
            <>
              <div className="flex justify-between">
                <span>Lignes empêchées:</span>
                <span className="font-bold">{stats.linesPreventedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Max combo:</span>
                <span className="font-bold">x{stats.maxCombo}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>Temps de survie:</span>
            <span className="font-bold">{Math.floor(stats.survivalTime)}s</span>
          </div>
          {gameMode === 'CLASSIC' && robotLines !== undefined && (
            <div className="flex justify-between text-red-400">
              <span>Lignes du robot:</span>
              <span className="font-bold">{robotLines}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors text-xl"
      >
        REJOUER
      </button>

      <p className="mt-4 text-xs text-gray-500">Appuyez sur ESPACE pour recommencer</p>
    </div>
  );
};
