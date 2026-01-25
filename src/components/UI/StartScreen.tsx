import React, { useState } from 'react';
import type { GameMode } from '../../types/game.types';

interface StartScreenProps {
  onStart: (mode: GameMode) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('CLASSIC');

  const modes: { mode: GameMode; title: string; description: string; color: string }[] = [
    {
      mode: 'CLASSIC',
      title: 'Classique',
      description: 'Robot joue Tetris, Vous jouez Arkanoid',
      color: 'cyan',
    },
    {
      mode: 'REVERSED',
      title: 'Inversé',
      description: 'Vous jouez Tetris, Robot joue Arkanoid',
      color: 'purple',
    },
    {
      mode: 'TWO_PLAYER',
      title: '2 Joueurs',
      description: 'Joueur 1: Tetris (WASD) vs Joueur 2: Arkanoid (Flèches)',
      color: 'green',
    },
  ];

  const getControlsText = () => {
    switch (selectedMode) {
      case 'CLASSIC':
        return (
          <>
            <p className="mb-2 font-bold text-white">Contrôles (Arkanoid):</p>
            <p>Souris / Tactile - Déplacer la raquette</p>
            <p>Flèches / A-D - Déplacer la raquette</p>
            <p>Espace / Clic - Lancer la balle</p>
            <p>Echap / P - Pause</p>
          </>
        );
      case 'REVERSED':
        return (
          <>
            <p className="mb-2 font-bold text-white">Contrôles (Tetris):</p>
            <p>Flèches Gauche/Droite - Déplacer la pièce</p>
            <p>Flèche Haut / X - Rotation droite</p>
            <p>Z - Rotation gauche</p>
            <p>Flèche Bas - Descente rapide</p>
            <p>Espace - Descente instantanée</p>
            <p>Echap / P - Pause</p>
          </>
        );
      case 'TWO_PLAYER':
        return (
          <>
            <p className="mb-2 font-bold text-white">Joueur 1 - Tetris (WASD):</p>
            <p>A/D - Déplacer la pièce</p>
            <p>W / E - Rotation</p>
            <p>S - Descente rapide</p>
            <p>Q - Descente instantanée</p>
            <p className="mt-2 mb-2 font-bold text-white">Joueur 2 - Arkanoid (Flèches):</p>
            <p>Flèches Gauche/Droite - Déplacer la raquette</p>
            <p>Espace - Lancer la balle</p>
          </>
        );
    }
  };

  const getDescriptionText = () => {
    switch (selectedMode) {
      case 'CLASSIC':
        return (
          <>
            <p>Le ROBOT joue à Tetris - il place des pièces pour compléter des lignes.</p>
            <p>VOUS contrôlez une raquette et une balle pour DÉTRUIRE les blocs avant que les lignes se complètent!</p>
            <p className="text-red-400">Si une ligne se complète, TOUS les blocs descendent!</p>
            <p className="text-yellow-400">Si les blocs atteignent la zone de danger - GAME OVER!</p>
          </>
        );
      case 'REVERSED':
        return (
          <>
            <p>VOUS jouez à Tetris - placez des pièces pour compléter des lignes.</p>
            <p>Le ROBOT contrôle une raquette et tente de DÉTRUIRE vos blocs!</p>
            <p className="text-green-400">Complétez des lignes pour pousser les blocs vers le bas!</p>
            <p className="text-yellow-400">Si les blocs atteignent la zone de danger - GAME OVER!</p>
          </>
        );
      case 'TWO_PLAYER':
        return (
          <>
            <p>Joueur 1 joue à Tetris - placez des pièces pour compléter des lignes.</p>
            <p>Joueur 2 contrôle la raquette pour DÉTRUIRE les blocs!</p>
            <p className="text-red-400">Qui dominera la partie?</p>
          </>
        );
    }
  };

  const selectedConfig = modes.find(m => m.mode === selectedMode)!;
  const buttonColorClass = {
    cyan: 'bg-cyan-500 hover:bg-cyan-400',
    purple: 'bg-purple-500 hover:bg-purple-400',
    green: 'bg-green-500 hover:bg-green-400',
  }[selectedConfig.color];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10 overflow-y-auto py-4">
      <h1 className="text-4xl font-bold mb-2 text-cyan-400">TETRIKANOID</h1>
      <p className="text-lg mb-4 text-gray-400">Robot vs Player</p>

      {/* Mode Selection */}
      <div className="flex gap-2 mb-4">
        {modes.map(({ mode, title, color }) => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
              selectedMode === mode
                ? `bg-${color}-500 text-black scale-105`
                : `bg-gray-700 hover:bg-gray-600 text-gray-300`
            }`}
            style={selectedMode === mode ? {
              backgroundColor: color === 'cyan' ? '#06b6d4' : color === 'purple' ? '#a855f7' : '#22c55e'
            } : undefined}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="max-w-sm text-center mb-4 text-sm text-gray-300 space-y-2">
        {getDescriptionText()}
      </div>

      <div className="mb-4 text-sm text-gray-400 text-center">
        {getControlsText()}
      </div>

      <button
        onClick={() => onStart(selectedMode)}
        className={`px-8 py-3 ${buttonColorClass} text-black font-bold rounded-lg transition-colors text-xl`}
      >
        JOUER - {selectedConfig.title.toUpperCase()}
      </button>

      <p className="mt-4 text-xs text-gray-500">Appuyez sur ESPACE pour commencer</p>
    </div>
  );
};
