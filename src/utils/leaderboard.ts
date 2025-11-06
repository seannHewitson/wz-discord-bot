import { Message } from 'discord.js'

import { config } from '../config'
import { supabase } from '../supabase'
import { getLeadeboardEmbed } from './embeds/leaderboards'
import { getMultiplier } from './multipliers'
import { LeaderboardPlayer, PlayerRow, TeamLeaderboard } from './types'

export function parseLeaderboard(rows: PlayerRow[]): TeamLeaderboard[] {
  // Step 1: Calculate score per row
  const rowsWithScores = rows.map((row) => {
    const kills = row.kills ?? 0
    const placement = row.placement ?? 0
    return {
      ...row,
      kills,
      eliminations: row.eliminations ?? 0,
      score: kills * getMultiplier(placement),
    }
  })

  // Step 2: Group by uploadedby (team)
  const teamMap = new Map<string, TeamLeaderboard>()

  for (const row of rowsWithScores) {
    const teamId = row.uploadedby
    const team = teamMap.get(teamId) ?? {
      team: teamId,
      score: 0,
      kills: 0,
      eliminations: 0,
      players: [],
      games: [],
    }

    // Step 3: Group by lobbycode within the team
    let game = team.games.find((g) => g.lobbycode === row.lobbycode)
    if (!game) {
      game = {
        lobbycode: row.lobbycode,
        placement: row.placement,
        kills: 0,
        eliminations: 0,
        score: 0,
        players: [],
      }
      team.games.push(game)
    }

    // Add player to game
    const player: LeaderboardPlayer = {
      activisionid: row.activisionid,
      discord_id: row.discord_id,
      username: row.username,
      kills: row.kills,
      eliminations: row.eliminations,
      score: row.score,
      matches: [{ eliminations: row.eliminations, kills: row.kills }],
    }
    game.players.push(player)

    // Aggregate game stats
    game.kills += row.kills
    game.eliminations += row.eliminations
    game.score += row.score

    teamMap.set(teamId, team)
  }

  // Step 4: Reduce to top 6 games and aggregate player totals
  for (const team of teamMap.values()) {
    // Sort by game score descending and take top 6
    team.games = team.games.sort((a, b) => b.score - a.score).slice(0, 6)

    // Reset totals before recalculation
    team.kills = 0
    team.eliminations = 0
    team.score = 0

    const playerMap = new Map<string, LeaderboardPlayer>()

    for (const game of team.games) {
      team.kills += game.kills
      team.eliminations += game.eliminations
      team.score += game.score

      for (const p of game.players) {
        const key = p.activisionid
        const existing = playerMap.get(key) ?? {
          activisionid: p.activisionid,
          discord_id: p.discord_id,
          username: p.username,
          kills: 0,
          eliminations: 0,
          score: 0,
          matches: [],
        }
        existing.kills += p.kills
        existing.eliminations += p.eliminations
        existing.score += p.score
        existing.matches.push({ eliminations: p.eliminations, kills: p.kills })
        playerMap.set(key, existing)
      }
    }

    team.players = [...playerMap.values()]
  }

  return Array.from(teamMap.values()).sort((a, b) => b.score - a.score)
}

export const updateLeaderboard = async (message: Message<true>) => {
  //  Get leaderboard channel
  const channel = await message.client.channels.fetch(
    config.channels.leaderboard
  )
  if (!channel || !channel.isTextBased()) {
    console.error('Leaderboard channel not found or is not a text channel.')
    return
  }

  if (!channel.isSendable) {
    console.error('Leaderboard channel is not sendable.')
    return
  }

  const { data, error } = await supabase.rpc('discord_getresults')
  if (error) {
    console.error('Error fetching leaderboard data:', error)
    await message.reply({ content: 'Error fetching leaderboard data.' })
    return
  }

  if (!data || data.length === 0) {
    await message.reply('No results found for the leaderboard.')
    return
  }

  const leaderboard = parseLeaderboard(data)

  if (channel.isSendable()) {
    await channel.send({
      content: 'Updated leaderboard:',
      embeds: getLeadeboardEmbed(leaderboard, 6),
    })
  }
}
