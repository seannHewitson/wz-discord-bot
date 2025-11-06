import { Events, Message } from 'discord.js'

import { config } from '../config'
import { createPlacement } from '../supabase/placement'
import { updateLeaderboard } from '../utils/leaderboard'
import { warzoneParser } from '../utils/vision'

export const name = Events.MessageCreate

export const execute = async (message: Message<true>) => {
  //  Check if message is from a bot
  if (message.author.bot) return
  //  Check if message is in placement channel
  if (message.channelId !== config.channels.placement) return

  if (!message.channel || !message.channel.isTextBased()) return

  //  Check if message has attachments
  if (message.attachments.size === 0) return
  //  Check if message has images
  const images = message.attachments.filter((attachment) =>
    attachment.contentType?.startsWith('image/')
  )
  if (images.size < 1) return

  const missing = images.filter(
    (image) => !image.height || !image.width || !image.url
  )
  if (missing.size > 0) {
    await message.reply({
      content: 'Error processing image hint; height, width, and URL.',
    })
    await message.react('❌')
    return
  }

  const data = await warzoneParser(images as any)
  if (!data || data.length === 0) {
    await message.reply({
      content: 'Error processing image hint; no data found.',
    })
    await message.react('❌')
    return
  }

  try {
    const { error } = await createPlacement(data, message.author.id)
    if (error) {
      console.error('Error creating placement:', error)
      await message.reply({
        content: 'Error processing image hint; failed to create placement.',
      })
      await message.react('❌')
      return
    }
    await message.react('✅')
    await updateLeaderboard(message)
  } catch (error) {
    console.error('Error creating placement:', error)
    await message.reply({
      content: 'Error processing image hint; failed to create placement.',
    })
    await message.react('❌')
    return
  }
}
