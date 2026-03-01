import { useNavigate } from 'react-router-dom';
import { Game } from '../components/Game';

export const GamePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex justify-start px-4 pt-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← Retour à l'accueil
        </button>
      </div>
      <Game />
    </div>
  );
};
