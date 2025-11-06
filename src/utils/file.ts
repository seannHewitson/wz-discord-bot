import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { config } from '../config'

export const getFiles = async (dir: string) => {
  const basePath = path.join(
    process.cwd(),
    config.env === 'development' ? 'src' : 'dist',
    dir
  )
  const files = await fs.readdir(basePath)
  if (files.length === 0) return []

  const promises = await Promise.all(
    files
      .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
      .map(async (f) => {
        let fileName = path.join(basePath, f)
        if (config.env !== 'development') {
          fileName = pathToFileURL(fileName).href
        }
        const file = await import(fileName)
        return [file, f]
      })
  )

  return promises
}
