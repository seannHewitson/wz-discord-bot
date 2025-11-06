import { Client, discordClient } from '../client'
import { config } from '../config'
import { Channel } from '../types'

export const getChannel = (
  channel: Channel,
  client: Client = discordClient
) => {
  const channelId: string = config.channels[channel]
  const clientChannel = client.channels.cache.get(channelId)
  if (!clientChannel) {
    console.error(`Channel ${channel} with ID ${channelId} not found.`)
    return null
  }
  if (!clientChannel.isTextBased()) {
    console.error(
      `Channel ${channel} with ID ${channelId} is not a text-based channel.`
    )
    return null
  }
  if (!clientChannel.isSendable()) {
    console.error(`Channel ${channel} with ID ${channelId} is not sendable.`)
    return null
  }
  return clientChannel
}
