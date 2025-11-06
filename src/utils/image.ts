import { config } from '../config'

type Bucket = 'avatars' | 'banner' | 'competitions' | 'winners'

export const getImage = (bucket: Bucket, image: string) =>
  `https://${config.env === 'production' ? 'oftuomyeoppzucvjyufl' : 'ummwfuymxpzuoozplhhq'}.supabase.co/storage/v1/object/public/${bucket}/${image}`
