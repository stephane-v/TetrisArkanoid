import type { GameStats, ActivePowerUp } from '../../types/game.types';
import { getLevelDisplayInfo } from '../../game/systems/Difficulty';
import { POWERUP_DEFINITIONS } from '../../game/utils/constants';

interface HUDProps {
  stats: GameStats;
  hasShield: boolean;
  activePowerUps: ActivePowerUp[];
  modeTitle?: string;
  humanTetrisScore?: number;
}

export const HUD: React.FC<HUDProps> = ({ stats, hasShield, activePowerUps, modeTitle, humanTetrisScore }) => {
  const levelInfo = getLevelDisplayInfo(stats.level);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white text-sm">
      <div className="flex items-center gap-4">
        <div>
          <span className="text-gray-400">SCORE: </span>
          <span className="font-bold text-cyan-400">{stats.score.toLocaleString()}</span>
        </div>

        {humanTetrisScore !== undefined && (
          <div>
            <span className="text-gray-400">TETRIS: </span>
            <span className="font-bold text-purple-400">{humanTetrisScore.toLocaleString()}</span>
          </div>
        )}

        <div className="flex gap-1">
          {Array.from({ length: stats.lives }).map((_, i) => (
            <span key={i} className="text-red-500">
              *
            </span>
          ))}
        </div>

        {stats.combo > 1 && (
          <div className="text-yellow-400 font-bold animate-pulse">
            x{stats.combo} COMBO!
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {modeTitle && (
          <div className="text-purple-400 text-xs">{modeTitle}</div>
        )}

        {hasShield && (
          <div className="text-cyan-300 font-bold">[SHIELD]</div>
        )}

        {activePowerUps.map((powerUp) => (
          <div key={powerUp.type} className="text-xs">
            <span className="text-yellow-400">{POWERUP_DEFINITIONS[powerUp.type].icon}</span>
            {powerUp.remainingTime !== null && (
              <span className="text-gray-400 ml-1">
                {Math.ceil(powerUp.remainingTime / 1000)}s
              </span>
            )}
          </div>
        ))}

        <div>
          <span className="text-gray-400">LVL: </span>
          <span className="font-bold" style={{ color: levelInfo.color }}>
            {stats.level}
          </span>
        </div>
      </div>
    </div>
  );
};
