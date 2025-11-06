import { Client } from '../client'
import {
  Channel,
  ChannelSubscription,
  DiscordChannel,
  RealTime,
  SubscriptionEvent,
  Tables,
} from '../types'
import { getChannel } from './channels'

export const withChannel = <T extends keyof Tables>(
  channel: Channel,
  event: ChannelSubscription<T>
): SubscriptionEvent<T> => {
  return async (payload: RealTime<T>, client: Client) => {
    const discordChannel = getChannel(channel, client)
    if (!discordChannel) return

    await event(payload, client, discordChannel as DiscordChannel)
  }
}
