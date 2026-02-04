import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { Modal } from '../components';

export function Home() {
  const navigate = useNavigate();
  const { state, dispatch, createRoom, joinRoom, loadFromLocalStorage } = useGame();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTeamSetupModal, setShowTeamSetupModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [teamNames, setTeamNames] = useState(['Команда 1', 'Команда 2']);

  const handleCreateRoom = () => {
    createRoom();
    setShowTeamSetupModal(true);
  };

  const handleJoinRoom = () => {
    if (joinCode.length < 4) {
      setJoinError('Код повинен містити мінімум 4 символи');
      return;
    }
    if (joinRoom(joinCode)) {
      setShowJoinModal(false);
      navigate('/game');
    } else {
      setJoinError('Кімнату не знайдено');
    }
  };

  const handleStartTournament = () => {
    // Update team names
    dispatch({
      type: 'SET_TEAMS',
      payload: state.teams.map((team, index) => ({
        ...team,
        name: teamNames[index] || team.name,
        score: 0, // Reset scores
      })),
    });

    setShowTeamSetupModal(false);
    navigate('/game');
  };

  const handleContinueGame = () => {
    if (loadFromLocalStorage()) {
      navigate('/game');
    }
  };

  const hasSavedGame = localStorage.getItem('elias-game-state') !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-glow">
            🎯 ЕЛІАС
          </h1>
          <p className="text-xl text-purple-300">для IT-рекрутерів</p>
          <p className="text-sm text-white/60 mt-2">
            Турнірний режим — грайте категорія за категорією!
          </p>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <button onClick={handleCreateRoom} className="btn-primary w-full text-lg">
            🏆 Створити турнір
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary w-full text-lg"
          >
            🚀 Приєднатись до гри
          </button>

          {hasSavedGame && (
            <button
              onClick={handleContinueGame}
              className="btn-secondary w-full text-lg border-yellow-500/50"
            >
              ⏯️ Продовжити турнір
            </button>
          )}

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => navigate('/admin')}
              className="text-white/60 hover:text-white transition-colors"
            >
              ⚙️ Адмін-панель
            </button>
          </div>
        </div>

        {/* How to play */}
        <div className="mt-12 card p-6 text-left">
          <h3 className="font-semibold mb-4 text-center">📖 Як грати?</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex gap-2">
              <span>1️⃣</span>
              <span>Створіть турнір та оберіть категорії для гри</span>
            </li>
            <li className="flex gap-2">
              <span>2️⃣</span>
              <span>Кожна категорія — окремий раунд. Обидві команди грають її по черзі</span>
            </li>
            <li className="flex gap-2">
              <span>3️⃣</span>
              <span>Пояснюйте слова за 60 секунд. +1 бал за вгадане, −1 за підказку</span>
            </li>
            <li className="flex gap-2">
              <span>4️⃣</span>
              <span>Бали накопичуються протягом всього турніру</span>
            </li>
            <li className="flex gap-2">
              <span>5️⃣</span>
              <span>Після всіх категорій — фінальний екран з переможцем!</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Join Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Приєднатись до гри"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Код кімнати</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              placeholder="Введіть код"
              className="input text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
            />
            {joinError && (
              <p className="text-red-400 text-sm mt-2">{joinError}</p>
            )}
          </div>
          <button
            onClick={handleJoinRoom}
            disabled={!joinCode}
            className="btn-primary w-full"
          >
            Приєднатись
          </button>
        </div>
      </Modal>

      {/* Team Setup Modal */}
      <Modal
        isOpen={showTeamSetupModal}
        onClose={() => setShowTeamSetupModal(false)}
        title="Налаштування команд"
      >
        <div className="space-y-6">
          {/* Room Code */}
          <div className="text-center p-4 bg-purple-500/20 rounded-xl">
            <p className="text-sm text-white/60 mb-1">Код кімнати</p>
            <p className="text-3xl font-bold tracking-widest">{state.roomCode}</p>
            <button
              onClick={() => navigator.clipboard.writeText(state.roomCode)}
              className="text-sm text-purple-300 hover:text-white mt-2"
            >
              📋 Скопіювати
            </button>
          </div>

          {/* Team Names */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Назви команд</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                <input
                  type="text"
                  value={teamNames[0]}
                  onChange={(e) => setTeamNames([e.target.value, teamNames[1]])}
                  placeholder="Команда 1"
                  className="input flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                <input
                  type="text"
                  value={teamNames[1]}
                  onChange={(e) => setTeamNames([teamNames[0], e.target.value])}
                  placeholder="Команда 2"
                  className="input flex-1"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTournament}
            className="btn-success w-full"
          >
            🏆 Налаштувати турнір
          </button>
        </div>
      </Modal>
    </div>
  );
}
