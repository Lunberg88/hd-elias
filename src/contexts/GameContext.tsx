import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction, Team, Category, GuessedWord, CategoryRoundResult } from '../types';
import defaultWordsData from '../data/words.json';

const TIMER_DURATION = 60;
const POINTS_PER_WORD = 1;
const HINT_PENALTY = 1;
const WORDS_STORAGE_KEY = 'elias-words-data';

const initialTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Команда 1',
    color: 'from-blue-500 to-cyan-500',
    players: [],
    score: 0,
  },
  {
    id: 'team-2',
    name: 'Команда 2',
    color: 'from-pink-500 to-rose-500',
    players: [],
    score: 0,
  },
];

const initialState: GameState = {
  roomCode: '',
  status: 'waiting',
  teams: initialTeams,
  currentTeamIndex: 0,
  currentWord: null,
  currentCategoryId: null,
  tournamentCategories: [],
  playedCategories: [],
  currentRoundTeamsPlayed: [],
  wordsQueue: [],
  guessedWords: [],
  skippedWords: [],
  timerSeconds: TIMER_DURATION,
  isTimerRunning: false,
  hintUsed: false,
  showHint: false,
  categoryResults: [],
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function loadCategories(): Category[] {
  const saved = localStorage.getItem(WORDS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        return parsed.categories;
      }
    } catch {
      // Fall through to default
    }
  }
  return defaultWordsData.categories as Category[];
}

function createGameReducer(getCategories: () => Category[]) {
  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'SET_ROOM_CODE':
        return { ...state, roomCode: action.payload };

      case 'SET_STATUS':
        return { ...state, status: action.payload };

      case 'ADD_PLAYER': {
        const { teamId, player } = action.payload;
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === teamId
              ? { ...team, players: [...team.players, player] }
              : team
          ),
        };
      }

      case 'REMOVE_PLAYER': {
        const { teamId, playerId } = action.payload;
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === teamId
              ? { ...team, players: team.players.filter((p) => p.id !== playerId) }
              : team
          ),
        };
      }

      case 'SET_TEAMS':
        return { ...state, teams: action.payload };

      case 'SET_TOURNAMENT_CATEGORIES':
        return { ...state, tournamentCategories: action.payload };

      case 'SELECT_CATEGORY':
        return {
          ...state,
          currentCategoryId: action.payload,
          currentRoundTeamsPlayed: [],
        };

      case 'START_ROUND': {
        const categories = getCategories();
        const category = categories.find((c) => c.id === state.currentCategoryId);

        if (!category) return state;

        const shuffledWords = shuffleArray([...category.words]);
        const [firstWord, ...restWords] = shuffledWords;

        return {
          ...state,
          status: 'playing',
          wordsQueue: restWords,
          currentWord: firstWord || null,
          timerSeconds: TIMER_DURATION,
          isTimerRunning: true,
          hintUsed: false,
          showHint: false,
          skippedWords: [],
        };
      }

      case 'NEXT_WORD': {
        const [nextWord, ...restWords] = state.wordsQueue;
        return {
          ...state,
          currentWord: nextWord || null,
          wordsQueue: restWords,
          hintUsed: false,
          showHint: false,
        };
      }

      case 'WORD_GUESSED': {
        if (!state.currentWord || !state.currentCategoryId) return state;

        const currentTeam = state.teams[state.currentTeamIndex];

        const guessedWord: GuessedWord = {
          word: state.currentWord.word,
          teamId: currentTeam.id,
          categoryId: state.currentCategoryId,
          usedHint: state.hintUsed,
          timestamp: Date.now(),
        };

        // Calculate points: +1 without hint, -1 with hint
        const pointChange = state.hintUsed ? -HINT_PENALTY : POINTS_PER_WORD;

        const updatedTeams = state.teams.map((team, index) =>
          index === state.currentTeamIndex
            ? { ...team, score: Math.max(0, team.score + pointChange) }
            : team
        );

        const [nextWord, ...restWords] = state.wordsQueue;

        // If no more words, end the turn
        if (!nextWord) {
          return {
            ...state,
            teams: updatedTeams,
            guessedWords: [...state.guessedWords, guessedWord],
            currentWord: null,
            wordsQueue: [],
            hintUsed: false,
            showHint: false,
            isTimerRunning: false,
            status: 'round-end',
          };
        }

        return {
          ...state,
          teams: updatedTeams,
          guessedWords: [...state.guessedWords, guessedWord],
          currentWord: nextWord,
          wordsQueue: restWords,
          hintUsed: false,
          showHint: false,
          timerSeconds: TIMER_DURATION,
        };
      }

      case 'WORD_SKIPPED': {
        if (!state.currentWord) return state;

        const [nextWord, ...restWords] = state.wordsQueue;

        if (!nextWord) {
          return {
            ...state,
            skippedWords: [...state.skippedWords, state.currentWord],
            currentWord: null,
            wordsQueue: [],
            hintUsed: false,
            showHint: false,
            isTimerRunning: false,
            status: 'round-end',
          };
        }

        return {
          ...state,
          skippedWords: [...state.skippedWords, state.currentWord],
          currentWord: nextWord,
          wordsQueue: restWords,
          hintUsed: false,
          showHint: false,
          timerSeconds: TIMER_DURATION,
        };
      }

      case 'USE_HINT':
        return { ...state, hintUsed: true, showHint: true };

      case 'TICK_TIMER': {
        if (state.timerSeconds <= 1) {
          return {
            ...state,
            timerSeconds: 0,
            isTimerRunning: false,
            status: 'round-end',
          };
        }
        return { ...state, timerSeconds: state.timerSeconds - 1 };
      }

      case 'PAUSE_TIMER':
        return { ...state, isTimerRunning: false };

      case 'RESUME_TIMER':
        return { ...state, isTimerRunning: true };

      case 'END_ROUND':
        return {
          ...state,
          status: 'round-end',
          isTimerRunning: false,
        };

      case 'FINISH_TEAM_TURN': {
        const currentTeam = state.teams[state.currentTeamIndex];
        const updatedTeamsPlayed = [...state.currentRoundTeamsPlayed, currentTeam.id];
        const allTeamsPlayed = updatedTeamsPlayed.length >= state.teams.length;

        if (allTeamsPlayed) {
          // All teams have played this category - save results and mark category as complete
          const categories = getCategories();
          const category = categories.find((c) => c.id === state.currentCategoryId);

          const categoryResult: CategoryRoundResult = {
            categoryId: state.currentCategoryId || '',
            categoryName: category?.name || '',
            categoryIcon: category?.icon || '',
            teamResults: state.teams.map((team) => {
              const teamWords = state.guessedWords.filter(
                (w) => w.teamId === team.id && w.categoryId === state.currentCategoryId
              );
              const wordsWithHint = teamWords.filter((w) => w.usedHint).length;
              const wordsWithoutHint = teamWords.length - wordsWithHint;
              const score = wordsWithoutHint - wordsWithHint;

              return {
                teamId: team.id,
                teamName: team.name,
                wordsGuessed: teamWords.length,
                wordsWithHint,
                score,
              };
            }),
          };

          const updatedPlayedCategories = [...state.playedCategories, state.currentCategoryId || ''];
          const allCategoriesPlayed = state.tournamentCategories.every(
            (catId) => updatedPlayedCategories.includes(catId)
          );

          return {
            ...state,
            currentRoundTeamsPlayed: updatedTeamsPlayed,
            playedCategories: updatedPlayedCategories,
            categoryResults: [...state.categoryResults, categoryResult],
            status: allCategoriesPlayed ? 'tournament-end' : 'category-select',
            currentCategoryId: allCategoriesPlayed ? state.currentCategoryId : null,
            currentTeamIndex: 0,
          };
        }

        // Next team plays the same category
        const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;

        return {
          ...state,
          currentRoundTeamsPlayed: updatedTeamsPlayed,
          currentTeamIndex: nextTeamIndex,
          status: 'category-select', // Back to category select to show "Start Round" for next team
          timerSeconds: TIMER_DURATION,
          hintUsed: false,
          showHint: false,
        };
      }

      case 'NEXT_CATEGORY': {
        return {
          ...state,
          currentCategoryId: null,
          currentRoundTeamsPlayed: [],
          status: 'category-select',
        };
      }

      case 'UPDATE_SCORE': {
        const { teamId, score } = action.payload;
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === teamId ? { ...team, score } : team
          ),
        };
      }

      case 'RESET_GAME':
        return {
          ...initialState,
          roomCode: state.roomCode,
          teams: state.teams.map((team) => ({ ...team, score: 0 })),
        };

      case 'RESET_TOURNAMENT':
        return {
          ...state,
          status: 'tournament-setup',
          currentTeamIndex: 0,
          currentCategoryId: null,
          tournamentCategories: [],
          playedCategories: [],
          currentRoundTeamsPlayed: [],
          wordsQueue: [],
          guessedWords: [],
          skippedWords: [],
          timerSeconds: TIMER_DURATION,
          isTimerRunning: false,
          hintUsed: false,
          showHint: false,
          categoryResults: [],
          teams: state.teams.map((team) => ({ ...team, score: 0 })),
        };

      case 'LOAD_STATE':
        return action.payload;

      default:
        return state;
    }
  };
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  categories: Category[];
  createRoom: () => string;
  joinRoom: (code: string) => boolean;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  refreshCategories: () => void;
  getCategoryById: (id: string) => Category | undefined;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gameReducer = useCallback(createGameReducer(() => categories), [categories]);
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const refreshCategories = useCallback(() => {
    setCategories(loadCategories());
  }, []);

  const getCategoryById = useCallback((id: string) => {
    return categories.find((c) => c.id === id);
  }, [categories]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WORDS_STORAGE_KEY) {
        refreshCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshCategories]);

  const generateRoomCode = useCallback((): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const createRoom = useCallback((): string => {
    refreshCategories();
    const code = generateRoomCode();
    dispatch({ type: 'SET_ROOM_CODE', payload: code });
    dispatch({ type: 'SET_STATUS', payload: 'tournament-setup' });
    return code;
  }, [generateRoomCode, refreshCategories]);

  const joinRoom = useCallback((code: string): boolean => {
    refreshCategories();
    dispatch({ type: 'SET_ROOM_CODE', payload: code.toUpperCase() });
    return true;
  }, [refreshCategories]);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('elias-game-state', JSON.stringify(state));
  }, [state]);

  const loadFromLocalStorage = useCallback((): boolean => {
    const saved = localStorage.getItem('elias-game-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (state.roomCode) {
      saveToLocalStorage();
    }
  }, [state, saveToLocalStorage]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isTimerRunning && state.timerSeconds > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isTimerRunning, state.timerSeconds]);

  const value: GameContextType = {
    state,
    dispatch,
    categories,
    createRoom,
    joinRoom,
    saveToLocalStorage,
    loadFromLocalStorage,
    refreshCategories,
    getCategoryById,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
