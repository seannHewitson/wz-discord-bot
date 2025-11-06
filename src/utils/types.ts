export interface PlayerRow {
  uploadedby: string
  lobbycode: string
  name: string
  discord_id: string | null
  username: string | null
  activisionid: string
  kills: number
  eliminations: number
  placement: number
}

export interface LeaderboardPlayer {
  activisionid: string
  discord_id: string | null
  username: string | null
  kills: number
  eliminations: number
  score: number
  matches: Pick<Game, 'eliminations' | 'kills'>[]
}

interface Game {
  lobbycode: string
  kills: number
  eliminations: number
  placement: number
  score: number
  players: LeaderboardPlayer[]
}

export interface TeamLeaderboard {
  team: string
  score: number
  kills: number
  eliminations: number
  players: LeaderboardPlayer[]
  games: Game[]
}
