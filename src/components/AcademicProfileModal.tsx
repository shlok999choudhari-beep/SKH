'use client'

import React from 'react'
import AcademicVerificationFlow from '@/components/AcademicVerificationFlow'
import { ShieldAlert, X } from 'lucide-react'

interface AcademicProfileModalProps {
  studentProfile: any
  onSave: (updatedProfile: any) => void
  onClose?: () => void
}

export default function AcademicProfileModal({
  studentProfile,
  onSave,
  onClose
}: AcademicProfileModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1.5rem',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)',
          animation: 'fadeIn 0.2s ease-out',
          position: 'relative'
        }}
      >
        {/* Banner for existing users */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '20px'
          }}
        >
          <ShieldAlert size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#fef08a' }}>
              Academic Verification Required
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              To continue using PlaceIQ, please verify your academic information by uploading your 10th and 12th marksheets.
              Your official marks and name will be extracted automatically.
            </p>
          </div>
        </div>

        {/* Verification Component */}
        <AcademicVerificationFlow
          isModal={true}
          onSuccess={(verifiedStudent) => {
            onSave(verifiedStudent)
            if (onClose) {
              onClose()
            }
          }}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
