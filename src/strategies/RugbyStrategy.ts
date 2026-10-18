import { formatTable } from '../formatter';
import { Match } from '../types';
import { BaseRecord, Ranked, RankedStrategy } from './RankedStrategy';

export interface RugbyRecord extends BaseRecord {
  triesFor: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  bonusPoints: number;
}

export const RUGBY_RULES = {
  win: 4,
  draw: 2,
  loss: 0,
  attackBonusTries: 4,
  defenseBonusMargin: 7,
} as const;

/**
 * Rugby rules: 4 points for a win, 2 for a draw, 0 for a loss, plus
 *  - attack bonus: 1 point for scoring 4+ tries (win, lose or draw)
 *  - defense bonus: 1 point for losing by 7 points or fewer
 */
export class RugbyStrategy extends RankedStrategy<RugbyRecord> {
  readonly name = 'rugby';
  readonly outputFileName = 'standings_rugby.json';

  protected createRecord(team: string): RugbyRecord {
    return {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      triesFor: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      bonusPoints: 0,
      points: 0,
    };
  }

  protected applyMatch(home: RugbyRecord, away: RugbyRecord, match: Match): void {
    this.updateSide(home, match.homeScore, match.awayScore, match.homeTeamTries);
    this.updateSide(away, match.awayScore, match.homeScore, match.awayTeamTries);
  }

  private updateSide(record: RugbyRecord, scored: number, conceded: number, tries: number): void {
    this.recordResult(record, scored, conceded);
    record.triesFor += tries;
    record.pointsFor += scored;
    record.pointsAgainst += conceded;
    record.pointDifference = record.pointsFor - record.pointsAgainst;

    let bonus = 0;
    if (tries >= RUGBY_RULES.attackBonusTries) bonus += 1;
    if (scored < conceded && conceded - scored <= RUGBY_RULES.defenseBonusMargin) bonus += 1;

    let base: number = RUGBY_RULES.loss;
    if (scored > conceded) base = RUGBY_RULES.win;
    else if (scored === conceded) base = RUGBY_RULES.draw;

    record.bonusPoints += bonus;
    record.points += base + bonus;
  }

  getDifference(record: RugbyRecord): number {
    return record.pointDifference;
  }

  getScored(record: RugbyRecord): number {
    return record.pointsFor;
  }

  renderConsole(result: Ranked<RugbyRecord>[]): string {
    return formatTable(
      ['Rank', 'Team', 'P', 'W', 'D', 'L', 'TF', 'PF', 'PA', 'PD', 'BP', 'Pts'],
      result.map((r) => [
        r.rank,
        r.team,
        r.played,
        r.wins,
        r.draws,
        r.losses,
        r.triesFor,
        r.pointsFor,
        r.pointsAgainst,
        r.pointDifference,
        r.bonusPoints,
        r.points,
      ]),
    );
  }

  toJson(result: Ranked<RugbyRecord>[]): unknown {
    return result.map((r) => ({
      rank: r.rank,
      team: r.team,
      played: r.played,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      pointsFor: r.pointsFor,
      pointsAgainst: r.pointsAgainst,
      pointDifference: r.pointDifference,
      bonusPoints: r.bonusPoints,
      points: r.points,
    }));
  }
}
