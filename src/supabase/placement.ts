import { ParsedPlacement } from '../utils/vision/types'
import { supabase } from './'

export const createPlacement = async (
  data: ParsedPlacement[],
  discord_id: string
) => {
  const results = await Promise.all(
    data.map(async (player) => {
      //  Try get player from database.
      const { data: p, error: pError } = await supabase
        .rpc('discord_getplayerlike', { name: player.name })
        .maybeSingle()
      if (pError) {
        console.error('Error fetching player:', pError)
        return player
      }
      if (!p) {
        console.warn(`Player not found in database: ${player.name}`)
        return player
      }
      return {
        ...player,
        name: p.activision_id,
        playerid: p.id,
      }
    })
  )

  return supabase.from('scores').insert(
    results.map((result) => ({
      ...result,
      discord_id,
    }))
  )
}
