'use client'
import { useState } from 'react'
import { GraduationCap, ArrowRight, X } from 'lucide-react'

interface AcademicProfileModalProps {
  studentProfile: any
  onSave: (updatedProfile: any) => void
  onClose?: () => void
}

export default function AcademicProfileModal({ studentProfile, onSave, onClose }: AcademicProfileModalProps) {
  const [cgpa, setCgpa] = useState(studentProfile?.cgpa ? String(studentProfile.cgpa) : '8.2')
  const [tenthMarks, setTenthMarks] = useState(studentProfile?.tenth_marks || studentProfile?.tenthMarks ? String(studentProfile.tenth_marks || studentProfile.tenthMarks) : '85')
  const [twelfthMarks, setTwelfthMarks] = useState(studentProfile?.twelfth_marks || studentProfile?.twelfthMarks ? String(studentProfile.twelfth_marks || studentProfile.twelfthMarks) : '88')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cgpa || !tenthMarks || !twelfthMarks) {
      alert('Please fill in all academic details')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cgpa: parseFloat(cgpa),
          tenth_marks: parseFloat(tenthMarks),
          twelfth_marks: parseFloat(twelfthMarks)
        })
      })

      if (res.ok) {
        alert('Academic profile completed successfully!')
        onSave({
          ...studentProfile,
          cgpa: parseFloat(cgpa),
          tenth_marks: parseFloat(tenthMarks),
          tenthMarks: parseFloat(tenthMarks),
          twelfth_marks: parseFloat(twelfthMarks),
          twelfthMarks: parseFloat(twelfthMarks)
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save academic profile')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while saving profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
    >
      <div 
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease-out',
          position: 'relative'
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close modal"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.15)', color: '#8b5cf6', marginBottom: '12px' }}>
            <GraduationCap size={32} strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Complete Your Academic Profile
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Enter your CGPA, 10th %, and 12th % to unlock matching company internship opportunities.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Current CGPA / GPA (out of 10.0) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 8.5"
              value={cgpa}
              onChange={e => setCgpa(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                12th / Diploma Marks % *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 88.5"
                value={twelfthMarks}
                onChange={e => setTwelfthMarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                10th Marks % *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 85.0"
                value={tenthMarks}
                onChange={e => setTenthMarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            {onClose && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Remind Later
              </button>
            )}
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              disabled={submitting}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>{submitting ? 'Saving...' : 'Save & Unlock Internships'}</span>
              {!submitting && <ArrowRight size={16} strokeWidth={2} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
