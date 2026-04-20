import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  try {
    const res = await fetch(url)
    const html = await res.text()
    const load = cheerio.load(html)

    const links: string[] = []
    load('a[href]').each((_, el) => {
      const href = load(el).attr('href') || ''
      if (href.startsWith('http') && !href.includes(new URL(url).hostname)) {
        links.push(href)
      }
    })

    return NextResponse.json({ links: [...new Set(links)] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
