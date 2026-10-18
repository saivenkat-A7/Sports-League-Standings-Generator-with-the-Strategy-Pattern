import { Match } from '../types';

/**
 * Strategy interface. Each concrete strategy knows how to turn a list of
 * matches into a result, and how to present that result (console + JSON),
 * so the context never needs to know which concrete strategy it is using.
 */
export interface StandingsStrategy<TResult = unknown> {
  /** CLI identifier, e.g. "classic". */
  readonly name: string;
  /** File name written inside the output directory. */
  readonly outputFileName: string;
  /** Processes all matches and returns the final result. */
  calculate(matches: readonly Match[]): TResult;
  /** Human readable rendering for the console. */
  renderConsole(result: TResult): string;
  /** JSON-serialisable representation written to the output file. */
  toJson(result: TResult): unknown;
}
