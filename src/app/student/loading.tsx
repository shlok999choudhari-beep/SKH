import { MorphingInfinity } from '@/components/ui/morphing-infinity'

export default function StudentLoading() {
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
      <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#8b5cf6' }} />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', letterSpacing: '0.05em' }}>
        Loading student portal...
      </p>
    </div>
  )
}
