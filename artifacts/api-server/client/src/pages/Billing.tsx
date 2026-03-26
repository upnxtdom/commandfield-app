import { useAuth } from '@/context/AuthContext'

const FEATURES = [
  'Full platform access',
  'Dispatch Command included',
  '3 worker seats',
  '$39/mo per additional seat',
  '30-day money back guarantee',
]

const Billing = () => {
  return (
    <div className="space-y-6 max-w-2xl">

      <h1 className="text-2xl font-bold text-foreground">Billing</h1>

      {/* Founding client banner */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/40 px-4 py-3 space-y-0.5">
        <p className="text-sm font-semibold text-amber-400">⭐ Founding Client — Beta Rate Locked In</p>
        <p className="text-xs text-amber-400/80">
          Your $100/mo rate is locked for life as a founding member.
        </p>
      </div>

      {/* Current plan */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold text-foreground">Beta Plan</p>
            <p className="text-2xl font-bold text-green-400 mt-1">$100<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
            Active
          </span>
        </div>

        <ul className="space-y-2">
          {FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-green-400 text-xs">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Usage */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Usage</h2>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Worker Seats</span>
            <span>1 used / 3 included</span>
          </div>
          <div className="w-full h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Additional Seats</span>
          <span>0 added</span>
        </div>
      </div>

      {/* Support */}
      <div className="rounded-lg bg-[#1E293B] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Support</h2>
        <p className="text-sm text-muted-foreground">Need to upgrade or make changes?</p>
        <p className="text-sm text-muted-foreground">Contact us at <span className="text-foreground">hello@commandfield.com</span></p>
        <a href="mailto:hello@commandfield.com">
          <button className="px-4 py-2 rounded-md border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium">
            Email Support
          </button>
        </a>
      </div>
    </div>
  )
}

export default Billing
