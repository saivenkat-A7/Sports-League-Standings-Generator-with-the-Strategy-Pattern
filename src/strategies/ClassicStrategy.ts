import { formatTable } from '../formatter';
import { Match } from '../types';
import { BaseRecord, Ranked, RankedStrategy } from './RankedStrategy';

export interface ClassicRecord extends BaseRecord {
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export const CLASSIC_POINTS = { win: 3, draw: 1, loss: 0 } as const;

/** Soccer rules: 3 points for a win, 1 for a draw, 0 for a loss. */
export class ClassicStrategy extends RankedStrategy<ClassicRecord> {
  readonly name = 'classic';
  readonly outputFileName = 'standings_classic.json';

  protected createRecord(team: string): ClassicRecord {
    return {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  protected applyMatch(home: ClassicRecord, away: ClassicRecord, match: Match): void {
    this.updateSide(home, match.homeScore, match.awayScore);
    this.updateSide(away, match.awayScore, match.homeScore);
  }

  private updateSide(record: ClassicRecord, scored: number, conceded: number): void {
    this.recordResult(record, scored, conceded);
    record.goalsFor += scored;
    record.goalsAgainst += conceded;
    record.goalDifference = record.goalsFor - record.goalsAgainst;
    if (scored > conceded) record.points += CLASSIC_POINTS.win;
    else if (scored === conceded) record.points += CLASSIC_POINTS.draw;
    else record.points += CLASSIC_POINTS.loss;
  }

  getDifference(record: ClassicRecord): number {
    return record.goalDifference;
  }

  getScored(record: ClassicRecord): number {
    return record.goalsFor;
  }

  renderConsole(result: Ranked<ClassicRecord>[]): string {
    return formatTable(
      ['Rank', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
      result.map((r) => [
        r.rank,
        r.team,
        r.played,
        r.wins,
        r.draws,
        r.losses,
        r.goalsFor,
        r.goalsAgainst,
        r.goalDifference,
        r.points,
      ]),
    );
  }

  toJson(result: Ranked<ClassicRecord>[]): unknown {
    return result.map((r) => ({
      rank: r.rank,
      team: r.team,
      played: r.played,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDifference: r.goalDifference,
      points: r.points,
    }));
  }
}
