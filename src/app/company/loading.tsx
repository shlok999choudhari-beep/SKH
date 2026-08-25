import { MorphingInfinity } from '@/components/ui/morphing-infinity'

export default function CompanyLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%',
      gap: '1.5rem',
    }}>
      <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#10b981' }} />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', letterSpacing: '0.05em' }}>
        Loading company portal...
      </p>
    </div>
  )
}
