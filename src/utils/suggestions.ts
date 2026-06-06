import type { Game, Player, Quarter, SlotKey, Position } from '../types';
import { POSITIONS } from '../types';

export interface PlayerScore {
  player: Player;
  score: number;
  tags: string[];
  excluded: boolean;
  excludeReason?: string;
  courtTime: number;
}

export function getCourtTime(players: Player[], game: Game, upToQuarter: Quarter): Record<string, number> {
  const ct: Record<string, number> = {};
  for (const p of players) ct[p.id] = 0;
  for (let q = 1; q <= upToQuarter; q++) {
    const lineup = game.quarters[q as Quarter];
    for (const [slot, pid] of Object.entries(lineup)) {
      if (slot !== 'Sub' && pid) ct[pid] = (ct[pid] ?? 0) + 1;
    }
  }
  return ct;
}

export function getMidGameInjuredIds(game: Game, upToQuarter: Quarter): Set<string> {
  return new Set(
    game.midGameInjuries.filter((i) => i.quarter <= upToQuarter).map((i) => i.playerId)
  );
}

export function scorePlayers(
  players: Player[],
  game: Game,
  quarter: Quarter,
  slot: SlotKey
): PlayerScore[] {
  const prevQuarter = quarter > 1 ? ((quarter - 1) as Quarter) : null;
  const currentLineup = game.quarters[quarter];
  const prevLineup = prevQuarter ? game.quarters[prevQuarter] : null;
  const courtTime = getCourtTime(players, game, quarter > 1 ? ((quarter - 1) as Quarter) : 0 as Quarter);
  const injuredIds = getMidGameInjuredIds(game, quarter);

  return players
    .map((player): PlayerScore => {
      const tags: string[] = [];
      let score = 0;
      let excluded = false;
      let excludeReason: string | undefined;

      // Already assigned elsewhere this quarter
      const otherSlot = Object.entries(currentLineup).find(
        ([s, pid]) => pid === player.id && s !== slot
      );
      if (otherSlot) {
        excluded = true;
        excludeReason = `Playing ${otherSlot[0]}`;
      }

      // Mid-game injury
      if (injuredIds.has(player.id)) {
        const inj = game.midGameInjuries.find((i) => i.playerId === player.id);
        excluded = true;
        excludeReason = `Injured Q${inj?.quarter}`;
      }

      if (!excluded) {
        // Pre-game injury
        if (player.activeInjury) {
          score -= 40;
          tags.push('Pre-game injury');
        }

        // Preferred position
        if (slot !== 'Sub' && player.preferredPositions.includes(slot as Position)) {
          score += 30;
          tags.push('Preferred');
        }

        const ct = courtTime[player.id] ?? 0;

        // Hasn't played yet this game
        if (ct === 0) {
          score += 25;
          tags.push("Hasn't played");
        } else {
          score -= ct * 6;
        }

        // Was sub last quarter
        if (prevLineup?.Sub === player.id) {
          score += 18;
          tags.push('Was sub');
        }

        // Sat out last quarter entirely
        if (prevLineup && !Object.values(prevLineup).includes(player.id)) {
          score += 12;
          tags.push('Sat out last Q');
        }
      }

      return { player, score, tags, excluded, excludeReason, courtTime: courtTime[player.id] ?? 0 };
    })
    .sort((a, b) => {
      if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
      return b.score - a.score;
    });
}

export interface GameTip {
  type: 'warning' | 'rotation' | 'info';
  text: string;
}

export function getGameTips(players: Player[], game: Game, quarter: Quarter): GameTip[] {
  const tips: GameTip[] = [];
  const injuredIds = getMidGameInjuredIds(game, quarter);
  const courtTime = getCourtTime(players, game, quarter > 1 ? ((quarter - 1) as Quarter) : 0 as Quarter);
  const currentLineup = game.quarters[quarter];

  for (const player of players) {
    if (injuredIds.has(player.id)) {
      const inj = game.midGameInjuries.find((i) => i.playerId === player.id);
      tips.push({ type: 'warning', text: `${player.name} injured Q${inj?.quarter} — excluded from lineup` });
      continue;
    }
    if (player.activeInjury) {
      tips.push({ type: 'warning', text: `${player.name}: ${player.activeInjury}` });
    }
    if (quarter > 1 && (courtTime[player.id] ?? 0) === 0) {
      tips.push({ type: 'rotation', text: `${player.name} hasn't been on court yet` });
    }
  }

  // Position mismatches for current quarter
  for (const [slot, pid] of Object.entries(currentLineup)) {
    if (slot === 'Sub' || !pid) continue;
    const player = players.find((p) => p.id === pid);
    if (!player || player.preferredPositions.length === 0) continue;
    if (POSITIONS.includes(slot as Position) && !player.preferredPositions.includes(slot as Position)) {
      tips.push({ type: 'info', text: `${player.name} in ${slot} (outside preferred positions)` });
    }
  }

  return tips;
}
