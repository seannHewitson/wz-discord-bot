import { google } from '@google-cloud/vision/build/protos/protos'

type Annotation = google.cloud.vision.v1.IEntityAnnotation

export type BaseParams = {
  annotations: ParsedAnnotation[]
  height: number
  width: number
}

export type Image = {
  height: number
  width: number
  url: string
}

export type ParsedAnnotation = {
  text: string
  x: number
  y: number
  width: number
  height: number
  rawAnnotation: Annotation
}

export type Player = {
  name: string
  eliminations: number
  kills: number
  assists: number
}

export type PlacementResult = {
  lobbycode: string
  gamemode: string
  mapname: string
  placement: number
  players: Player[]
}

export type ParsedPlacement = PlacementResult & Player
