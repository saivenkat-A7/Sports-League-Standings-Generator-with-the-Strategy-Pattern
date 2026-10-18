/** Raised for any user-facing problem (bad input file, bad CLI option, ...). */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/** Raised when the match data file is missing, unreadable or malformed. */
export class MatchDataError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'MatchDataError';
  }
}
