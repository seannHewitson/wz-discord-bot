import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { getUser, registerUser } from '../supabase/user'

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Register yourself for the leaderboards.')
  .addStringOption((option) =>
    option
      .setName('activision_id')
      .setDescription('Your Activision ID (e.g., Player#1234567)')
      .setRequired(true)
  )

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const activisionId = interaction.options.getString('activision_id', true)
  const { user, userError } = await getUser(interaction.user)
  if (userError) return console.error(userError)
  if (user) {
    return await interaction.reply({
      content: 'You are already registered!',
      ephemeral: true,
    })
  }

  const { error } = await registerUser(interaction.user, activisionId)
  if (error) return console.error(error)

  await interaction.reply({
    content: `Successfully registered with Activision ID: ${activisionId}`,
    ephemeral: true,
  })
}
