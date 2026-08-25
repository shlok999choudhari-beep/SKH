import Logo from '@/components/Logo'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-primary, #060010)',
      gap: '1.5rem',
    }}>
      <Logo variant="student" size="xl" href="" withBadge badgeText="AI" />
      <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
        Initializing PlaceIQ Intelligence...
      </p>
    </div>
  )
}
