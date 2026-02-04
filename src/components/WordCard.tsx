import React from 'react';
import { Word } from '../types';

interface WordCardProps {
  word: Word | null;
  showHint: boolean;
  onShowHint: () => void;
  hintUsed: boolean;
  teamScore?: number;
}

export function WordCard({ word, showHint, onShowHint, hintUsed, teamScore = 0 }: WordCardProps) {
  if (!word) {
    return (
      <div className="word-card">
        <p className="text-2xl text-white/60">Слова закінчились!</p>
      </div>
    );
  }

  // Hint will cause -1 point when "Guessed" is pressed
  const hintPenaltyText = '(−1 бал при вгадуванні)';

  return (
    <div className="word-card">
      <h2 className="text-4xl md:text-5xl font-bold mb-6 text-glow-strong">
        {word.word}
      </h2>

      {showHint ? (
        <div className="hint-box">
          <p className="text-lg">
            <span className="font-semibold">Підказка: </span>
            {word.hint}
          </p>
        </div>
      ) : (
        <button
          onClick={onShowHint}
          disabled={hintUsed}
          className="btn-warning text-sm"
        >
          {hintUsed ? 'Підказку вже використано' : `Показати підказку ${hintPenaltyText}`}
        </button>
      )}
    </div>
  );
}
