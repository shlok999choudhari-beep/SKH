'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await fetch('/api/trainers')
        const data = await res.json()
        if (data.trainers) {
          setTrainers(data.trainers)
        }
      } catch (err) {
        console.error('Error fetching trainers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrainers()
  }, [])

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Trainers Management</h1>
          <p className={styles.pageSubtitle}>Manage institutional trainers, specialties, and schedules.</p>
        </div>
        <button className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>
          + Invite Trainer
        </button>
      </header>

      <main className={styles.main}>

      <div className={styles.card}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Trainer Directory
        </h2>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading trainers...</div>
        ) : trainers.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No trainers found. Click "Invite Trainer" to add one.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {trainers.map((trainer) => (
              <div key={trainer.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--grad-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {trainer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'TR'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trainer.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{trainer.email}</p>
                  </div>
                </div>
                {trainer.expertise_tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {trainer.expertise_tags.split(',').map((tag: string) => (
                      <span key={tag} className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Rating: {trainer.rating > 0 ? `${trainer.rating} ⭐` : 'New'}
                  </span>
                  <button className="btn btn-ghost btn-sm">View Schedule</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </>
  )
}
