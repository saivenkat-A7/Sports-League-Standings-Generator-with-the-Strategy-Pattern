import { ClassicStrategy } from '../src/strategies/ClassicStrategy';
import { RugbyStrategy } from '../src/strategies/RugbyStrategy';
import { TournamentStrategy } from '../src/strategies/TournamentStrategy';
import { createStrategy } from '../src/strategies';
import { match } from './helpers';

describe('ClassicStrategy points calculation', () => {
  const strategy = new ClassicStrategy();

  it('awards 3 points for a win and 0 for a loss', () => {
    const table = strategy.calculate([match('Home', 2, 0, 'Away')]);
    const home = table.find((r) => r.team === 'Home')!;
    const away = table.find((r) => r.team === 'Away')!;
    expect(home.points).toBe(3);
    expect(home.wins).toBe(1);
    expect(away.points).toBe(0);
    expect(away.losses).toBe(1);
  });

  it('awards 1 point each for a draw', () => {
    const table = strategy.calculate([match('Home', 1, 1, 'Away')]);
    expect(table.map((r) => r.points)).toEqual([1, 1]);
    expect(table.map((r) => r.draws)).toEqual([1, 1]);
  });

  it('tracks P, W, D, L, GF, GA and GD across several matches', () => {
    const table = strategy.calculate([
      match('Team A', 3, 1, 'Team B'),
      match('Team C', 2, 2, 'Team D'),
      match('Team A', 1, 1, 'Team C'),
    ]);
    expect(table).toEqual([
      { rank: 1, team: 'Team A', played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 4 },
      { rank: 2, team: 'Team C', played: 2, wins: 0, draws: 2, losses: 0, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 2 },
      { rank: 3, team: 'Team D', played: 1, wins: 0, draws: 1, losses: 0, goalsFor: 2, goalsAgainst: 2, goalDifference: 0, points: 1 },
      { rank: 4, team: 'Team B', played: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
    ]);
  });

  it('returns an empty table for no matches', () => {
    expect(strategy.calculate([])).toEqual([]);
  });

  it('renders a table with Rank, Team and Pts headers and writes the spec JSON shape', () => {
    const table = strategy.calculate([match('Team A', 3, 1, 'Team B')]);
    const text = strategy.renderConsole(table);
    expect(text).toContain('Rank');
    expect(text).toContain('Team');
    expect(text).toContain('Pts');
    const json = strategy.toJson(table) as Array<Record<string, unknown>>;
    expect(Object.keys(json[0])).toEqual([
      'rank', 'team', 'played', 'wins', 'draws', 'losses',
      'goalsFor', 'goalsAgainst', 'goalDifference', 'points',
    ]);
  });
});

describe('RugbyStrategy points calculation', () => {
  const strategy = new RugbyStrategy();
  const row = (matches: ReturnType<typeof match>[], team: string) =>
    strategy.calculate(matches).find((r) => r.team === team)!;

  it('awards 4 points for a win and 0 for a loss (no bonuses)', () => {
    const matches = [match('Home', 20, 10, 'Away', { home: 2, away: 1 })];
    expect(row(matches, 'Home').points).toBe(4);
    expect(row(matches, 'Away').points).toBe(0);
    expect(row(matches, 'Away').bonusPoints).toBe(0);
  });

  it('awards 2 points each for a draw', () => {
    const matches = [match('Home', 15, 15, 'Away', { home: 1, away: 1 })];
    expect(row(matches, 'Home').points).toBe(2);
    expect(row(matches, 'Away').points).toBe(2);
  });

  it('awards an attack bonus for 4+ tries to a winner', () => {
    const matches = [match('Home', 30, 10, 'Away', { home: 4, away: 1 })];
    expect(row(matches, 'Home').points).toBe(5);
    expect(row(matches, 'Home').bonusPoints).toBe(1);
  });

  it('awards an attack bonus for 4+ tries even in a heavy loss', () => {
    const matches = [match('Home', 40, 28, 'Away', { home: 5, away: 4 })];
    expect(row(matches, 'Away').points).toBe(1); // loss by 12 -> no defense bonus
    expect(row(matches, 'Away').bonusPoints).toBe(1);
  });

  it('awards an attack bonus on a draw', () => {
    const matches = [match('Home', 28, 28, 'Away', { home: 4, away: 3 })];
    expect(row(matches, 'Home').points).toBe(3);
    expect(row(matches, 'Away').points).toBe(2);
  });

  it('does not award an attack bonus for 3 tries', () => {
    const matches = [match('Home', 21, 0, 'Away', { home: 3 })];
    expect(row(matches, 'Home').points).toBe(4);
  });

  it('awards a defense bonus for losing by exactly 7 points', () => {
    const matches = [match('Home', 27, 20, 'Away', { home: 3, away: 2 })];
    expect(row(matches, 'Away').points).toBe(1);
    expect(row(matches, 'Away').bonusPoints).toBe(1);
  });

  it('does not award a defense bonus for losing by 8 points', () => {
    const matches = [match('Home', 28, 20, 'Away', { home: 3, away: 2 })];
    expect(row(matches, 'Away').points).toBe(0);
  });

  it('never gives the winner or a drawing side a defense bonus', () => {
    const matches = [match('Home', 21, 20, 'Away'), match('Home', 10, 10, 'Other')];
    expect(row(matches, 'Home').bonusPoints).toBe(0);
    expect(row(matches, 'Other').bonusPoints).toBe(0);
  });

  it('awards both bonuses to a team scoring 4+ tries in a narrow loss', () => {
    const matches = [match('Home', 31, 30, 'Away', { home: 4, away: 4 })];
    expect(row(matches, 'Away').points).toBe(2);
    expect(row(matches, 'Away').bonusPoints).toBe(2);
    expect(row(matches, 'Home').points).toBe(5);
  });

  it('tracks tries, points for/against and point difference', () => {
    const matches = [match('Home', 31, 30, 'Away', { home: 4, away: 4 })];
    expect(row(matches, 'Away')).toEqual({
      rank: 2, team: 'Away', played: 1, wins: 0, draws: 0, losses: 1,
      triesFor: 4, pointsFor: 30, pointsAgainst: 31, pointDifference: -1,
      bonusPoints: 2, points: 2,
    });
  });

  it('writes the spec JSON shape and a table with TF/BP columns', () => {
    const table = strategy.calculate([match('Home', 31, 30, 'Away', { home: 4, away: 4 })]);
    const json = strategy.toJson(table) as Array<Record<string, unknown>>;
    expect(Object.keys(json[0])).toEqual([
      'rank', 'team', 'played', 'wins', 'draws', 'losses',
      'pointsFor', 'pointsAgainst', 'pointDifference', 'bonusPoints', 'points',
    ]);
    const text = strategy.renderConsole(table);
    expect(text).toContain('Rank');
    expect(text).toContain('BP');
    expect(text).toContain('Pts');
  });
});

describe('TournamentStrategy', () => {
  const strategy = new TournamentStrategy();

  it('picks the team with the higher score', () => {
    const result = strategy.calculate([match('A', 2, 0, 'B'), match('C', 1, 3, 'D')]);
    expect(result).toEqual({ roundWinners: ['A', 'D'] });
  });

  it('picks the home team when the match is drawn', () => {
    expect(strategy.calculate([match('A', 1, 1, 'B')]).roundWinners).toEqual(['A']);
  });

  it('returns no winners for no matches', () => {
    expect(strategy.calculate([])).toEqual({ roundWinners: [] });
    expect(strategy.renderConsole({ roundWinners: [] })).toContain('No matches');
  });

  it('serialises to the roundWinners schema', () => {
    expect(strategy.toJson({ roundWinners: ['A'] })).toEqual({ roundWinners: ['A'] });
  });
});

describe('strategy factory', () => {
  it('creates each known strategy', () => {
    expect(createStrategy('classic').name).toBe('classic');
    expect(createStrategy('rugby').name).toBe('rugby');
    expect(createStrategy('tournament').name).toBe('tournament');
  });

  it('rejects unknown strategies with a helpful message', () => {
    expect(() => createStrategy('basketball')).toThrow(/Unknown strategy "basketball".*classic/);
    expect(() => createStrategy('toString')).toThrow(/Unknown strategy/);
  });
});
