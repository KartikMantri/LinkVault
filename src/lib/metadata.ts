import * as cheerio from 'cheerio'

export type LinkSource = 'instagram' | 'whatsapp_web' | 'youtube' | 'other'

export type FetchedMetadata = {
  title: string | null
  caption: string | null
  thumbnailUrl: string | null
}

export function detectSource(url: string): LinkSource {
  const host = safeHostname(url)
  if (!host) return 'other'
  if (host.includes('instagram.com')) return 'instagram'
  if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'whatsapp_web'
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
  return 'other'
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

// Best-effort Open Graph scrape. Platforms that block unauthenticated
// scraping (Instagram in particular) may return partial or no metadata —
// that's expected, the link is still saved with status "error" and just the raw URL.
export async function fetchMetadata(url: string): Promise<FetchedMetadata> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; LinkVaultBot/1.0; +https://linkvault.app)',
      Accept: 'text/html',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const og = (prop: string) => $(`meta[property="${prop}"]`).attr('content') ?? null
  const named = (name: string) => $(`meta[name="${name}"]`).attr('content') ?? null

  return {
    title: og('og:title') ?? $('title').first().text() ?? null,
    caption: og('og:description') ?? named('description') ?? null,
    thumbnailUrl: og('og:image') ?? null,
  }
}
