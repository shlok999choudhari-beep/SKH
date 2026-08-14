import Logo from '@/components/Logo'
import UniqueLoading from '@/components/ui/morph-loading'

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
      <UniqueLoading variant="morph" size="sm" />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
        Initializing PlaceIQ Intelligence...
      </p>
    </div>
  )
}
