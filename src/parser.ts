import * as fs from 'fs';
import { MatchDataError } from './errors';
import { Match } from './types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Reads and validates the match file at `filePath`. */
export function loadMatches(filePath: string): Match[] {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new MatchDataError(`Input file not found: ${filePath}`);
    }
    throw new MatchDataError(`Unable to read input file ${filePath}: ${(err as Error).message}`);
  }
  return parseMatches(raw, filePath);
}

/** Parses and validates the JSON text of a match file. */
export function parseMatches(json: string, source = 'input'): Match[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (err) {
    throw new MatchDataError(`Malformed JSON in ${source}: ${(err as Error).message}`);
  }
  if (!Array.isArray(data)) {
    throw new MatchDataError(`Invalid data in ${source}: expected a JSON array of matches.`);
  }
  return data.map((item, index) => validateMatch(item, index, source));
}

function validateMatch(item: unknown, index: number, source: string): Match {
  const where = `${source}, match #${index + 1}`;
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    throw new MatchDataError(`Invalid match in ${where}: expected an object.`);
  }
  const record = item as Record<string, unknown>;

  const date = record.date;
  if (typeof date !== 'string' || !DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date))) {
    throw new MatchDataError(`Invalid match in ${where}: "date" must be a string in YYYY-MM-DD format.`);
  }
  const homeTeam = requireTeam(record, 'homeTeam', where);
  const awayTeam = requireTeam(record, 'awayTeam', where);
  if (homeTeam === awayTeam) {
    throw new MatchDataError(`Invalid match in ${where}: a team cannot play against itself ("${homeTeam}").`);
  }

  return {
    date,
    homeTeam,
    awayTeam,
    homeScore: requireCount(record, 'homeScore', where, true),
    awayScore: requireCount(record, 'awayScore', where, true),
    // Tries only matter for rugby; when omitted they default to 0.
    homeTeamTries: requireCount(record, 'homeTeamTries', where, false),
    awayTeamTries: requireCount(record, 'awayTeamTries', where, false),
  };
}

function requireTeam(record: Record<string, unknown>, field: string, where: string): string {
  const value = record[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MatchDataError(`Invalid match in ${where}: "${field}" must be a non-empty string.`);
  }
  return value.trim();
}

function requireCount(
  record: Record<string, unknown>,
  field: string,
  where: string,
  required: boolean,
): number {
  const value = record[field];
  if (value === undefined && !required) {
    return 0;
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new MatchDataError(`Invalid match in ${where}: "${field}" must be a non-negative integer.`);
  }
  return value;
}
