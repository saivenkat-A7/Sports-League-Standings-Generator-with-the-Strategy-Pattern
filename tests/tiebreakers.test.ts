import { ClassicStrategy } from '../src/strategies/ClassicStrategy';
import { RugbyStrategy } from '../src/strategies/RugbyStrategy';
import { match } from './helpers';

const classic = new ClassicStrategy();
const rugby = new RugbyStrategy();
const order = (table: { team: string }[]) => table.map((r) => r.team);

describe('tie-breakers (classic)', () => {
  it('ranks teams level on points by goal difference', () => {
    // Bears and Wolves both have 3 points; Wolves' GD (+4) beats Bears' (+1).
    // Alphabetical order would put Bears first, so this proves GD is used.
    const table = classic.calculate([
      match('Bears', 1, 0, 'Foxes'),
      match('Wolves', 4, 0, 'Hawks'),
    ]);
    expect(order(table)).toEqual(['Wolves', 'Bears', 'Foxes', 'Hawks']);
    expect(table.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('ranks teams level on points and GD by goals for', () => {
    // Bears: 1-0 (GD +1, GF 1). Wolves: 3-2 (GD +1, GF 3). Foxes (GF 2) then rank above Hawks (GF 0).
    const table = classic.calculate([
      match('Bears', 1, 0, 'Hawks'),
      match('Wolves', 3, 2, 'Foxes'),
    ]);
    expect(order(table)).toEqual(['Wolves', 'Bears', 'Foxes', 'Hawks']);
  });

  it('ranks teams level on points, GD and GF by head-to-head result', () => {
    // Zed and Alpha are level on 3 pts, GD 0 and GF 1; Zed beat Alpha 1-0.
    // City beat Zed so City leads on GD. Alphabetical order would favour Alpha.
    const table = classic.calculate([
      match('Zed', 1, 0, 'Alpha'),
      match('City', 1, 0, 'Zed'),
      match('Alpha', 1, 0, 'Delta'),
    ]);
    expect(order(table)).toEqual(['City', 'Zed', 'Alpha', 'Delta']);
  });

  it('resolves a three-team tie using the mini-league of their mutual matches', () => {
    const table = classic.calculate([
      match('Zeta', 1, 0, 'Mu'),
      match('Zeta', 1, 0, 'Alpha'),
      match('Mu', 1, 0, 'Alpha'),
      match('Omega', 1, 0, 'Zeta'),
      match('Sigma', 1, 0, 'Zeta'),
      match('Mu', 1, 0, 'Omega'),
      match('Sigma', 1, 0, 'Mu'),
      match('Alpha', 1, 0, 'Omega'),
      match('Alpha', 1, 0, 'Sigma'),
    ]);
    // Zeta, Mu and Alpha all have 6 pts, GD 0, GF 2; mini-league: Zeta 6, Mu 3, Alpha 0.
    expect(order(table)).toEqual(['Sigma', 'Zeta', 'Mu', 'Alpha', 'Omega']);
  });

  it('falls back to alphabetical order when the head-to-head is also level', () => {
    // Cyclic results: each team beats one and loses to another.
    const table = classic.calculate([
      match('Zed', 1, 0, 'Mid'),
      match('Mid', 1, 0, 'Alp'),
      match('Alp', 1, 0, 'Zed'),
    ]);
    expect(order(table)).toEqual(['Alp', 'Mid', 'Zed']);
  });
});

describe('tie-breakers (rugby)', () => {
  it('ranks teams level on points by point difference', () => {
    const table = rugby.calculate([
      match('Bears', 20, 10, 'Foxes'), // 4 pts, PD +10
      match('Wolves', 40, 10, 'Hawks'), // 4 pts, PD +30
    ]);
    expect(order(table)[0]).toBe('Wolves');
    expect(order(table)[1]).toBe('Bears');
  });

  it('ranks teams level on points and PD by points for', () => {
    const table = rugby.calculate([
      match('Bears', 20, 10, 'Foxes'), // PD +10, PF 20
      match('Wolves', 30, 20, 'Hawks'), // PD +10, PF 30
    ]);
    expect(order(table).slice(0, 2)).toEqual(['Wolves', 'Bears']);
  });

  it('ranks teams level on points, PD and PF by head-to-head result', () => {
    const table = rugby.calculate([
      match('Zed', 10, 9, 'Alpha'),
      match('City', 10, 9, 'Zed'),
      match('Alpha', 10, 9, 'Delta'),
    ]);
    // Zed and Alpha: 5 pts (win 4 + defense bonus 1), PD 0, PF 19; Zed won the head-to-head.
    // Alphabetical order would put Alpha first, so this proves H2H is used.
    expect(order(table)).toEqual(['Zed', 'Alpha', 'City', 'Delta']);
  });
});
