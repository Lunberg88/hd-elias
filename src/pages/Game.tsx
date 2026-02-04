import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import {
  Timer,
  WordCard,
  TeamScores,
  CategorySelector,
  Modal,
  WordHistory,
} from '../components';

export function Game() {
  const navigate = useNavigate();
  const { state, dispatch, categories } = useGame();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Redirect to home if no room code
  useEffect(() => {
    if (!state.roomCode) {
      navigate('/');
    }
  }, [state.roomCode, navigate]);

  const currentTeam = state.teams[state.currentTeamIndex];

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

  const handleNextTeam = () => {
    dispatch({ type: 'NEXT_TEAM' });
  };

  const handleToggleCategory = (categoryId: string) => {
    const current = state.selectedCategories;
    const newSelected = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    dispatch({ type: 'SET_SELECTED_CATEGORIES', payload: newSelected });
  };

  const handleSelectAllCategories = () => {
    if (state.selectedCategories.length === categories.length) {
      dispatch({ type: 'SET_SELECTED_CATEGORIES', payload: [] });
    } else {
      dispatch({
        type: 'SET_SELECTED_CATEGORIES',
        payload: categories.map((c) => c.id),
      });
    }
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_TIMER' });
    setShowPauseModal(true);
  };

  const handleResume = () => {
    setShowPauseModal(false);
    dispatch({ type: 'RESUME_TIMER' });
  };

  const handleEndGame = () => {
    localStorage.removeItem('elias-game-state');
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  };

  const handleNewGame = () => {
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATUS', payload: 'category-select' });
    setShowEndGameModal(false);
  };

  // Calculate total words this round
  const currentRoundWords = state.guessedWords.filter(
    (w) => w.teamId === currentTeam?.id
  );

  const renderWaitingScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Очікування гравців...</h2>
        <div className="p-4 bg-purple-500/20 rounded-xl mb-6">
          <p className="text-sm text-white/60 mb-1">Код кімнати</p>
          <p className="text-4xl font-bold tracking-widest">{state.roomCode}</p>
        </div>
        <TeamScores teams={state.teams} currentTeamIndex={0} />
        <button
          onClick={() => dispatch({ type: 'SET_STATUS', payload: 'category-select' })}
          className="btn-primary w-full mt-6"
        >
          Почати гру
        </button>
      </div>
    </div>
  );

  const renderCategorySelect = () => (
    <div className="min-h-screen flex flex-col p-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Раунд {state.roundNumber}</h1>
          <div className="flex items-center justify-center gap-2 text-xl">
            <span
              className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentTeam?.color}`}
            />
            <span className="font-semibold">{currentTeam?.name}</span>
            <span className="text-white/60">пояснює</span>
          </div>
        </div>

        {/* Scores */}
        <div className="mb-8">
          <TeamScores
            teams={state.teams}
            currentTeamIndex={state.currentTeamIndex}
            compact
          />
        </div>

        {/* Category Selection */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Оберіть категорії для цього раунду
          </h2>
          <CategorySelector
            categories={categories}
            selectedCategories={state.selectedCategories}
            onToggleCategory={handleToggleCategory}
            onSelectAll={handleSelectAllCategories}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartRound}
          disabled={state.selectedCategories.length === 0}
          className="btn-success w-full text-xl py-4"
        >
          🎬 Почати раунд!
        </button>
      </div>
    </div>
  );

  const renderPlayingScreen = () => (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full bg-gradient-to-r ${currentTeam?.color}`}
          />
          <span className="font-semibold">{currentTeam?.name}</span>
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

      {/* Scores - Compact */}
      <TeamScores
        teams={state.teams}
        currentTeamIndex={state.currentTeamIndex}
        compact
      />

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {/* Timer */}
        <div className="mb-6">
          <Timer
            seconds={state.timerSeconds}
            maxSeconds={60}
            isRunning={state.isTimerRunning}
            size={150}
          />
        </div>

        {/* Word Card */}
        <div className="w-full max-w-lg mb-6">
          <WordCard
            word={state.currentWord}
            showHint={state.showHint}
            onShowHint={handleUseHint}
            hintUsed={state.hintUsed}
          />
        </div>

        {/* Action Buttons - Host Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <button
            onClick={handleWordGuessed}
            disabled={!state.currentWord}
            className="btn-success flex-1 text-lg"
          >
            ✅ Вгадано! {state.hintUsed ? '(0 балів)' : '(+1 бал)'}
          </button>
          <button
            onClick={handleWordSkipped}
            disabled={!state.currentWord}
            className="btn-danger flex-1 text-lg"
          >
            ⏭️ Пропустити
          </button>
        </div>

        {/* Round Stats */}
        <div className="mt-6 text-center text-white/60">
          <p>
            Вгадано в цьому раунді:{' '}
            <span className="text-white font-bold">
              {currentRoundWords.length}
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  const renderRoundEnd = () => {
    const roundGuessedWords = state.guessedWords.filter(
      (w) =>
        w.teamId === currentTeam?.id &&
        w.timestamp > Date.now() - 120000 // Last 2 minutes
    );

    const roundScore = roundGuessedWords.reduce(
      (sum, w) => sum + (w.usedHint ? 0 : 1),
      0
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-2">⏱️ Час вийшов!</h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span
              className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentTeam?.color}`}
            />
            <span className="text-xl">{currentTeam?.name}</span>
          </div>

          {/* Round Results */}
          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <p className="text-white/60 mb-2">Результат раунду</p>
            <p className="text-5xl font-bold text-green-400 mb-2">
              +{roundScore}
            </p>
            <p className="text-white/60">
              Вгадано слів: {roundGuessedWords.length}
            </p>
          </div>

          {/* Current Scores */}
          <TeamScores teams={state.teams} currentTeamIndex={state.currentTeamIndex} />

          <button onClick={handleNextTeam} className="btn-primary w-full mt-6 text-lg">
            ➡️ Наступна команда
          </button>
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    const winner = [...state.teams].sort((a, b) => b.score - a.score)[0];
    const isTie = state.teams.every((t) => t.score === winner?.score);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-4xl font-bold mb-6">🏆 Гра завершена!</h2>

          {isTie ? (
            <div className="mb-6">
              <p className="text-2xl text-yellow-400">Нічия!</p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-white/60 mb-2">Переможець</p>
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full bg-gradient-to-r ${winner?.color}`}
                />
                <span className="text-3xl font-bold">{winner?.name}</span>
              </div>
              <p className="text-5xl font-bold text-yellow-400 mt-2">
                {winner?.score} балів
              </p>
            </div>
          )}

          {/* Final Scores */}
          <TeamScores
            teams={state.teams}
            currentTeamIndex={-1}
          />

          {/* History */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="btn-secondary w-full mt-6"
          >
            📜 Переглянути історію слів
          </button>

          <div className="flex gap-4 mt-4">
            <button onClick={handleNewGame} className="btn-primary flex-1">
              🔄 Нова гра
            </button>
            <button onClick={handleEndGame} className="btn-secondary flex-1">
              🏠 На головну
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {state.status === 'waiting' && renderWaitingScreen()}
      {state.status === 'category-select' && renderCategorySelect()}
      {state.status === 'playing' && renderPlayingScreen()}
      {state.status === 'round-end' && renderRoundEnd()}
      {state.status === 'game-over' && renderGameOver()}

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
          <TeamScores
            teams={state.teams}
            currentTeamIndex={state.currentTeamIndex}
          />
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
              🛑 Завершити гру
            </button>
          </div>
        </div>
      </Modal>

      {/* End Game Confirmation Modal */}
      <Modal
        isOpen={showEndGameModal}
        onClose={() => setShowEndGameModal(false)}
        title="Завершити гру?"
      >
        <div className="text-center">
          <p className="text-white/60 mb-6">
            Ви впевнені, що хочете завершити гру? Всі результати буде втрачено.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowEndGameModal(false)}
              className="btn-secondary flex-1"
            >
              Скасувати
            </button>
            <button onClick={handleEndGame} className="btn-danger flex-1">
              Завершити
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
