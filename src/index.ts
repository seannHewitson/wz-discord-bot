import { Collection } from 'discord.js'

import { discordClient } from './client'
import { config } from './config'
import { deploy } from './deploy'
import { getFiles } from './utils/file'

getFiles('events').then((files) => {
  files.forEach(([file, name]) => {
    if ('name' in file && 'execute' in file) {
      const method =
        'once' in file ? (file.once === true ? 'once' : 'on') : 'on'
      discordClient[method](file.name, file.execute)
      console.log(`🔧 Event ${name} loaded.`)
    }
  })
})

getFiles('commands').then(async (files) => {
  discordClient.commands = new Collection()

  files.forEach(([file, name]) => {
    if ('data' in file && 'execute' in file) {
      const { data, execute } = file as any
      discordClient.commands.set(data.name, { data, execute })
      console.log(`🔧 Command ${name} loaded.`)
    }
  })

  console.log(`🔧 ${discordClient.commands.size} commands loaded.`)
  await deploy(discordClient.commands)
  return discordClient.commands
})

discordClient.login(config.discord.token)
