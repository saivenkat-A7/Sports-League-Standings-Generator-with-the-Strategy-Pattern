import { Match } from '../types';
import { StandingsStrategy } from './StandingsStrategy';

export interface TournamentResult {
  roundWinners: string[];
}

/**
 * Knockout rules: no cumulative table. For each match the higher score wins;
 * on a draw the home team advances.
 */
export class TournamentStrategy implements StandingsStrategy<TournamentResult> {
  readonly name = 'tournament';
  readonly outputFileName = 'winners_tournament.json';

  calculate(matches: readonly Match[]): TournamentResult {
    return {
      roundWinners: matches.map((match) =>
        match.awayScore > match.homeScore ? match.awayTeam : match.homeTeam,
      ),
    };
  }

  renderConsole(result: TournamentResult): string {
    if (result.roundWinners.length === 0) {
      return 'No matches to process.';
    }
    const lines = result.roundWinners.map((team, index) => `${index + 1}. ${team}`);
    return ['Round winners:', ...lines].join('\n');
  }

  toJson(result: TournamentResult): unknown {
    return { roundWinners: [...result.roundWinners] };
  }
}
