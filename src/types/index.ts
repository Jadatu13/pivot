export type Position = 'GS' | 'GA' | 'WA' | 'C' | 'WD' | 'GD' | 'GK';
export type SlotKey = Position | 'Sub';
export type Quarter = 1 | 2 | 3 | 4;

export const POSITIONS: Position[] = ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'];
export const ALL_SLOTS: SlotKey[] = [...POSITIONS, 'Sub'];
export const QUARTERS: Quarter[] = [1, 2, 3, 4];

export const POSITION_LABELS: Record<Position, string> = {
  GS: 'Goal Shooter',
  GA: 'Goal Attack',
  WA: 'Wing Attack',
  C: 'Centre',
  WD: 'Wing Defence',
  GD: 'Goal Defence',
  GK: 'Goal Keeper',
};

// Visual grouping for colour-coding on the board
export const POSITION_ZONE: Record<Position, 'attack' | 'mid' | 'defence'> = {
  GS: 'attack',
  GA: 'attack',
  WA: 'mid',
  C: 'mid',
  WD: 'mid',
  GD: 'defence',
  GK: 'defence',
};

export interface GameInjury {
  playerId: string;
  quarter: Quarter;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  number?: number;
  preferredPositions: Position[];
  activeInjury?: string;
}

export type QuarterLineup = Partial<Record<SlotKey, string>>;

export interface Game {
  id: string;
  date: string;
  opponent?: string;
  quarters: Record<Quarter, QuarterLineup>;
  midGameInjuries: GameInjury[];
}
