export interface Word {
  word: string;
  hint: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  words: Word[];
}

export interface WordsData {
  categories: Category[];
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  players: Player[];
  score: number;
}

export interface GuessedWord {
  word: string;
  teamId: string;
  usedHint: boolean;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  status: 'waiting' | 'category-select' | 'playing' | 'round-end' | 'game-over';
  teams: Team[];
  currentTeamIndex: number;
  currentWord: Word | null;
  currentCategory: Category | null;
  selectedCategories: string[];
  wordsQueue: Word[];
  guessedWords: GuessedWord[];
  skippedWords: Word[];
  timerSeconds: number;
  isTimerRunning: boolean;
  roundNumber: number;
  totalRounds: number;
  hintUsed: boolean;
  showHint: boolean;
}

export interface RoomSettings {
  timerDuration: number;
  totalRounds: number;
  pointsPerWord: number;
  hintPenalty: number;
}

export type GameAction =
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_STATUS'; payload: GameState['status'] }
  | { type: 'ADD_PLAYER'; payload: { teamId: string; player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { teamId: string; playerId: string } }
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'SELECT_CATEGORY'; payload: Category }
  | { type: 'SET_SELECTED_CATEGORIES'; payload: string[] }
  | { type: 'START_ROUND' }
  | { type: 'NEXT_WORD' }
  | { type: 'WORD_GUESSED' }
  | { type: 'WORD_SKIPPED' }
  | { type: 'USE_HINT' }
  | { type: 'TICK_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'END_ROUND' }
  | { type: 'NEXT_TEAM' }
  | { type: 'UPDATE_SCORE'; payload: { teamId: string; score: number } }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; payload: GameState };

export interface PeerMessage {
  type: 'sync' | 'action' | 'join' | 'leave' | 'ping' | 'pong';
  payload?: any;
  senderId?: string;
  senderName?: string;
}
