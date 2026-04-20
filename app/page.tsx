'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Memo = {
  id: number
  client: string
  media: string
  memo: string
  url: string
  user_name: string
  created_at: string
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [client, setClient] = useState('')
  const [media, setMedia] = useState('')
  const [memo, setMemo] = useState('')
  const [url, setUrl] = useState('')
  const [user, setUser] = useState<any>(null)
  const [scanResults, setScanResults] = useState<Record<number, string[]>>({})
  const [scanning, setScanning] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetchMemos()
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchMemos() {
    const { data } = await supabase.from('memos').select('*').order('created_at', { ascending: false })
    if (data) setMemos(data)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function addMemo() {
    if (!client || !media || !memo || !user) return
    const user_name = user.user_metadata?.full_name || user.email
    await supabase.from('memos').insert([{ client, media, memo, url, user_name }])
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md"></div>
          <span className="font-semibold text-gray-900 text-lg">Ad Memo</span>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.user_metadata?.full_name || user.email}</span>
            <button className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <button className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700" onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        )}
      </header>
      <main className="max-w-3xl mx-auto px-8 py-10">
        {user && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">New Memo</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Client" value={client} onChange={e => setClient(e.target.value)} />
              <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Media (Meta / Google)" value={media} onChange={e => setMedia(e.target.value)} />
            </div>
            <input className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" placeholder="URL (optional)" value={url} onChange={e => setUrl(e.target.value)} />
            <textarea className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" placeholder="Memo" rows={3} value={memo} onChange={e => setMemo(e.target.value)} />
            <button className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700" onClick={addMemo}>Save</button>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {memos.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{m.client}</span>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{m.media}</span>
                    {m.user_name && <span className="text-xs text-gray-400">by {m.user_name}</span>}
                  </div>
                  {user && (
                    <button className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0" onClick={() => deleteMemo(m.id)}>Delete</button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{m.memo}</p>
                {m.url && <p className="text-xs text-indigo-500 break-all mb-2">{m.url}</p>}
                <div className="flex items-center gap-3">
                  {m.url && (
                    <button className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700" onClick={() => scanUrl(m.id, m.url)}>
                      {scanning[m.id] ? 'Scanning...' : 'URL Scan'}
                    </button>
                  )}
                  <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString('ja-JP')}</span>
                </div>
              </div>
              {scanResults[m.id] && (
                <div className="w-44 shrink-0 border-l border-gray-100 pl-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">External links: {scanResults[m.id].length}</p>
                  <ul className="flex flex-col gap-1 overflow-y-auto max-h-28">
                    {scanResults[m.id].map((link, i) => (
                      <li key={i} className="text-xs text-indigo-500 break-all">
                        <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
