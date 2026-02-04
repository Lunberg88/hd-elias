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
  categoryId: string;
  usedHint: boolean;
  timestamp: number;
}

// Results for a single category round
export interface CategoryRoundResult {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  teamResults: {
    teamId: string;
    teamName: string;
    wordsGuessed: number;
    wordsWithHint: number;
    score: number;
  }[];
}

export interface GameState {
  roomCode: string;
  status: 'waiting' | 'tournament-setup' | 'category-select' | 'playing' | 'round-end' | 'tournament-end';
  teams: Team[];
  currentTeamIndex: number;
  currentWord: Word | null;
  currentCategoryId: string | null;
  // Tournament settings
  tournamentCategories: string[]; // Categories selected for the tournament
  playedCategories: string[]; // Categories that have been completed by all teams
  currentRoundTeamsPlayed: string[]; // Which teams have played current category
  // Round state
  wordsQueue: Word[];
  guessedWords: GuessedWord[];
  skippedWords: Word[];
  timerSeconds: number;
  isTimerRunning: boolean;
  hintUsed: boolean;
  showHint: boolean;
  // Results tracking
  categoryResults: CategoryRoundResult[];
}

export interface RoomSettings {
  timerDuration: number;
  pointsPerWord: number;
  hintPenalty: number;
}

export type GameAction =
  | { type: 'SET_ROOM_CODE'; payload: string }
  | { type: 'SET_STATUS'; payload: GameState['status'] }
  | { type: 'ADD_PLAYER'; payload: { teamId: string; player: Player } }
  | { type: 'REMOVE_PLAYER'; payload: { teamId: string; playerId: string } }
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'SET_TOURNAMENT_CATEGORIES'; payload: string[] }
  | { type: 'SELECT_CATEGORY'; payload: string }
  | { type: 'START_ROUND' }
  | { type: 'NEXT_WORD' }
  | { type: 'WORD_GUESSED' }
  | { type: 'WORD_SKIPPED' }
  | { type: 'USE_HINT' }
  | { type: 'TICK_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'END_ROUND' }
  | { type: 'FINISH_TEAM_TURN' }
  | { type: 'NEXT_CATEGORY' }
  | { type: 'UPDATE_SCORE'; payload: { teamId: string; score: number } }
  | { type: 'RESET_GAME' }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'LOAD_STATE'; payload: GameState };

export interface PeerMessage {
  type: 'sync' | 'action' | 'join' | 'leave' | 'ping' | 'pong';
  payload?: any;
  senderId?: string;
  senderName?: string;
}
