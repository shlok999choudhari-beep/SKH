'use client'
import React, { useState, useEffect, use } from 'react'
import Logo from '@/components/Logo'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  Hash,
  Award,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'

export default function DocumentVerificationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)

  useEffect(() => {
    if (!id) return
    const verifyDoc = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/verify/document/${id}`)
        const result = await res.json()
        if (result.success && result.verification) {
          setData(result.verification)
        } else {
          setError(result.error || 'This credential could not be verified on the institutional ledger.')
        }
      } catch (err: any) {
        setError('Verification service unavailable: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    verifyDoc()
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a10', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18,18,26,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo variant="student" size="sm" href="/" />
          <div style={{ height: '18px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> Official Certificate Verification
          </span>
        </div>
      </header>

      {/* Main Verification Card */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
            <RefreshCw size={22} className="animate-spin" color="#10b981" />
            <span>Verifying Cryptographic Ledger Seal...</span>
          </div>
        ) : error ? (
          <div style={{ background: '#141420', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '40px', maxWidth: '480px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <AlertTriangle size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fca5a5' }}>
              Verification Failed
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        ) : data ? (
          <div style={{ background: '#12121c', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '22px', padding: '36px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px', boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px -10px rgba(16,185,129,0.2)' }}>
            {/* Status Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#34d399', fontWeight: 700 }}>
                  PlaceIQ Verified Credential
                </span>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0 0', color: '#f8fafc' }}>
                  ✓ Authentic Document
                </h1>
              </div>
            </div>

            {/* Document Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={13} color="#a78bfa" /> Document
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', display: 'block' }}>
                  {data.title}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} color="#60a5fa" /> Issued To
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', display: 'block' }}>
                  {data.issuedTo}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} color="#34d399" /> Issuing Authority
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', display: 'block' }}>
                  {data.issuingAuthority}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#f59e0b" /> Issue Date
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', display: 'block' }}>
                  {new Date(data.issuedDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Cryptographic SHA-256 Fingerprint */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hash size={13} color="#38bdf8" /> Cryptographic SHA-256 Fingerprint
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(data.sha256Fingerprint || '')
                    setCopiedHash(true)
                    setTimeout(() => setCopiedHash(false), 2000)
                  }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedHash ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', wordBreak: 'break-all' }}>
                {data.sha256Fingerprint}
              </span>
            </div>

            {/* Institutional Seal Guarantee */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
              <span>ID: {data.documentId}</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Verified via PlaceIQ Digital Vault</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
