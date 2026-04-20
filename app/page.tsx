'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Memo = {
  id: number
  client: string
  media: string
  memo: string
  url: string
  created_at: string
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [client, setClient] = useState('')
  const [media, setMedia] = useState('')
  const [memo, setMemo] = useState('')
  const [url, setUrl] = useState('')
  const [scanResults, setScanResults] = useState<Record<number, string[]>>({})
  const [scanning, setScanning] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchMemos()
  }, [])

  async function fetchMemos() {
    const { data } = await supabase.from('memos').select('*').order('created_at', { ascending: false })
    if (data) setMemos(data)
  }

  async function addMemo() {
    if (!client || !media || !memo) return
    await supabase.from('memos').insert([{ client, media, memo, url }])
    setClient('')
    setMedia('')
    setMemo('')
    setUrl('')
    fetchMemos()
  }

  async function deleteMemo(id: number) {
    await supabase.from('memos').delete().eq('id', id)
    fetchMemos()
  }

  async function scanUrl(id: number, targetUrl: string) {
    if (!targetUrl) return
    setScanning(prev => ({ ...prev, [id]: true }))
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl })
    })
    const data = await res.json()
    setScanResults(prev => ({ ...prev, [id]: data.links || [] }))
    setScanning(prev => ({ ...prev, [id]: false }))
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Ad Memo</h1>
      <div className="flex flex-col gap-3 mb-8">
        <input className="border p-2 rounded" placeholder="Client" value={client} onChange={e => setClient(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Media (Meta / Google)" value={media} onChange={e => setMedia(e.target.value)} />
        <input className="border p-2 rounded" placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
        <textarea className="border p-2 rounded" placeholder="Memo" rows={3} value={memo} onChange={e => setMemo(e.target.value)} />
        <button className="bg-black text-white p-2 rounded" onClick={addMemo}>Save</button>
      </div>
      <div className="flex flex-col gap-4">
        {memos.map(m => (
          <div key={m.id} className="border p-4 rounded">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold">{m.client}</span>
                    <span className="ml-2 text-gray-500 text-sm">{m.media}</span>
                  </div>
                  <button className="text-red-400 text-sm" onClick={() => deleteMemo(m.id)}>Delete</button>
                </div>
                <p className="mt-2 text-gray-700">{m.memo}</p>
                {m.url && (
                  <p className="mt-1 text-xs text-blue-500 break-all">{m.url}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {m.url && (
                    <button
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                      onClick={() => scanUrl(m.id, m.url)}
                    >
                      {scanning[m.id] ? 'Scanning...' : 'URL Scan'}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">{new Date(m.created_at).toLocaleString('ja-JP')}</p>
              </div>
              {scanResults[m.id] && (
                <div className="w-48 border-l pl-4 text-xs">
                  <p className="font-bold mb-1">External links: {scanResults[m.id].length}</p>
                  <ul className="flex flex-col gap-1 overflow-y-auto max-h-32">
                    {scanResults[m.id].map((link, i) => (
                      <li key={i} className="text-blue-600 break-all">
                        <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
