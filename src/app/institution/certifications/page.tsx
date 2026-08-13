'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InstitutionCertificationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/institution/documents')
  }, [router])

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Redirecting to Student Documents Vault...
    </div>
  )
}
