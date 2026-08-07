export default function InstitutionLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(124, 58, 237, 0.2)',
        borderTopColor: 'var(--accent-violet)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Loading data...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
