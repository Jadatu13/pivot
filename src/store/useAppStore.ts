import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Game, Quarter, SlotKey, GameInjury, QuarterLineup, QuarterNotes } from '../types';

const DEFAULT_PLAYERS: Player[] = [
  'Leah', 'Indy', 'Arwen', 'Lauren', 'Lani', 'Harmony', 'Katana', 'Steph',
].map((name) => ({ id: crypto.randomUUID(), name, preferredPositions: [] }));

interface AppStore {
  players: Player[];
  games: Game[];
  activeGameId: string | null;

  addPlayer: (p: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void;
  deletePlayer: (id: string) => void;

  createGame: (date: string, opponent?: string) => string;
  deleteGame: (id: string) => void;
  setActiveGame: (id: string | null) => void;
  updateGame: (id: string, updates: Partial<Pick<Game, 'date' | 'opponent'>>) => void;

  assignPlayer: (gameId: string, quarter: Quarter, slot: SlotKey, playerId: string | undefined) => void;
  copyQuarter: (gameId: string, from: Quarter, to: Quarter) => void;
  setSlotNote: (gameId: string, quarter: Quarter, slot: SlotKey, note: string) => void;

  addMidGameInjury: (gameId: string, injury: GameInjury) => void;
  removeMidGameInjury: (gameId: string, playerId: string) => void;
}

const emptyQuarters = (): Record<Quarter, QuarterLineup> => ({ 1: {}, 2: {}, 3: {}, 4: {} });
const emptyNotes = (): Record<Quarter, QuarterNotes> => ({ 1: {}, 2: {}, 3: {}, 4: {} });

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      players: DEFAULT_PLAYERS,
      games: [],
      activeGameId: null,

      addPlayer: (p) =>
        set((s) => ({ players: [...s.players, { ...p, id: crypto.randomUUID() }] })),

      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deletePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      createGame: (date, opponent) => {
        const id = crypto.randomUUID();
        set((s) => ({
          games: [
            { id, date, opponent, quarters: emptyQuarters(), quarterNotes: emptyNotes(), midGameInjuries: [] },
            ...s.games,
          ],
          activeGameId: id,
        }));
        return id;
      },

      deleteGame: (id) =>
        set((s) => ({
          games: s.games.filter((g) => g.id !== id),
          activeGameId:
            s.activeGameId === id ? (s.games.find((g) => g.id !== id)?.id ?? null) : s.activeGameId,
        })),

      setActiveGame: (id) => set({ activeGameId: id }),

      updateGame: (id, updates) =>
        set((s) => ({
          games: s.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      assignPlayer: (gameId, quarter, slot, playerId) =>
        set((s) => ({
          games: s.games.map((g) => {
            if (g.id !== gameId) return g;
            const q: QuarterLineup = { ...g.quarters[quarter] };
            if (playerId === undefined) {
              delete q[slot];
            } else {
              // Remove this player from any other slot in this quarter first
              for (const k of Object.keys(q) as SlotKey[]) {
                if (q[k] === playerId) delete q[k];
              }
              q[slot] = playerId;
            }
            return { ...g, quarters: { ...g.quarters, [quarter]: q } };
          }),
        })),

      copyQuarter: (gameId, from, to) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId
              ? g
              : { ...g, quarters: { ...g.quarters, [to]: { ...g.quarters[from] } } }
          ),
        })),

      setSlotNote: (gameId, quarter, slot, note) =>
        set((s) => ({
          games: s.games.map((g) => {
            if (g.id !== gameId) return g;
            const notes = g.quarterNotes ?? emptyNotes();
            return {
              ...g,
              quarterNotes: {
                ...notes,
                [quarter]: { ...notes[quarter], [slot]: note || undefined },
              },
            };
          }),
        })),

      addMidGameInjury: (gameId, injury) =>
        set((s) => ({
          games: s.games.map((g) => {
            if (g.id !== gameId) return g;
            const rest = g.midGameInjuries.filter((i) => i.playerId !== injury.playerId);
            return { ...g, midGameInjuries: [...rest, injury] };
          }),
        })),

      removeMidGameInjury: (gameId, playerId) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id !== gameId
              ? g
              : { ...g, midGameInjuries: g.midGameInjuries.filter((i) => i.playerId !== playerId) }
          ),
        })),
    }),
    {
      name: 'pivot-v1',
      version: 2,
      migrate: (stored: any, fromVersion: number) => {
        if (fromVersion === 0 && (!stored.players || stored.players.length === 0)) {
          stored = { ...stored, players: DEFAULT_PLAYERS };
        }
        if (fromVersion <= 1) {
          // Fix typo Harmonie → Harmony
          stored = {
            ...stored,
            players: (stored.players ?? []).map((p: any) =>
              p.name === 'Harmonie' ? { ...p, name: 'Harmony' } : p
            ),
            // Backfill quarterNotes on existing games
            games: (stored.games ?? []).map((g: any) => ({
              ...g,
              quarterNotes: g.quarterNotes ?? emptyNotes(),
            })),
          };
        }
        return stored;
      },
    }
  )
);

// Convenience selectors
export const selectActiveGame = (s: AppStore) =>
  s.games.find((g) => g.id === s.activeGameId);

export const selectPlayerById = (players: Player[]) =>
  Object.fromEntries(players.map((p) => [p.id, p]));

export const selectSortedPlayers = (s: AppStore) =>
  [...s.players].sort((a, b) => a.name.localeCompare(b.name));
