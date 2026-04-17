'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Memo = {
  id: number
  client: string
  media: string
  memo: string
  created_at: string
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [client, setClient] = useState('')
  const [media, setMedia] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    fetchMemos()
  }, [])

  async function fetchMemos() {
    const { data } = await supabase.from('memos').select('*').order('created_at', { ascending: false })
    if (data) setMemos(data)
  }

  async function addMemo() {
    if (!client || !media || !memo) return
    await supabase.from('memos').insert([{ client, media, memo }])
    setClient('')
    setMedia('')
    setMemo('')
    fetchMemos()
  }

  async function deleteMemo(id: number) {
    await supabase.from('memos').delete().eq('id', id)
    fetchMemos()
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Ad Memo</h1>
      <div className="flex flex-col gap-3 mb-8">
        <input className="border p-2 rounded" placeholder="Client" value={client} onChange={e => setClient(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Media (Meta / Google)" value={media} onChange={e => setMedia(e.target.value)} />
        <textarea className="border p-2 rounded" placeholder="Memo" rows={3} value={memo} onChange={e => setMemo(e.target.value)} />
        <button className="bg-black text-white p-2 rounded" onClick={addMemo}>Save</button>
      </div>
      <div className="flex flex-col gap-4">
        {memos.map(m => (
          <div key={m.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold">{m.client}</span>
                <span className="ml-2 text-gray-500 text-sm">{m.media}</span>
              </div>
              <button className="text-red-400 text-sm" onClick={() => deleteMemo(m.id)}>Delete</button>
            </div>
            <p className="mt-2 text-gray-700">{m.memo}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(m.created_at).toLocaleString('ja-JP')}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
