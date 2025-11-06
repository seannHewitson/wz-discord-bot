import { EmbedBuilder } from 'discord.js'

import { padArray } from '../array'
import { getOrdinal } from '../position'
import { TeamLeaderboard } from '../types'

export const getColor = (index: number) => {
  if (index === 0) return '#FFD700' // Gold
  if (index === 1) return '#C0C0C0' // Silver
  if (index === 2) return '#CD7F32' // Bronze
  return '#5808fb' // Default color for other positions
}

const medals = ['🥇', '🥈', '🥉']

const getTitle = (index: number) => {
  let title = ''
  if (index < medals.length) title += `${medals[index]} `
  title += `${index + 1}${getOrdinal(index + 1)} Place`
  return title
}

export const getLeadeboardEmbed = (
  leaderboard: TeamLeaderboard[],
  maxGames: number = 6
) =>
  leaderboard.map((team, index) =>
    new EmbedBuilder()
      .setDescription('————————————————————————————————————————————')
      .setTitle(getTitle(index))
      .setColor(getColor(index))
      .setThumbnail(null)
      .addFields([
        {
          name: `**${team.score}**`,
          value: `Score\n**${team.kills}**\nKills`,
          inline: true,
        },
        {
          name: '**Team**',
          value: team.players
            .map(({ activisionid, discord_id }) =>
              discord_id ? `<@${discord_id}>` : activisionid
            )
            .join('\n'),
          inline: true,
        },
        {
          name: [...Array(maxGames).keys()].map((i) => `M${i + 1}`).join('᲼᲼'),
          value: team.players
            .map(({ matches }) =>
              padArray(matches, maxGames, { kills: 0 } as any)
                .map(({ kills }) => {
                  const out = kills.toString().padStart(2, '0')
                  if (kills === 11) return `${kills} `
                  if (`${kills}`.includes('1')) return `${out} `
                  return out
                })
                .join('᲼᲼ ')
            )
            .join('\n'),
          inline: true,
        },
      ])
  )
