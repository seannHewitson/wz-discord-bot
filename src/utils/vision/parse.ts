import { parseWarzonePlacement } from './placement'
import { parseWarzoneScoreboard } from './scoreboard'
import { BaseParams } from './types'

type ParseParams = BaseParams & {
  text: string
}

export const parse = async ({ text, ...image }: ParseParams) => {
  if (!text) {
    console.warn('No text provided for parsing Warzone image')
    return null
  }

  if (/ELIMINATIONS/i.test(text) && /KILLS/i.test(text)) {
    return parseWarzoneScoreboard(image)
  } else if (/\b(?:(\d{1,2})(?:st|nd|rd|th)?\s*Place|Victory)\b/i.test(text)) {
    return parseWarzonePlacement(image)
  }
  return null
}
