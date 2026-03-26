import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const VERTICALS = ['HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Landscaping', 'Pest Control', 'Pool Service']
const TIMEZONES = ['Central', 'Eastern', 'Mountain', 'Pacific']
const COMMAND_NUMBER = '(979) 202-0380'

const Settings = () => {
  const { session, profile, user, signOut } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [vertical, setVertical] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('Central')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setVertical(profile.vertical || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
      setTimezone(profile.timezone || 'Central')
      setLoading(false)
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaved(true)
    await new Promise(r => setTimeout(r, 2000))
    setSaved(false)
    setSaving(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(COMMAND_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = 'bg-background border-border text-foreground'
  const selectClass = 'w-full rounded-md border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-6 max-w-2xl">

      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Section 1 — Business Profile */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Business Profile</h2>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Business Name</label>
          <Input
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="Your business name"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Industry</label>
          <select
            value={vertical}
            onChange={e => setVertical(e.target.value)}
            className={selectClass}
          >
            <option value="">Select industry...</option>
            {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Business Phone</label>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Business Address</label>
          <Input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="123 Main St, City, State"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Timezone</label>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className={selectClass}
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className={`${saved ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Section 2 — Command Number */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Command Number</h2>
        <p className="text-xs text-muted-foreground">Your CommandField Number</p>
        <p className="text-3xl font-bold text-foreground tracking-wide">{COMMAND_NUMBER}</p>
        <p className="text-xs text-muted-foreground">Text this number to control your operation</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-border text-foreground"
        >
          {copied ? 'Copied!' : 'Copy Number'}
        </Button>
      </div>

      {/* Section 3 — Account */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Account</h2>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm text-foreground">{user?.email ?? '—'}</p>
        </div>
        <Button
          variant="outline"
          onClick={signOut}
          className="border-red-500 text-red-400 hover:bg-red-500/10"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default Settings
