import { BaseParams } from './types'

export const parseWarzonePlacement = async ({
  annotations,
  height,
  width,
}: BaseParams) => {
  let gamemode: string | null = null
  let mapname: string | null = null

  const GAME_MODE_Y_MAX_THRESHOLD = height * 0.15
  const GAME_MODE_X_MAX_THRESHOLD = width * 0.4

  const gameModeKeywords = [
    'RESURGENCE',
    'BATTLE ROYALE',
    'SOLOS',
    'DUOS',
    'TRIOS',
    'QUADS',
  ]
  let gameModeParts: string[] = []
  let gameModeLineY: number | null = null
  const Y_TOLERANCE_GAMEMODE = 5

  const topCornerAnnotations = annotations
    .filter(
      (ann) =>
        ann.y < GAME_MODE_Y_MAX_THRESHOLD && ann.x < GAME_MODE_X_MAX_THRESHOLD
    )
    .sort((a, b) => a.x - b.x)

  for (const annotation of topCornerAnnotations) {
    const textUpper = annotation.text.toUpperCase()
    if (gameModeKeywords.includes(textUpper)) {
      if (
        gameModeLineY === null ||
        Math.abs(annotation.y - gameModeLineY) < Y_TOLERANCE_GAMEMODE
      ) {
        gameModeParts.push(textUpper)
        gameModeLineY = annotation.y
      } else if (annotation.y > gameModeLineY) {
        break
      }
    }
  }
  if (gameModeParts.length > 0) {
    gamemode = gameModeParts.join(' ')
  }

  const MAP_NAME_KEYWORDS = ['REBIRTH ISLAND', 'VERDANSK']
  const MAP_NAME_X_MAX_THRESHOLD = width * 0.4

  let mapNameLineY: number | null = null
  const Y_TOLERANCE_MAPNAME = 5

  const mapNameAnnotations = annotations
    .filter(
      (ann) =>
        gameModeLineY !== null &&
        ann.y > gameModeLineY &&
        ann.y < GAME_MODE_Y_MAX_THRESHOLD + 50 &&
        ann.x < MAP_NAME_X_MAX_THRESHOLD
    )
    .sort((a, b) => a.y - b.y)

  for (const annotation of mapNameAnnotations) {
    const textUpper = annotation.text.toUpperCase()
    for (const mapPhrase of MAP_NAME_KEYWORDS) {
      if (textUpper.includes(mapPhrase)) {
        mapname = mapPhrase
      }
    }

    if (textUpper.includes('REBIRTH') || textUpper.includes('VERDANSK')) {
      if (
        mapNameLineY === null ||
        Math.abs(annotation.y - mapNameLineY) < Y_TOLERANCE_MAPNAME
      ) {
        if (!mapname) mapname = annotation.text
        else mapname += ' ' + annotation.text
        mapNameLineY = annotation.y
      } else if (annotation.y > mapNameLineY && mapname !== null) {
        if (
          mapname.toUpperCase().includes('REBIRTH ISLAND') ||
          mapname.toUpperCase().includes('VERDANSK')
        ) {
          mapname = mapname.trim()
        }
      }
    }
  }
  if (mapname) {
    mapname = mapname.toUpperCase().includes('REBIRTH ISLAND')
      ? 'REBIRTH ISLAND'
      : mapname.toUpperCase().includes('VERDANSK')
        ? 'VERDANSK'
        : mapname
  }

  const bottomLeftWords = annotations
    .map(({ rawAnnotation }) => rawAnnotation)
    .filter((word) => {
      const vertices = word.boundingPoly?.vertices || []
      const avgX =
        vertices.reduce((sum, v) => sum + (v.x || 0), 0) / vertices.length
      const avgY =
        vertices.reduce((sum, v) => sum + (v.y || 0), 0) / vertices.length

      return avgX < 400 && avgY > 600
    })

  const textInBottomLeft = bottomLeftWords.map((w) => w.description).join(' ')

  const match = textInBottomLeft.match(
    /\b(?:(\d{1,2})(?:st|nd|rd|th)?\s*Place|VICTORY)\b/i
  )
  const pos = match
    ? match[0]
        .toUpperCase()
        .replace(/(?:ST|ND|RD|TH)/, '')
        .replace(/PLACE/, '')
        .trim()
    : null
  const placement = pos ? parseInt(pos?.replace(/VICTORY/, '1')) : null
  return { gamemode, mapname, placement }
}
