'use client'

import React from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import AcademicVerificationFlow from '@/components/AcademicVerificationFlow'
import { ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react'

export default function VerifyAcademicsPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15), rgba(15, 23, 42, 0.98) 70%)',
        color: '#f8fafc',
        padding: '32px 20px 80px',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto 32px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px'
        }}
      >
        <Logo variant="student" size="md" href="/student/dashboard" withBadge badgeText="STUDENT" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/student/dashboard"
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Flow */}
      <AcademicVerificationFlow />
    </div>
  )
}
