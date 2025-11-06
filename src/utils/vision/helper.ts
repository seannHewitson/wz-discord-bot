import { ImageAnnotatorClient } from '@google-cloud/vision'

import { ParsedAnnotation } from './types'

const client = new ImageAnnotatorClient()

export async function getAnnotations(
  url: string
): Promise<{ annotations: ParsedAnnotation[]; text: string } | null> {
  if (!url) {
    console.error('No URL provided for text extraction.')
    return null
  }
  try {
    const [data] = await client.textDetection(url)
    const detections = data.textAnnotations

    if (!detections || detections.length === 0) {
      console.log('No text found in the image.')
      return null
    }

    const annotations = detections.slice(1).map((annotation: any) => {
      const box = annotation.boundingPoly.vertices
      return {
        text: annotation.description.trim(),
        x: box[0].x,
        y: box[0].y,
        width: box[1].x - box[0].x,
        height: box[2].y - box[0].y,
        rawAnnotation: annotation,
      }
    })

    return {
      annotations,
      text: data.fullTextAnnotation?.text || '',
    }
  } catch (error) {
    console.error('Error processing image with Google Vision:', error)
    return null
  }
}

export function cleanupPlayerName(name: string): string | null {
  // Remove leading/trailing spaces
  name = name.trim()

  // Regex to handle [TAG]PlayerName_suffix patterns and remove leading numbers (levels)
  // Example: "701[UKSM]Starblord_lv426" -> "UKSM]Starblord_lv426" (or better, "Starblord_lv426")
  // Let's refine this to correctly extract the main name part.
  // This regex attempts to capture the main name part after an optional [TAG] and before optional _suffix
  // It is designed to extract "PlayerName" from "[TAG]PlayerName_suffix" or "PlayerName_suffix"
  const namePattern =
    /(?:\[[A-Za-z0-9_]+\])?([A-Za-z0-9_]+(?:_[A-Za-z0-9_]+)?)/i
  const match = name.match(namePattern)

  if (match && match[1]) {
    let cleaned = match[1]
    // Further clean if it picked up leading numbers not part of a tag
    cleaned = cleaned.replace(/^\d+\s*/, '').trim()
    return cleaned.length > 1 ? cleaned : null // Ensure name is at least 2 characters long
  }

  // Fallback: remove leading numbers and characters that are clearly not part of a name
  const fallbackCleaned = name.replace(/^\d+\s*|^[\[\]\-=\s]+/, '').trim() // Remove leading digits, brackets, hyphens, etc.

  // Filter out known artifacts or single characters that aren't valid names
  if (
    fallbackCleaned.length < 2 ||
    ['[', ']', '-', '='].includes(fallbackCleaned)
  ) {
    return null
  }

  return fallbackCleaned
}
