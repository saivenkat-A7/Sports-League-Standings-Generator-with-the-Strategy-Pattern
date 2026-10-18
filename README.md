# Sports League Standings Generator

A command-line application that turns match results (JSON) into league standings, built around the
**Strategy design pattern**. Written in TypeScript for Node.js, tested with Jest.

## Setup

```bash
npm install
npm test            # unit tests (Jest)
```

Requires Node.js 18+.

## Usage

```bash
# Classic (soccer) rules - default input is data/matches.json
npm start -- --strategy=classic

# Rugby rules (with try data)
npm start -- --strategy=rugby --input=data/rugby_matches.json

# Tournament (knockout) rules with a different input file
npm start -- --strategy=tournament --input=data/cup_matches.json

# Tie-breaker demo data
npm start -- --strategy=classic --input=data/test_tiebreaker_matches.json
```

| Option | Description | Default |
| --- | --- | --- |
| `-s, --strategy <name>` | `classic`, `rugby` or `tournament` | `classic` |
| `-i, --input <path>` | match data JSON file | `data/matches.json` |
| `-o, --output-dir <path>` | where JSON results are written | `output` |

Each run prints a table to the console and writes JSON to `output/`:
`standings_classic.json`, `standings_rugby.json` or `winners_tournament.json`.
Errors (missing/malformed file, invalid strategy, invalid match data) print a clear message to stderr and exit with code 1.

A production build is available via `npm run build` and `npm run start:prod -- --strategy=classic`.

## Input format

```json
[{ "date": "2023-01-01", "homeTeam": "Team A", "awayTeam": "Team B",
   "homeScore": 3, "awayScore": 1, "homeTeamTries": 0, "awayTeamTries": 0 }]
```

Scores must be non-negative integers. `homeTeamTries` / `awayTeamTries` are only used by rugby and default to 0 if omitted.

## Design

```
src/
  index.ts                     entry point
  cli.ts                       argument parsing (commander), error handling, exit codes
  StandingsGenerator.ts        Strategy *Context*: calls the strategy, writes JSON
  strategies/
    StandingsStrategy.ts       Strategy *interface* (calculate / renderConsole / toJson)
    RankedStrategy.ts          shared base for league tables (aggregation + ranking)
    ClassicStrategy.ts         3/1/0
    RugbyStrategy.ts           4/2/0 + attack/defense bonus
    TournamentStrategy.ts      knockout winners
    index.ts                   strategy registry / factory
  tiebreakers.ts               points -> GD/PD -> GF/PF -> head-to-head -> name
  parser.ts                    JSON loading + validation
  formatter.ts                 CLI table rendering
```

Adding a new scoring system means adding one strategy class and one registry entry; the context and CLI do not change.

### Tie-breakers (classic and rugby)

1. Total points (desc)
2. Goal / point difference (desc)
3. Goals / points for (desc)
4. Head-to-head: for teams still level, a mini-league is built from only the matches among those teams and points are recalculated with the same strategy (rugby bonus points included)
5. Team name (alphabetical)

### Notes / interpretation decisions

- The rugby console table also shows Tries For (`TF`) as required by the "stats tracked" list; the rugby JSON file follows the specified schema exactly (no `triesFor` field).
- The tournament strategy does not de-duplicate teams or enforce a bracket: it returns one winner per input match, in input order.
- `--strategy` defaults to `classic` when omitted.
