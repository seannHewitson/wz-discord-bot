import { Collection, REST, Routes } from 'discord.js'

import { config } from './config'

const rest = new REST().setToken(config.discord.token)

// and deploy your commands!
export const deploy = async (commands: Collection<string, any>) => {
  try {
    console.log(`Started refreshing ${commands.size} application (/) commands.`)
    // The put method is used to fully refresh all commands in the guild with the current set
    const data: any = await rest.put(
      Routes.applicationGuildCommands(
        config.discord.clientId,
        config.discord.guildId
      ),
      {
        body: Array.from(commands.entries()).map(([, { data }]) =>
          data.toJSON()
        ),
      }
    )

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    )
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error)
  }
}
