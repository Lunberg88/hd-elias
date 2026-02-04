import React from 'react';
import { Team } from '../types';

interface TeamScoresProps {
  teams: Team[];
  currentTeamIndex: number;
  compact?: boolean;
}

export function TeamScores({ teams, currentTeamIndex, compact = false }: TeamScoresProps) {
  if (compact) {
    return (
      <div className="flex gap-4 justify-center">
        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              index === currentTeamIndex
                ? 'bg-yellow-500/30 ring-2 ring-yellow-400'
                : 'bg-white/10'
            }`}
          >
            <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${team.color}`} />
            <span className="font-medium">{team.name}</span>
            <span className="font-bold text-xl">{team.score}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {teams.map((team, index) => (
        <div
          key={team.id}
          className={`team-card ${index === currentTeamIndex ? 'active' : ''}`}
        >
          <div
            className={`w-full h-2 rounded-full bg-gradient-to-r ${team.color} mb-3`}
          />
          <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
          <div className="text-4xl font-bold mb-2">{team.score}</div>
          <div className="text-sm text-white/60">
            {team.players.length > 0
              ? team.players.map((p) => p.name).join(', ')
              : 'Немає гравців'}
          </div>
          {index === currentTeamIndex && (
            <div className="mt-2 px-3 py-1 bg-yellow-500/30 rounded-full text-yellow-300 text-sm inline-block">
              Зараз грає
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
