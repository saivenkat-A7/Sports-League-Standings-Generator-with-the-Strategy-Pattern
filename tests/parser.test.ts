import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { MatchDataError } from '../src/errors';
import { loadMatches, parseMatches } from '../src/parser';

const valid = {
  date: '2023-01-01',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  homeScore: 3,
  awayScore: 1,
  homeTeamTries: 0,
  awayTeamTries: 0,
};

describe('parseMatches', () => {
  it('parses a valid match list', () => {
    expect(parseMatches(JSON.stringify([valid]))).toEqual([valid]);
  });

  it('defaults missing try counts to 0', () => {
    const { homeTeamTries, awayTeamTries, ...noTries } = valid;
    const [parsed] = parseMatches(JSON.stringify([noTries]));
    expect(parsed.homeTeamTries).toBe(0);
    expect(parsed.awayTeamTries).toBe(0);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseMatches('{not json')).toThrow(MatchDataError);
    expect(() => parseMatches('{not json')).toThrow(/Malformed JSON/);
  });

  it('rejects non-array JSON', () => {
    expect(() => parseMatches('{}')).toThrow(/expected a JSON array/);
  });

  it.each([
    ['non-object entry', 42, /expected an object/],
    ['bad date', { ...valid, date: '01/02/2023' }, /"date"/],
    ['impossible date', { ...valid, date: '2023-13-45' }, /"date"/],
    ['missing team', { ...valid, homeTeam: '' }, /"homeTeam"/],
    ['numeric team', { ...valid, awayTeam: 5 }, /"awayTeam"/],
    ['same team twice', { ...valid, awayTeam: 'Team A' }, /against itself/],
    ['string score', { ...valid, homeScore: '3' }, /"homeScore"/],
    ['negative score', { ...valid, awayScore: -1 }, /"awayScore"/],
    ['fractional score', { ...valid, awayScore: 1.5 }, /"awayScore"/],
    ['bad tries', { ...valid, homeTeamTries: 'x' }, /"homeTeamTries"/],
  ])('rejects %s', (_label, entry, pattern) => {
    expect(() => parseMatches(JSON.stringify([entry]))).toThrow(pattern);
  });

  it('reports which match is invalid', () => {
    expect(() => parseMatches(JSON.stringify([valid, { ...valid, homeScore: null }]))).toThrow(/match #2/);
  });
});

describe('loadMatches', () => {
  it('reports a missing file', () => {
    expect(() => loadMatches('/definitely/not/here.json')).toThrow(/Input file not found/);
  });

  it('reads a file from disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'standings-'));
    const file = path.join(dir, 'm.json');
    fs.writeFileSync(file, JSON.stringify([valid]));
    expect(loadMatches(file)).toHaveLength(1);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
