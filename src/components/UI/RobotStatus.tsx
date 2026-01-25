import type { RobotState } from '../../types/game.types';

interface RobotStatusProps {
  robot: RobotState;
}

export const RobotStatus: React.FC<RobotStatusProps> = ({ robot }) => {
  const statusText = robot.isFrozen
    ? 'FROZEN'
    : robot.isThinking
    ? 'THINKING...'
    : 'PLACING';

  const statusColor = robot.isFrozen
    ? 'text-blue-400'
    : robot.isThinking
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-800 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">ROBOT:</span>
        <span className={`font-bold ${statusColor}`}>{statusText}</span>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <span className="text-gray-500">Lines: </span>
          <span className="font-bold text-red-400">{robot.linesCompleted}</span>
        </div>
        <div>
          <span className="text-gray-500">Score: </span>
          <span className="font-bold text-red-400">{robot.score.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
