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
      <UniqueLoading variant="morph" size="lg" />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', letterSpacing: '0.05em' }}>
        Loading PlaceIQ...
      </p>
    </div>
  )
}
