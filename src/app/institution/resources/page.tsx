'use client'
import { useState, useEffect } from 'react'
import styles from '../institution.module.css'

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await fetch('/api/resources')
        const data = await res.json()
        if (data.resources) {
          setResources(data.resources)
        }
      } catch (err) {
        console.error('Error fetching resources:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [])

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Resources Management</h1>
          <p className={styles.pageSubtitle}>Manage labs, rooms, and shared assets.</p>
        </div>
        <button className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>
          + Add Resource
        </button>
      </header>

      <main className={styles.main}>

      <div className={styles.card}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          Resource Catalog
        </h2>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading resources...</div>
        ) : resources.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>No resources found. Click "Add Resource" to create one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {resources.map((resource) => (
              <div key={resource.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <div>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{resource.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Type: {resource.type} {resource.capacity ? `| Capacity: ${resource.capacity}` : ''}
                  </p>
                </div>
                <div>
                  <span className={`badge ${resource.status === 'active' ? 'badge-green' : 'badge-orange'}`}>
                    {resource.status}
                  </span>
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
