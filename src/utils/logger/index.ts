import { EmbedBuilder } from 'discord.js'

import { Client, discordClient } from '../../client'
import { getChannel } from '../channels'

type Level = 'log' | 'info' | 'warn' | 'error' | 'fatal'

type Logs = {
  [key in Level]: string
}

const colors: Logs = {
  log: '#6c757d',
  info: '#0dcaf0',
  warn: '#ffc107',
  error: '#dc3545',
  fatal: '#6f42c1',
}

const emojis: Logs = {
  log: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  fatal: '💀',
}

const baseLog = async (level: Level, message: string, client: Client) => {
  //  Always send to console
  const method = level === 'fatal' ? 'error' : level
  console[method](`${emojis[level]} ${level.toUpperCase()}: ${message}`)
  const channel = getChannel('logs', client)
  if (!channel) return
  channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${emojis[level]} ${level.toUpperCase()}`)
        .setColor(colors[level] as `#${string}`)
        .setTimestamp()
        .setDescription(
          typeof message === 'string'
            ? message
            : `\`\`\`json\n${JSON.stringify(message, null, 2)}\n\`\`\``
        ),
    ],
  })
}

const log = async (message: string, client: Client = discordClient) =>
  baseLog('log', message, client)

export const logger = Object.assign(log, {
  info: async (message: string, client: Client = discordClient) =>
    baseLog('info', message, client),

  warn: async (message: string, client: Client = discordClient) =>
    baseLog('warn', message, client),

  error: async (message: string, client: Client = discordClient) =>
    baseLog('error', message, client),

  fatal: async (message: string, client: Client = discordClient) =>
    baseLog('fatal', message, client),
})

// export const logger = {
//   warn: () => {},
//   error: () => {},
//   info: () => {},
//   debug: () => {},

// }
