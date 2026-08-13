import UniqueLoading from '@/components/ui/morph-loading'

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
      <UniqueLoading variant="morph" size="lg" />
      <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', letterSpacing: '0.05em' }}>
        Loading student portal...
      </p>
    </div>
  )
}
