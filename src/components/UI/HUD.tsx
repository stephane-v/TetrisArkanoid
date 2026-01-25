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
    <div className="flex items-center justify-between px-2 py-1 bg-gray-900 text-white text-xs h-7 min-h-7 max-h-7 overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="whitespace-nowrap">
          <span className="text-cyan-400 font-bold">{stats.score.toLocaleString()}</span>
        </div>

        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(stats.lives, 5) }).map((_, i) => (
            <span key={i} className="text-red-500">*</span>
          ))}
        </div>

        {stats.combo > 1 && (
          <div className="text-yellow-400 font-bold animate-pulse whitespace-nowrap">
            x{stats.combo}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {modeTitle && (
          <div className="text-purple-400 text-[10px] whitespace-nowrap">{modeTitle}</div>
        )}

        {humanTetrisScore !== undefined && (
          <div className="text-green-400 font-bold text-[10px] whitespace-nowrap">T:{humanTetrisScore}</div>
        )}

        {hasShield && (
          <div className="text-cyan-300 font-bold text-[10px]">[S]</div>
        )}

        {activePowerUps.slice(0, 3).map((powerUp) => (
          <div key={powerUp.type} className="text-[10px] whitespace-nowrap">
            <span className="text-yellow-400">{POWERUP_DEFINITIONS[powerUp.type].icon}</span>
            {powerUp.remainingTime !== null && (
              <span className="text-gray-400">{Math.ceil(powerUp.remainingTime / 1000)}</span>
            )}
          </div>
        ))}

        <div className="whitespace-nowrap">
          <span className="font-bold" style={{ color: levelInfo.color }}>L{stats.level}</span>
        </div>
      </div>
    </div>
  );
};
