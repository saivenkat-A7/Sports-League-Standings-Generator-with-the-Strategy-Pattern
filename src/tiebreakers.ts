import { Match } from './types';

/**
 * What the ranking algorithm needs to know about a league format. Strategies
 * that produce league tables implement this so the tie-breaking code stays
 * independent from any particular scoring system.
 */
export interface RankingRules<TRecord extends { team: string }> {
  getPoints(record: TRecord): number;
  /** Goal difference (classic) or point difference (rugby). */
  getDifference(record: TRecord): number;
  /** Goals for (classic) or points for (rugby). */
  getScored(record: TRecord): number;
  /** Builds fresh records for the given matches using the format's scoring. */
  computeRecords(matches: readonly Match[]): TRecord[];
}

/**
 * Orders records by:
 *   1. total points (desc)
 *   2. goal/point difference (desc)
 *   3. goals/points for (desc)
 *   4. head-to-head mini-league points among the still-tied teams (desc)
 *   5. team name (asc)
 */
export function rankTeams<TRecord extends { team: string }>(
  records: readonly TRecord[],
  matches: readonly Match[],
  rules: RankingRules<TRecord>,
): TRecord[] {
  const sorted = [...records].sort(
    (a, b) =>
      rules.getPoints(b) - rules.getPoints(a) ||
      rules.getDifference(b) - rules.getDifference(a) ||
      rules.getScored(b) - rules.getScored(a) ||
      compareNames(a.team, b.team),
  );

  const ranked: TRecord[] = [];
  let start = 0;
  while (start < sorted.length) {
    let end = start + 1;
    while (end < sorted.length && isTied(sorted[start], sorted[end], rules)) {
      end++;
    }
    const group = sorted.slice(start, end);
    ranked.push(...(group.length > 1 ? resolveHeadToHead(group, matches, rules) : group));
    start = end;
  }
  return ranked;
}

function isTied<TRecord extends { team: string }>(
  a: TRecord,
  b: TRecord,
  rules: RankingRules<TRecord>,
): boolean {
  return (
    rules.getPoints(a) === rules.getPoints(b) &&
    rules.getDifference(a) === rules.getDifference(b) &&
    rules.getScored(a) === rules.getScored(b)
  );
}

/**
 * Builds a mini-league from only the matches played between the tied teams,
 * re-calculating points for that subset, and ranks the teams by those points.
 * Teams still level are ordered alphabetically.
 */
function resolveHeadToHead<TRecord extends { team: string }>(
  tied: readonly TRecord[],
  matches: readonly Match[],
  rules: RankingRules<TRecord>,
): TRecord[] {
  const names = new Set(tied.map((record) => record.team));
  const headToHeadMatches = matches.filter(
    (match) => names.has(match.homeTeam) && names.has(match.awayTeam),
  );
  const miniLeaguePoints = new Map<string, number>();
  for (const record of rules.computeRecords(headToHeadMatches)) {
    miniLeaguePoints.set(record.team, rules.getPoints(record));
  }
  const pointsOf = (record: TRecord): number => miniLeaguePoints.get(record.team) ?? 0;

  return [...tied].sort(
    (a, b) => pointsOf(b) - pointsOf(a) || compareNames(a.team, b.team),
  );
}

function compareNames(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
