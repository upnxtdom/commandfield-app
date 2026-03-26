import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LogEntry {
  id: string
  type: 'user' | 'system' | 'error'
  text: string
  timestamp: Date
}

interface HistoryEntry {
  id: string
  raw_text: string
  command_type: string
  reply: string
  created_at: string
}

const CHIPS = ['jobs today', 'kpi today', 'kpi week', 'workers', 'help']

const Dispatch = () => {
  const { session, profile, user } = useAuth()
  const [command, setCommand] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [logHistory, setLogHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const addEntry = (type: LogEntry['type'], text: string) => {
    setLog(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      text,
      timestamp: new Date()
    }])
  }

  // Auto-scroll to bottom on new log entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log])

  // Fetch command history on mount
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/dispatch/log/${profile!.business_id}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      const data = await res.json()
      setLogHistory(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      // non-blocking
    }
  }, [profile?.business_id, session?.access_token])

  useEffect(() => {
    if (session?.access_token && profile?.business_id) {
      fetchHistory()
    }
  }, [session?.access_token, profile?.business_id, fetchHistory])

  const sendCommand = async () => {
    const text = command.trim()
    if (!text || loading) return

    addEntry('user', text)
    setCommand('')
    setLoading(true)

    try {
      const res = await fetch('/api/dispatch/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`
        },
        body: JSON.stringify({
          business_id: profile!.business_id,
          user_id: user?.id,
          text,
          role: profile?.role ?? 'owner'
        })
      })
      const data = await res.json()
      if (data.success && data.reply) {
        addEntry('system', data.reply)
      } else {
        addEntry('error', data.error || 'Command failed.')
      }
      // Refresh history in background
      fetchHistory()
    } catch (e) {
      addEntry('error', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendCommand()
  }

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="flex flex-col gap-4 max-w-3xl h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dispatch Command</h1>
        <div className="flex items-center gap-1.5 text-sm text-green-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Command log */}
      <div
        ref={scrollRef}
        className="rounded-lg bg-[#0A0F1E] border border-border p-4 overflow-y-auto"
        style={{ minHeight: '400px', maxHeight: '480px' }}
      >
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-16">
            <span className="text-4xl">📡</span>
            <p className="text-foreground font-medium">Command center ready</p>
            <p className="text-sm text-muted-foreground">Type a command or use the chips below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {log.map(entry => (
              <div key={entry.id} className={`flex ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] space-y-0.5 ${entry.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    entry.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : entry.type === 'error'
                      ? 'bg-[#1E293B] border border-red-500 text-red-400'
                      : 'bg-[#1E293B] text-foreground'
                  }`}>
                    {entry.type === 'user' ? `> ${entry.text}` : entry.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {fmtTime(entry.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1E293B] rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  Processing…
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => setCommand(chip)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#1E293B] text-muted-foreground hover:text-foreground hover:bg-blue-600/20 transition-colors border border-border"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Command input bar */}
      <div className="rounded-lg bg-[#1E293B] p-3 flex gap-2">
        <Input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command... e.g. 'jobs today' or 'assign job to @mike'"
          disabled={loading}
          className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button
          onClick={sendCommand}
          disabled={loading || !command.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
          Send →
        </Button>
      </div>

      {/* Recent commands history */}
      <div className="rounded-lg bg-[#1E293B] overflow-hidden">
        <button
          onClick={() => setHistoryOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
        >
          <span>Recent Commands</span>
          <span className="text-muted-foreground">{historyOpen ? '▲' : '▼'}</span>
        </button>
        {historyOpen && (
          <div className="border-t border-border divide-y divide-border">
            {logHistory.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">No command history yet.</p>
            ) : (
              logHistory.slice(0, 10).map(h => (
                <div key={h.id} className="px-4 py-2 grid grid-cols-[auto_1fr_2fr] gap-3 items-start">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-blue-400 truncate">{h.raw_text}</span>
                  <span className="text-xs text-muted-foreground truncate">{h.reply}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dispatch
