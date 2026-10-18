import { Match } from '../src/types';

/** Shorthand builder for contrived match data. */
export function match(
  homeTeam: string,
  homeScore: number,
  awayScore: number,
  awayTeam: string,
  tries: { home?: number; away?: number } = {},
): Match {
  return {
    date: '2023-01-01',
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeTeamTries: tries.home ?? 0,
    awayTeamTries: tries.away ?? 0,
  };
}
