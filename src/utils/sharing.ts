import LZString from 'lz-string';
import type { Game, Player, Quarter, SlotKey } from '../types';
import { ALL_SLOTS, QUARTERS } from '../types';

export interface ShareData {
  game: Game;
  players: Player[];
}

export function encodeShare(data: ShareData): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeShare(encoded: string): ShareData | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

/** Short live share URL — just the game UUID. Share view fetches from /api/game/:id */
export function buildShareUrl(gameId: string): string {
  return `${window.location.origin}/share/${gameId}`;
}

/** Sync game+players to Vercel KV so shared links stay live.
 *  Captain's private notes are stripped so they never leave the device. */
export async function syncGameToServer(data: ShareData): Promise<void> {
  try {
    // Never include captainNotes in the shared payload
    const { captainNotes: _omit, ...sharedGame } = data.game;
    const payload: ShareData = { game: sharedGame, players: data.players };
    await fetch(`/api/game/${data.game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // silently fail — app works fully offline without sync
  }
}

export function buildShareText(data: ShareData): string {
  const { game, players } = data;
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  const date = new Date(game.date + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const lines: string[] = [
    '📋 PIVOT — Lineup',
    game.opponent ? `vs ${game.opponent}` : '',
    date,
    '',
  ];

  for (const q of QUARTERS) {
    const lineup = game.quarters[q];
    const entries = ALL_SLOTS.map((slot) => [slot, lineup[slot]] as [SlotKey, string | undefined]).filter(
      ([, pid]) => !!pid
    );
    if (entries.length === 0) continue;
    lines.push(`── Quarter ${q} ──`);
    for (const [slot, pid] of entries) {
      const p = pid ? byId[pid] : null;
      if (p) {
        const note = game.quarterNotes?.[q]?.[slot];
        lines.push(`${slot.padEnd(3)}  ${p.name}${note ? ` (${note})` : ''}`);
      }
    }
    lines.push('');
  }

  if (game.midGameInjuries.length > 0) {
    lines.push('── Injuries ──');
    for (const inj of game.midGameInjuries) {
      const p = byId[inj.playerId];
      if (p) lines.push(`Q${inj.quarter}  ${p.name}: ${inj.description}`);
    }
  }

  return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();
}
