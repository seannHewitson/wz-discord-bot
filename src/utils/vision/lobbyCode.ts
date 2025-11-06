import { BaseParams } from './types'

export const getLobbyCode = ({
  annotations,
  height,
  width,
}: BaseParams): string | null => {
  let lobbyCode: string | null = null
  const lobbyCodeRegex = /\b\d{18,22}\b/

  for (const annotation of annotations) {
    if (annotation.y > height * 0.9 && annotation.x < width * 0.2) {
      if (lobbyCodeRegex.test(annotation.text)) {
        lobbyCode = annotation.text
        break // Found it, move on
      }
    }
  }

  return lobbyCode
}
