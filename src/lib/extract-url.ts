// Share sheets don't consistently populate the `url` field — Instagram in
// particular tends to dump the link inside `text` instead. This finds the
// first usable URL across whichever fields are actually populated.
export function extractSharedUrl(fields: {
  url?: string
  text?: string
  title?: string
}): string | null {
  const candidates = [fields.url, fields.text, fields.title]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (isValidUrl(candidate)) return candidate

    const match = candidate.match(/https?:\/\/[^\s]+/)
    if (match && isValidUrl(match[0])) return match[0]
  }

  return null
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
