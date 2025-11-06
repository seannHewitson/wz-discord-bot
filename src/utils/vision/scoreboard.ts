import { BaseParams, Player } from './types'

export const parseWarzoneScoreboard = ({
  annotations,
  height,
  width,
}: BaseParams) => {
  const players: Player[] = []
  const headers = {
    NAME: { x: -1, y: -1, width: -1, height: -1 },
    SCORE: { x: -1, y: -1, width: -1, height: -1 },
    ELIMINATIONS: { x: -1, y: -1, width: -1, height: -1 },
    KILLS: { x: -1, y: -1, width: -1, height: -1 },
    ASSISTS: { x: -1, y: -1, width: -1, height: -1 },
  }

  let headerRowY: number | null = null

  for (const annotation of annotations) {
    const textUpper = annotation.text.toUpperCase()
    if (Object.keys(headers).includes(textUpper)) {
      headers[textUpper as keyof typeof headers] = {
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      }
      if (headerRowY === null || Math.abs(annotation.y - headerRowY) < 10) {
        headerRowY =
          headerRowY === null ? annotation.y : (headerRowY + annotation.y) / 2
      }
    }
  }

  const sortedHeaders = Object.entries(headers)
    .filter(([, value]) => value.x !== -1)
    .sort((a, b) => a[1].x - b[1].x)

  const columnXRanges: { [key: string]: { minX: number; maxX: number } } = {}
  for (let i = 0; i < sortedHeaders.length; i++) {
    const [headerName, headerCoords] = sortedHeaders[i]
    const nextHeaderCoords = sortedHeaders[i + 1]?.[1]

    columnXRanges[headerName] = {
      minX: headerCoords.x,
      maxX: nextHeaderCoords ? nextHeaderCoords.x : width,
    }
  }

  const Y_TOLERANCE = 15
  const X_GAP_FOR_COMBINE = 5

  const rows: { [key: number]: typeof annotations } = {}
  const LOBBY_CODE_Y_THRESHOLD = height * 0.9

  for (const annotation of annotations) {
    if (
      headerRowY === null ||
      annotation.y < headerRowY - Y_TOLERANCE ||
      annotation.y > LOBBY_CODE_Y_THRESHOLD - 50
    ) {
      continue
    }

    let foundRow = false
    for (const rowY in rows) {
      if (Math.abs(annotation.y - parseInt(rowY)) < Y_TOLERANCE) {
        rows[parseInt(rowY)].push(annotation)
        foundRow = true
        break
      }
    }
    if (!foundRow) {
      rows[annotation.y] = [annotation]
    }
  }

  const sortedRowKeys = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)

  const PLAYER_ROW_START_Y_OFFSET = 30

  for (const rowY of sortedRowKeys) {
    if (headerRowY !== null && rowY < headerRowY + PLAYER_ROW_START_Y_OFFSET) {
      continue
    }

    const rowAnnotations = rows[rowY].sort((a, b) => a.x - b.x)

    const rowText = rowAnnotations
      .map((a) => a.text)
      .join(' ')
      .toUpperCase()
    if (rowText.includes('SQUAD TOTALS')) {
      continue
    }

    let currentPlayer: {
      name: string | null
      eliminations: number | null
      kills: number | null
      assists: number | null
    } = {
      name: null,
      eliminations: null,
      kills: null,
      assists: null,
    }

    let currentNameParts: string[] = []
    let lastAnnotationXEnd = -1

    for (const annotation of rowAnnotations) {
      const annotationText = annotation.text
      const annotationX = annotation.x
      const annotationXEnd = annotation.x + annotation.width

      let assignedToColumn = false
      for (const [headerName, colRange] of Object.entries(columnXRanges)) {
        const annotationMidX = annotationX + annotation.width / 2

        if (
          annotationMidX >= colRange.minX &&
          annotationMidX <= colRange.maxX
        ) {
          if (headerName === 'NAME') {
            if (
              currentNameParts.length === 0 ||
              annotationX - lastAnnotationXEnd < X_GAP_FOR_COMBINE
            ) {
              currentNameParts.push(annotationText)
            } else {
              currentNameParts.push(annotationText)
            }
            lastAnnotationXEnd = annotationXEnd
            assignedToColumn = true
          } else {
            const num = parseInt(annotationText, 10)
            if (!isNaN(num)) {
              if (
                headerName === 'ELIMINATIONS' &&
                currentPlayer.eliminations === null
              ) {
                currentPlayer.eliminations = num
                assignedToColumn = true
              } else if (
                headerName === 'KILLS' &&
                currentPlayer.kills === null
              ) {
                currentPlayer.kills = num
                assignedToColumn = true
              } else if (
                headerName === 'ASSISTS' &&
                currentPlayer.assists === null
              ) {
                currentPlayer.assists = num
                assignedToColumn = true
              }
            }
          }
          if (assignedToColumn) break
        }
      }
    }

    if (currentNameParts.length > 0) {
      let combinedName = currentNameParts.join('')
      const nameMatch = combinedName.match(
        /(?:\[[A-Za-z0-9_]+\])?([A-Za-z0-9_]+)/
      )
      if (nameMatch && nameMatch[1]) {
        currentPlayer.name = nameMatch[1]
      } else {
        currentPlayer.name = combinedName.replace(/^\d+\s*/, '')
      }
    }

    if (
      currentPlayer.name &&
      (currentPlayer.eliminations !== null ||
        currentPlayer.kills !== null ||
        currentPlayer.assists !== null)
    ) {
      players.push(currentPlayer as Player)
    }
  }
  return { players }
}
