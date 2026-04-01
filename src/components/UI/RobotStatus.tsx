import type { RobotState } from '../../types/game.types';

interface RobotStatusProps {
  robot: RobotState;
}

export const RobotStatus: React.FC<RobotStatusProps> = ({ robot }) => {
  const statusText = robot.isFrozen
    ? 'FROZEN'
    : robot.isThinking
    ? 'THINKING'
    : 'PLACING';

  const statusColor = robot.isFrozen
    ? 'text-blue-400'
    : robot.isThinking
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="flex items-center justify-between px-2 py-0.5 bg-gray-800 text-[10px] h-5 min-h-5 max-h-5 overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">ROBOT:</span>
        <span className={`font-bold ${statusColor}`}>{statusText}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-red-400 font-bold">{robot.linesCompleted}L</span>
        <span className="text-red-400">{robot.score.toLocaleString()}</span>
      </div>
    </div>
  );
};
