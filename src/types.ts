/** A single match result as read from the input JSON file. */
export interface Match {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamTries: number;
  awayTeamTries: number;
}
