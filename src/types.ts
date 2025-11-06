import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import {
  Collection,
  CommandInteraction,
  DMChannel,
  NewsChannel,
  PartialDMChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  SlashCommandBuilder,
  StageChannel,
  TextChannel,
  VoiceChannel,
} from 'discord.js'

import { Client } from './client'
import { config } from './config'
import { Database } from './supabase/types'

export type Channel = keyof typeof config.channels

export type ChannelSubscription<T extends keyof Tables = keyof Tables> = (
  payload: RealTime<T>,
  client: Client,
  channel: DiscordChannel
) => Promise<void>

export type Command = { data: SlashCommandBuilder; execute: Execute }
type Execute = (interaction: CommandInteraction) => Promise<void>

export type Commands = Collection<string, Command>

export type DiscordChannel =
  | DMChannel
  | PartialDMChannel
  | NewsChannel
  | StageChannel
  | TextChannel
  | PublicThreadChannel<boolean>
  | PrivateThreadChannel

export type Functions = Database['public']['Functions']

export type RealTime<T extends keyof Database['public']['Tables']> =
  RealtimePostgresInsertPayload<Tables[T]['Row']>

export type Tables = Database['public']['Tables']

export type SubscriptionEvent<T extends keyof Tables = keyof Tables> = (
  payload: RealTime<T>,
  client: Client
) => Promise<void>
