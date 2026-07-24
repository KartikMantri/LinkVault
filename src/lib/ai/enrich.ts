import Groq from 'groq-sdk'

export type Enrichment = {
  summary: string
  category: string
  tags: string[]
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are a bookmarking assistant. Given a saved link's title and caption, respond ONLY with JSON matching this shape:
{"summary": "one short sentence", "category": "one word or short phrase, e.g. recipe, workout, shopping, article, meme, tutorial", "tags": ["3-5 lowercase keywords"]}`

// Isolated behind this one function so swapping providers (e.g. to Anthropic
// Claude later, which also supports vision on the thumbnail) only means
// changing what's inside here.
export async function enrichLink(input: {
  title: string | null
  caption: string | null
  thumbnailUrl: string | null
}): Promise<Enrichment> {
  const textContext = [input.title, input.caption].filter(Boolean).join('\n') || 'No caption available.'

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: textContext },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from Groq')

  const parsed = JSON.parse(raw) as Partial<Enrichment>

  return {
    summary: parsed.summary ?? '',
    category: parsed.category ?? 'other',
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
  }
}
