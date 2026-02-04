import React from 'react';
import { GuessedWord, Team } from '../types';

interface WordHistoryProps {
  guessedWords: GuessedWord[];
  teams: Team[];
}

export function WordHistory({ guessedWords, teams }: WordHistoryProps) {
  if (guessedWords.length === 0) {
    return (
      <div className="text-center text-white/60 py-8">
        Поки що немає вгаданих слів
      </div>
    );
  }

  // Group by team
  const wordsByTeam = teams.map((team) => ({
    team,
    words: guessedWords.filter((w) => w.teamId === team.id),
  }));

  return (
    <div className="space-y-6">
      {wordsByTeam.map(({ team, words }) => (
        <div key={team.id} className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${team.color}`} />
            <h3 className="font-semibold">{team.name}</h3>
            <span className="text-white/60 text-sm">({words.length} слів)</span>
          </div>

          {words.length > 0 ? (
            <div className="space-y-2">
              {words.map((word, index) => (
                <div key={index} className="history-item">
                  <span className="font-medium">{word.word}</span>
                  <div className="flex items-center gap-2">
                    {word.usedHint && (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                        з підказкою
                      </span>
                    )}
                    <span className={`font-bold ${word.usedHint ? 'text-red-400' : 'text-green-400'}`}>
                      {word.usedHint ? '−1' : '+1'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-sm">Немає вгаданих слів</p>
          )}
        </div>
      ))}
    </div>
  );
}
