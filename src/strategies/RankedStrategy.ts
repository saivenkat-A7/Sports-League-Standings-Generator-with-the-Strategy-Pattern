import { Match } from '../types';
import { RankingRules, rankTeams } from '../tiebreakers';
import { StandingsStrategy } from './StandingsStrategy';

/** Fields every league-table record has, whatever the sport. */
export interface BaseRecord {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export type Ranked<T> = { rank: number } & T;

/**
 * Template for strategies that produce a cumulative league table. Subclasses
 * only describe how one match updates two team records; aggregation, ranking
 * (with tie-breakers) and rendering plumbing live here.
 */
export abstract class RankedStrategy<TRecord extends BaseRecord>
  implements StandingsStrategy<Ranked<TRecord>[]>, RankingRules<TRecord>
{
  abstract readonly name: string;
  abstract readonly outputFileName: string;

  protected abstract createRecord(team: string): TRecord;
  /** Updates both records in place for a single match. */
  protected abstract applyMatch(home: TRecord, away: TRecord, match: Match): void;
  abstract getDifference(record: TRecord): number;
  abstract getScored(record: TRecord): number;
  abstract renderConsole(result: Ranked<TRecord>[]): string;
  abstract toJson(result: Ranked<TRecord>[]): unknown;

  getPoints(record: TRecord): number {
    return record.points;
  }

  /** Aggregates matches into unsorted team records. */
  computeRecords(matches: readonly Match[]): TRecord[] {
    const records = new Map<string, TRecord>();
    const recordFor = (team: string): TRecord => {
      let record = records.get(team);
      if (!record) {
        record = this.createRecord(team);
        records.set(team, record);
      }
      return record;
    };
    for (const match of matches) {
      this.applyMatch(recordFor(match.homeTeam), recordFor(match.awayTeam), match);
    }
    return [...records.values()];
  }

  calculate(matches: readonly Match[]): Ranked<TRecord>[] {
    return rankTeams(this.computeRecords(matches), matches, this).map((record, index) => ({
      rank: index + 1,
      ...record,
    }));
  }

  /** Increments played and the W/D/L counter for one side of a match. */
  protected recordResult(record: TRecord, scored: number, conceded: number): void {
    record.played += 1;
    if (scored > conceded) record.wins += 1;
    else if (scored === conceded) record.draws += 1;
    else record.losses += 1;
  }
}
