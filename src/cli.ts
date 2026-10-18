import { Command, CommanderError } from 'commander';
import { AppError } from './errors';
import { loadMatches } from './parser';
import { StandingsGenerator } from './StandingsGenerator';
import { createStrategy, STRATEGY_NAMES } from './strategies';

export const DEFAULT_INPUT = 'data/matches.json';
export const DEFAULT_OUTPUT_DIR = 'output';
export const DEFAULT_STRATEGY = 'classic';

export interface CliIo {
  log(message: string): void;
  error(message: string): void;
}

const defaultIo: CliIo = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

/**
 * Runs the application and returns the process exit code (0 = success).
 * `argv` contains only the user arguments, e.g. ["--strategy=rugby"].
 */
export function run(argv: string[], io: CliIo = defaultIo): number {
  const program = new Command();
  program
    .name('standings')
    .description('Generate sports league standings from match data')
    .option('-s, --strategy <name>', `scoring strategy (${STRATEGY_NAMES.join(' | ')})`, DEFAULT_STRATEGY)
    .option('-i, --input <path>', 'path to the matches JSON file', DEFAULT_INPUT)
    .option('-o, --output-dir <path>', 'directory for generated JSON files', DEFAULT_OUTPUT_DIR)
    .exitOverride()
    .configureOutput({
      writeOut: (text) => io.log(text.trimEnd()),
      writeErr: (text) => io.error(text.trimEnd()),
    });

  try {
    program.parse(argv, { from: 'user' });
    const options = program.opts<{ strategy: string; input: string; outputDir: string }>();

    const strategy = createStrategy(options.strategy);
    const matches = loadMatches(options.input);
    const { console: text, outputPath } = new StandingsGenerator(strategy).generate(
      matches,
      options.outputDir,
    );

    io.log(text);
    io.log(`\nResults written to ${outputPath}`);
    return 0;
  } catch (err) {
    if (err instanceof CommanderError) {
      return err.exitCode;
    }
    if (err instanceof AppError) {
      io.error(`Error: ${err.message}`);
      return 1;
    }
    io.error(`Unexpected error: ${(err as Error).message}`);
    return 1;
  }
}
