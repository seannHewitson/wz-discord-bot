import { getAnnotations } from './helper'
import { getLobbyCode } from './lobbyCode'
import { parse } from './parse'
import { Image, ParsedPlacement, PlacementResult, Player } from './types'

export const warzoneParser = async (images: Image[]) => {
  const data: Partial<Record<string, any>> = {}
  await Promise.all(
    images.map(async ({ url, ...image }) => {
      const response = await getAnnotations(url)
      if (!response) {
        console.warn(`No annotations found for image: ${url}`)
        return
      }
      const { annotations, text } = response
      const height = image.height || 1080
      const width = image.width || 1920
      const lobbycode = getLobbyCode({ annotations, height, width })
      if (!lobbycode) {
        console.warn(`No lobby code found for image: ${url}`)
        return
      }
      if (data.lobbycode && data.lobbycode !== lobbycode) {
        console.warn(
          `Multiple lobby codes found: ${data.lobbycode} and ${lobbycode}`
        )
      }
      data.lobbycode = lobbycode

      const parsed = await parse({ annotations, height, text, width })
      if (!parsed) {
        console.warn(`No parsed data found for image: ${url}`)
        return
      }

      Object.entries(parsed).forEach(([key, value]) => (data[key] = value))
    })
  )

  return (data?.players?.map((player: Player) => ({
    ...player,
    lobbycode: data?.lobbycode,
    mapname: data?.mapname,
    gamemode: data?.gamemode,
    placement: data?.placement,
  })) ?? null) as ParsedPlacement[] | null
}
