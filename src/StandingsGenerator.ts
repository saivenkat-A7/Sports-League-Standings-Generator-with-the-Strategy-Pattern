import * as fs from 'fs';
import * as path from 'path';
import { AppError } from './errors';
import { AnyStrategy } from './strategies';
import { Match } from './types';

export interface GenerationOutput {
  /** Text to print to the console. */
  console: string;
  /** Path of the JSON file that was written. */
  outputPath: string;
}

/**
 * Strategy-pattern context. It only talks to the strategy through the
 * StandingsStrategy interface and never inspects the concrete type.
 */
export class StandingsGenerator {
  constructor(private strategy: AnyStrategy) {}

  setStrategy(strategy: AnyStrategy): void {
    this.strategy = strategy;
  }

  generate(matches: readonly Match[], outputDir: string): GenerationOutput {
    const result = this.strategy.calculate(matches);
    const outputPath = path.join(outputDir, this.strategy.outputFileName);
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(this.strategy.toJson(result), null, 2) + '\n', 'utf-8');
    } catch (err) {
      throw new AppError(`Unable to write output file ${outputPath}: ${(err as Error).message}`);
    }
    return { console: this.strategy.renderConsole(result), outputPath };
  }
}
