'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../trainer.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  BookOpen,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Edit,
  Eye,
  FileCheck,
  FolderKanban
} from 'lucide-react'

export default function TrainerDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentCourses, setRecentCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainerStats()
  }, [])

  const fetchTrainerStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trainer/stats')
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setRecentCourses(data.recentCourses || [])
      }
    } catch (err) {
      console.error('Error fetching trainer stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <MorphingInfinity className="size-16" style={{ width: '56px', height: '56px', color: '#8b5cf6' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading instructor analytics...</p>
      </div>
    )
  }

  const s = stats || {
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalEnrolledStudents: 0,
    avgCompletionRate: 0
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Trainer & Instructor Hub</h1>
          <p className={styles.subtitle}>
            Create structured curriculums, organize modules & learning resources, and review student progress.
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/trainer/courses/create" className="btn btn-primary btn-sm">
            <Plus size={15} strokeWidth={2} />
            <span>Create Course</span>
          </Link>
          <Link href="/trainer/courses" className="btn btn-secondary btn-sm">
            <FolderKanban size={15} strokeWidth={2} />
            <span>Manage Courses</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' }}>
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{s.totalCourses}</div>
            <div className={styles.statLabel}>Total Courses</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
            <FileCheck size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{s.publishedCourses}</div>
            <div className={styles.statLabel}>Published</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
            <Clock size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{s.draftCourses}</div>
            <div className={styles.statLabel}>Draft Courses</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
            <Users size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{s.totalEnrolledStudents}</div>
            <div className={styles.statLabel}>Enrolled Students</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <TrendingUp size={22} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{s.avgCompletionRate}%</div>
            <div className={styles.statLabel}>Avg Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Courses List */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Recent Courses & Curriculums
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Your authored learning paths and builder shortcuts
            </p>
          </div>
          <Link href="/trainer/courses" style={{ fontSize: '0.85rem', color: '#c4b5fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
            <span>View All Courses</span>
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
            <BookOpen size={32} strokeWidth={1.5} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Courses Authored Yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Start by creating your first course syllabus with lessons and learning resources.</p>
            <Link href="/trainer/courses/create" className="btn btn-primary btn-sm">
              <Plus size={14} strokeWidth={2} />
              <span>Create First Course</span>
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course Title</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Modules</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</span>
                    </td>
                    <td>{c.category}</td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>{c.difficulty}</span>
                    </td>
                    <td>{c.modulesCount} Modules</td>
                    <td>{c.enrolledCount} Enrolled</td>
                    <td>
                      <span className={`badge ${c.status === 'published' ? 'badge-green' : 'badge-orange'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          href={`/trainer/courses/${c.id}/builder`}
                          className="btn btn-secondary btn-sm"
                          title="Open Course Builder"
                        >
                          <Edit size={13} strokeWidth={2} />
                          <span>Builder</span>
                        </Link>
                        <Link
                          href={`/student/courses/${c.id}`}
                          className="btn btn-ghost btn-sm"
                          title="Preview Course"
                        >
                          <Eye size={13} strokeWidth={2} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
