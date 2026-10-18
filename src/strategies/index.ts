import { AppError } from '../errors';
import { ClassicStrategy } from './ClassicStrategy';
import { RugbyStrategy } from './RugbyStrategy';
import { StandingsStrategy } from './StandingsStrategy';
import { TournamentStrategy } from './TournamentStrategy';

export * from './ClassicStrategy';
export * from './RankedStrategy';
export * from './RugbyStrategy';
export * from './StandingsStrategy';
export * from './TournamentStrategy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStrategy = StandingsStrategy<any>;

/**
 * Registry of available strategies. Adding a new scoring system only needs a
 * new class and one entry here (Open/Closed Principle).
 */
const REGISTRY: Record<string, () => AnyStrategy> = {
  classic: () => new ClassicStrategy(),
  rugby: () => new RugbyStrategy(),
  tournament: () => new TournamentStrategy(),
};

export const STRATEGY_NAMES: string[] = Object.keys(REGISTRY);

export function createStrategy(name: string): AnyStrategy {
  const factory = Object.prototype.hasOwnProperty.call(REGISTRY, name) ? REGISTRY[name] : undefined;
  if (!factory) {
    throw new AppError(`Unknown strategy "${name}". Valid strategies: ${STRATEGY_NAMES.join(', ')}.`);
  }
  return factory();
}
