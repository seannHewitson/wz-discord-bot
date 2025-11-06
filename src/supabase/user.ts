import { supabase } from '.'
import { User } from 'discord.js'

export const getUser = async (user: User) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('discord_id', user.id)
    .maybeSingle()
  return { user: data, userError: error }
}

export const registerUser = async (user: User, activisionId: string) => {
  const { error } = await supabase.from('players').insert({
    discord_id: user.id,
    activision_id: activisionId,
    username: user.username,
    avatar_url: user.avatar,
    globalname: user.globalName,
  })
  return { error }
}
