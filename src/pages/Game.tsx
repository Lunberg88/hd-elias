import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import {
  Timer,
  WordCard,
  TeamScores,
  Modal,
  WordHistory,
} from '../components';

export function Game() {
  const navigate = useNavigate();
  const { state, dispatch, categories, getCategoryById, getRemainingWordsCount } = useGame();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  useEffect(() => {
    if (!state.roomCode) {
      navigate('/');
    }
  }, [state.roomCode, navigate]);

  const currentTeam = state.teams[state.currentTeamIndex];
  const currentCategory = state.currentCategoryId ? getCategoryById(state.currentCategoryId) : null;

  // Get available categories (tournament categories with remaining words)
  const availableCategories = categories.filter((cat) => {
    if (!state.tournamentCategories.includes(cat.id)) return false;
    const { remaining } = getRemainingWordsCount(cat.id);
    return remaining > 0;
  });

  // Calculate current round score for display
  const currentTurnWords = state.guessedWords.filter(
    (w) =>
      w.teamId === currentTeam?.id &&
      w.categoryId === state.currentCategoryId
  );
  const currentTurnScore = currentTurnWords.reduce(
    (sum, w) => sum + (w.usedHint ? -1 : 1),
    0
  );

  const handleSelectCategory = (categoryId: string) => {
    dispatch({ type: 'SELECT_CATEGORY', payload: categoryId });
  };

  const handleStartRound = () => {
    dispatch({ type: 'START_ROUND' });
  };

  const handleWordGuessed = () => {
    dispatch({ type: 'WORD_GUESSED' });
  };

  const handleWordSkipped = () => {
    dispatch({ type: 'WORD_SKIPPED' });
  };

  const handleUseHint = () => {
    dispatch({ type: 'USE_HINT' });
  };

  const handleFinishTurn = () => {
    dispatch({ type: 'FINISH_TEAM_TURN' });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_TIMER' });
    setShowPauseModal(true);
  };

  const handleResume = () => {
    setShowPauseModal(false);
    dispatch({ type: 'RESUME_TIMER' });
  };

  const handleEndTournament = () => {
    localStorage.removeItem('elias-game-state');
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  };

  const handleNewTournament = () => {
    dispatch({ type: 'RESET_TOURNAMENT' });
  };

  // Tournament Setup - Select categories for the tournament
  const renderTournamentSetup = () => (
    <div className="min-h-screen flex flex-col p-6">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Налаштування турніру</h1>
          <div className="p-4 bg-purple-500/20 rounded-xl mb-4 inline-block">
            <p className="text-sm text-white/60 mb-1">Код кімнати</p>
            <p className="text-2xl font-bold tracking-widest">{state.roomCode}</p>
          </div>
        </div>

        <TeamScores teams={state.teams} currentTeamIndex={-1} />

        <div className="card p-6 mt-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Оберіть категорії для турніру
          </h2>
          <p className="text-white/60 text-center mb-6">
            Кожна категорія = окремий раунд. Обидві команди грають кожну категорію.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const isSelected = state.tournamentCategories.includes(category.id);

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    const current = state.tournamentCategories;
                    const newSelected = isSelected
                      ? current.filter((id) => id !== category.id)
                      : [...current, category.id];
                    dispatch({ type: 'SET_TOURNAMENT_CATEGORIES', payload: newSelected });
                  }}
                  className={`card-hover p-6 text-center ${isSelected ? 'ring-2 ring-purple-400 bg-purple-500/20' : ''}`}
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-white/60">{category.words.length} слів</p>
                  {isSelected && (
                    <div className="mt-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-6">
            <span className="text-white/60">
              Обрано: {state.tournamentCategories.length} з {categories.length}
            </span>
            <button
              onClick={() => {
                if (state.tournamentCategories.length === categories.length) {
                  dispatch({ type: 'SET_TOURNAMENT_CATEGORIES', payload: [] });
                } else {
                  dispatch({ type: 'SET_TOURNAMENT_CATEGORIES', payload: categories.map((c) => c.id) });
                }
              }}
              className="btn-secondary text-sm px-4 py-2"
            >
              {state.tournamentCategories.length === categories.length ? 'Зняти всі' : 'Обрати всі'}
            </button>
          </div>
        </div>

        <button
          onClick={() => dispatch({ type: 'SET_STATUS', payload: 'category-select' })}
          disabled={state.tournamentCategories.length === 0}
          className="btn-success w-full text-xl py-4"
        >
          🏆 Почати турнір ({state.tournamentCategories.length} раундів)
        </button>
      </div>
    </div>
  );

  // Category Select - Choose one category for this round
  const renderCategorySelect = () => {
    const isNextTeamSameCategory = state.currentRoundTeamsPlayed.length > 0 && state.currentCategoryId;

    return (
      <div className="min-h-screen flex flex-col p-6">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <p className="text-white/60 mb-2">
              Раунд {state.playedCategories.length + 1} з {state.tournamentCategories.length}
            </p>
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentTeam?.color}`} />
              <span className="font-semibold">{currentTeam?.name}</span>
              <span className="text-white/60">грає</span>
            </div>
          </div>

          <div className="mb-6">
            <TeamScores teams={state.teams} currentTeamIndex={state.currentTeamIndex} compact />
          </div>

          {isNextTeamSameCategory ? (
            // Same category, next team's turn
            (() => {
              const { remaining, total } = currentCategory ? getRemainingWordsCount(currentCategory.id) : { remaining: 0, total: 0 };
              const hasWordsRemaining = remaining > 0;

              return (
                <div className="card p-8 text-center mb-6">
                  <div className="text-6xl mb-4">{currentCategory?.icon}</div>
                  <h2 className="text-2xl font-bold mb-2">{currentCategory?.name}</h2>
                  <p className="text-sm text-white/60 mb-2">
                    {remaining}/{total} слів залишилось
                  </p>
                  {hasWordsRemaining ? (
                    <>
                      <p className="text-white/60 mb-6">
                        Тепер грає <span className="text-white font-semibold">{currentTeam?.name}</span>
                      </p>
                      <button onClick={handleStartRound} className="btn-success text-xl py-4 px-8">
                        🎬 Почати!
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 mb-6">
                        У цій категорії не залишилося слів! Оберіть іншу категорію.
                      </p>
                      <button
                        onClick={() => dispatch({ type: 'NEXT_CATEGORY' })}
                        className="btn-primary text-xl py-4 px-8"
                      >
                        🔄 Обрати іншу категорію
                      </button>
                    </>
                  )}
                </div>
              );
            })()
          ) : (
            // Select a new category
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Оберіть категорію для цього раунду
              </h2>

              {availableCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCategories.map((category) => {
                    const isSelected = state.currentCategoryId === category.id;
                    const { remaining, total } = getRemainingWordsCount(category.id);

                    return (
                      <button
                        key={category.id}
                        onClick={() => handleSelectCategory(category.id)}
                        className={`card-hover p-6 text-center ${isSelected ? 'ring-2 ring-green-400 bg-green-500/20' : ''}`}
                      >
                        <div className="text-4xl mb-3">{category.icon}</div>
                        <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                        <p className="text-sm text-white/60">
                          {remaining}/{total} слів
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-white/60 py-8">
                  Всі слова у всіх категоріях вгадано! 🎉
                </p>
              )}
            </div>
          )}

          {!isNextTeamSameCategory && state.currentCategoryId && (() => {
            const { remaining } = getRemainingWordsCount(state.currentCategoryId);
            return remaining > 0 ? (
              <button
                onClick={handleStartRound}
                className="btn-success w-full text-xl py-4"
              >
                🎬 Почати раунд: {currentCategory?.name}
              </button>
            ) : (
              <p className="text-center text-yellow-400 py-4">
                У цій категорії не залишилося слів! Оберіть іншу.
              </p>
            );
          })()}

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Зіграно категорій: {state.playedCategories.length} / {state.tournamentCategories.length}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Playing Screen
  const renderPlayingScreen = () => (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentTeam?.color}`} />
          <span className="font-semibold">{currentTeam?.name}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/60">{currentCategory?.icon} {currentCategory?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Історія"
          >
            📜
          </button>
          <button
            onClick={handlePause}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Пауза"
          >
            ⏸️
          </button>
        </div>
      </div>

      <TeamScores teams={state.teams} currentTeamIndex={state.currentTeamIndex} compact />

      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="mb-6">
          <Timer
            seconds={state.timerSeconds}
            maxSeconds={60}
            isRunning={state.isTimerRunning}
            size={150}
          />
        </div>

        <div className="w-full max-w-lg mb-6">
          <WordCard
            word={state.currentWord}
            showHint={state.showHint}
            onShowHint={handleUseHint}
            hintUsed={state.hintUsed}
            teamScore={currentTeam?.score || 0}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <button
            onClick={handleWordGuessed}
            disabled={!state.currentWord}
            className={`flex-1 text-lg ${state.hintUsed ? 'btn-warning' : 'btn-success'}`}
          >
            ✅ Вгадано! {state.hintUsed ? '(−1 бал)' : '(+1 бал)'}
          </button>
          <button
            onClick={handleWordSkipped}
            disabled={!state.currentWord}
            className={`flex-1 text-lg ${state.hintUsed ? 'btn-warning' : 'btn-secondary'}`}
          >
            ⏭️ Пропустити {state.hintUsed ? '(−1 бал)' : '(0)'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60">
            Бали в цьому раунді:{' '}
            <span className={`font-bold text-xl ${currentTurnScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentTurnScore >= 0 ? `+${currentTurnScore}` : currentTurnScore}
            </span>
          </p>
          <p className="text-sm text-white/40 mt-1">
            Вгадано: {currentTurnWords.filter(w => !w.usedHint).length} (+1) |
            З підказкою: {currentTurnWords.filter(w => w.usedHint).length} (−1)
          </p>
          <p className="text-sm text-white/60 mt-1">
            Залишилось слів: {state.wordsQueue.length + (state.currentWord ? 1 : 0)}
          </p>
        </div>
      </div>
    </div>
  );

  // Round End Screen
  const renderRoundEnd = () => {
    const turnWords = state.guessedWords.filter(
      (w) => w.teamId === currentTeam?.id && w.categoryId === state.currentCategoryId
    );
    const turnScore = turnWords.reduce((sum, w) => sum + (w.usedHint ? -1 : 1), 0);
    const endedDueToNoWords = state.timerSeconds > 0 && !state.currentWord;
    const isLastTeamInCategory = state.currentRoundTeamsPlayed.length === state.teams.length - 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-2">
            {endedDueToNoWords ? '📭 Слова закінчились!' : '⏱️ Час вийшов!'}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentTeam?.color}`} />
            <span className="text-xl">{currentTeam?.name}</span>
          </div>
          <p className="text-white/60 mb-6">
            {currentCategory?.icon} {currentCategory?.name}
          </p>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-white/60 mb-2">Результат ходу</p>
            <p className={`text-5xl font-bold mb-2 ${turnScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {turnScore >= 0 ? `+${turnScore}` : turnScore}
            </p>
            <p className="text-white/60">Вгадано слів: {turnWords.length}</p>
            {turnWords.filter(w => w.usedHint).length > 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                З підказкою: {turnWords.filter(w => w.usedHint).length} (−1 кожне)
              </p>
            )}
          </div>

          <TeamScores teams={state.teams} currentTeamIndex={state.currentTeamIndex} />

          <div className="mt-6">
            {isLastTeamInCategory ? (
              <p className="text-white/60 mb-4">
                Категорію завершено! {availableCategories.length > 1 ? 'Далі - вибір наступної категорії.' : availableCategories.length === 1 ? 'Залишилась остання категорія.' : 'Це був останній раунд!'}
              </p>
            ) : (
              <p className="text-white/60 mb-4">
                Наступна команда грає ту саму категорію.
              </p>
            )}

            <button onClick={handleFinishTurn} className="btn-primary w-full text-lg">
              {isLastTeamInCategory
                ? availableCategories.length > 0
                  ? '➡️ До вибору категорії'
                  : '🏆 Фінальні результати'
                : `➡️ Хід ${state.teams[(state.currentTeamIndex + 1) % state.teams.length].name}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Tournament End - Final Leaderboard
  const renderTournamentEnd = () => {
    const sortedTeams = [...state.teams].sort((a, b) => b.score - a.score);
    const winner = sortedTeams[0];
    const isTie = sortedTeams.every((t) => t.score === winner?.score);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Confetti Animation */}
        {!isTie && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece absolute w-3 h-3"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  backgroundColor: ['#fbbf24', '#a855f7', '#3b82f6', '#ef4444', '#22c55e'][
                    Math.floor(Math.random() * 5)
                  ],
                  animationDelay: `${Math.random() * 3}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}

        <div className="card p-8 max-w-2xl w-full text-center z-10">
          <h1 className="text-4xl font-bold mb-6">🏆 Турнір завершено!</h1>

          {isTie ? (
            <div className="mb-8">
              <p className="text-3xl text-yellow-400 font-bold">Нічия!</p>
              <p className="text-white/60 mt-2">Обидві команди мають однаковий рахунок</p>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-white/60 mb-2">Переможець</p>
              <div className="flex items-center justify-center gap-3">
                <span className={`w-6 h-6 rounded-full bg-gradient-to-r ${winner?.color}`} />
                <span className="text-4xl font-bold">{winner?.name}</span>
              </div>
              <p className="text-6xl font-bold text-yellow-400 mt-4">
                {winner?.score} балів
              </p>
            </div>
          )}

          {/* Final Scores */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Загальний рахунок</h3>
            <div className="grid grid-cols-2 gap-4">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`card p-4 ${index === 0 && !isTie ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  <div className={`w-full h-2 rounded-full bg-gradient-to-r ${team.color} mb-3`} />
                  <h4 className="font-semibold">{team.name}</h4>
                  <p className="text-3xl font-bold mt-2">{team.score}</p>
                  {index === 0 && !isTie && <p className="text-yellow-400 text-sm mt-1">🥇 Переможець</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Category Results */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Результати по категоріях</h3>
            <div className="space-y-3 text-left">
              {state.categoryResults.map((result) => (
                <div key={result.categoryId} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{result.categoryIcon}</span>
                    <span className="font-semibold">{result.categoryName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {result.teamResults.map((tr) => {
                      const team = state.teams.find((t) => t.id === tr.teamId);
                      return (
                        <div key={tr.teamId} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${team?.color}`} />
                            <span className="text-sm">{tr.teamName}</span>
                          </div>
                          <span className={`font-bold ${tr.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tr.score >= 0 ? `+${tr.score}` : tr.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn-secondary w-full mb-4"
          >
            📜 Переглянути всі слова
          </button>

          <div className="flex gap-4">
            <button onClick={handleNewTournament} className="btn-primary flex-1">
              🔄 Новий турнір
            </button>
            <button onClick={handleEndTournament} className="btn-secondary flex-1">
              🏠 На головну
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {state.status === 'waiting' && renderTournamentSetup()}
      {state.status === 'tournament-setup' && renderTournamentSetup()}
      {state.status === 'category-select' && renderCategorySelect()}
      {state.status === 'playing' && renderPlayingScreen()}
      {state.status === 'round-end' && renderRoundEnd()}
      {state.status === 'tournament-end' && renderTournamentEnd()}

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Історія вгаданих слів"
      >
        <WordHistory guessedWords={state.guessedWords} teams={state.teams} />
      </Modal>

      {/* Pause Modal */}
      <Modal
        isOpen={showPauseModal}
        onClose={handleResume}
        title="⏸️ Пауза"
        showCloseButton={false}
      >
        <div className="text-center">
          <p className="text-white/60 mb-6">
            Гра на паузі. Натисніть кнопку, щоб продовжити.
          </p>
          <TeamScores teams={state.teams} currentTeamIndex={state.currentTeamIndex} />
          <div className="flex gap-4 mt-6">
            <button onClick={handleResume} className="btn-primary flex-1">
              ▶️ Продовжити
            </button>
            <button
              onClick={() => {
                setShowPauseModal(false);
                setShowEndGameModal(true);
              }}
              className="btn-danger flex-1"
            >
              🛑 Завершити
            </button>
          </div>
        </div>
      </Modal>

      {/* End Game Confirmation Modal */}
      <Modal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        title="Завершити турнір?"
      >
        <div className="text-center">
          <p className="text-white/60 mb-6">
            Ви впевнені, що хочете завершити турнір? Всі результати буде втрачено.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowEndGameModal(false)}
              className="btn-secondary flex-1"
            >
              Скасувати
            </button>
            <button onClick={handleEndTournament} className="btn-danger flex-1">
              Завершити
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
