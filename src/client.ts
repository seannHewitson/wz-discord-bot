import { Client as DiscordClient, GatewayIntentBits } from 'discord.js'

import { Commands } from './types'

export type Client = DiscordClient & {
  commands: Commands
}

export const discordClient = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
}) as Client
