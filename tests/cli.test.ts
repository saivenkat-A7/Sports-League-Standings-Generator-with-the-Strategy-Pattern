import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { run } from '../src/cli';

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

function runCli(args: string[], outDir: string) {
  const out: string[] = [];
  const err: string[] = [];
  const code = run([...args, `--output-dir=${outDir}`], {
    log: (m) => out.push(m),
    error: (m) => err.push(m),
  });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

describe('CLI', () => {
  let outDir: string;
  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'standings-out-'));
  });
  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });
  const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf-8'));

  it('prints a table and writes standings_classic.json', () => {
    const { code, out } = runCli(['--strategy=classic', `--input=${DATA}/matches.json`], outDir);
    expect(code).toBe(0);
    expect(out).toContain('Rank');
    expect(out).toContain('Team');
    expect(out).toContain('Pts');
    const json = readJson('standings_classic.json');
    expect(json[0]).toEqual({
      rank: 1, team: 'Team A', played: 2, wins: 1, draws: 1, losses: 0,
      goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 4,
    });
    expect(json.map((r: { team: string }) => r.team)).toEqual(['Team A', 'Team C', 'Team D', 'Team B']);
  });

  it('prints a table and writes standings_rugby.json', () => {
    const { code, out } = runCli(['--strategy=rugby', `--input=${DATA}/rugby_matches.json`], outDir);
    expect(code).toBe(0);
    expect(out).toContain('Pts');
    const json = readJson('standings_rugby.json');
    expect(json[0]).toMatchObject({ rank: 1, team: 'Lions', bonusPoints: 2, points: 12 });
    expect(json[2]).toMatchObject({ team: 'Hawks', bonusPoints: 3, points: 7 });
  });

  it('writes winners_tournament.json', () => {
    const { code } = runCli(['--strategy=tournament', `--input=${DATA}/cup_matches.json`], outDir);
    expect(code).toBe(0);
    expect(readJson('winners_tournament.json')).toEqual({
      roundWinners: ['Team A', 'Team D', 'Team E', 'Team H'],
    });
  });

  it.each(['classic', 'rugby'])('ranks the tie-breaker data set correctly for %s', (strategy) => {
    const { code } = runCli([`--strategy=${strategy}`, `--input=${DATA}/test_tiebreaker_matches.json`], outDir);
    expect(code).toBe(0);
    const teams = readJson(`standings_${strategy}.json`).map((r: { team: string }) => r.team);
    // classic: Sigma leads on GD; rugby: Zeta/Mu/Alpha lead on points. Both resolve the trio by H2H.
    const trio = teams.filter((t: string) => ['Zeta', 'Mu', 'Alpha'].includes(t));
    expect(trio).toEqual(['Zeta', 'Mu', 'Alpha']);
  });

  it('defaults to the classic strategy', () => {
    const { code } = runCli([`--input=${DATA}/matches.json`], outDir);
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(outDir, 'standings_classic.json'))).toBe(true);
  });

  it('fails with a clear message for an invalid strategy', () => {
    const { code, err } = runCli(['--strategy=curling', `--input=${DATA}/matches.json`], outDir);
    expect(code).toBe(1);
    expect(err).toContain('Unknown strategy "curling"');
    expect(fs.readdirSync(outDir)).toHaveLength(0);
  });

  it('fails with a clear message when the input file is missing', () => {
    const { code, err } = runCli(['--strategy=classic', '--input=nope.json'], outDir);
    expect(code).toBe(1);
    expect(err).toContain('Input file not found');
  });

  it('fails with a clear message when the input file is malformed', () => {
    const bad = path.join(outDir, 'bad.json');
    fs.writeFileSync(bad, '[{"homeTeam": ');
    const { code, err } = runCli(['--strategy=classic', `--input=${bad}`], outDir);
    expect(code).toBe(1);
    expect(err).toContain('Malformed JSON');
  });

  it('exits non-zero for unknown options', () => {
    const { code } = runCli(['--bogus'], outDir);
    expect(code).not.toBe(0);
  });
});
