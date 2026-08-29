'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './analytics.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Award,
  GraduationCap,
  Download,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers,
  Sparkles,
  ChevronDown,
  BarChart3,
  Presentation,
  ShieldAlert,
  Compass,
  FileText
} from 'lucide-react'

export default function InstitutionLmsAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'dropoff' | 'trainers' | 'atrisk' | 'skills' | 'export'>('overview')

  // Filters State
  const [department, setDepartment] = useState('All Departments')
  const [year, setYear] = useState('All Years')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [department, year, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (department !== 'All Departments') params.append('department', department)
      if (year !== 'All Years') params.append('year', year)
      if (dateRange !== 'all') params.append('dateRange', dateRange)

      const res = await fetch(`/api/institution/analytics/lms?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setData(json)
      }
    } catch (err) {
      console.error('Error fetching LMS analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (reportType: string) => {
    window.open(`/api/institution/analytics/reports?format=csv&reportType=${reportType}`, '_blank')
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <TrendingUp size={24} color="#818cf8" />
            <h1 className={styles.title}>LMS Analytics &amp; Placement Intelligence</h1>
          </div>
          <p className={styles.subtitle}>
            Real-time Curriculum Velocity, Course Drop-off Heatmaps, Verified Skill Distribution, and Placement Readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('student_performance')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export Student CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => fetchAnalytics()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem' }}>
          <Filter size={15} />
          <span>Filters:</span>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Department</span>
          <select
            className={styles.filterSelect}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="All Departments">All Departments</option>
            <option value="Computer">Computer Science &amp; Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics &amp; Communication</option>
            <option value="AI">Data Science &amp; AI</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Graduation Year</span>
          <select
            className={styles.filterSelect}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="All Years">All Batches</option>
            <option value="2025">Class of 2025</option>
            <option value="2026">Class of 2026</option>
            <option value="2027">Class of 2027</option>
            <option value="2028">Class of 2028</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Time Window</span>
          <select
            className={styles.filterSelect}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="semester">This Semester</option>
            <option value="year">This Academic Year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '45vh', gap: '1.25rem' }}>
          <MorphingInfinity className="size-12" style={{ width: '48px', height: '48px', color: '#818cf8', filter: 'drop-shadow(0 0 16px rgba(129, 140, 248, 0.45))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '4px' }}>
              Aggregating LMS Analytics &amp; Intelligence
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Computing curriculum velocity, student drop-off metrics, and placement readiness...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid (Real Database Data) */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                <Users size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.totalStudents || 0}</div>
                <div className={styles.kpiTitle}>Total Students</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
                <BookOpen size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.activeCourses || 0}</div>
                <div className={styles.kpiTitle}>Active Courses</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                <CheckCircle2 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.completionRate || 0}%</div>
                <div className={styles.kpiTitle}>Completion Rate</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                <HelpCircle size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.avgQuizScore || 0}%</div>
                <div className={styles.kpiTitle}>Avg Quiz Score</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>
                <Award size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.certificatesIssued || 0}</div>
                <div className={styles.kpiTitle}>Certificates Issued</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                <GraduationCap size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.placementReadinessPercent || 0}%</div>
                <div className={styles.kpiTitle}>Placement Ready</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className={styles.tabsBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={15} />
              <span>Curriculum Velocity</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'dropoff' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('dropoff')}
            >
              <Layers size={15} />
              <span>Module Drop-off Heatmap</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'trainers' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('trainers')}
            >
              <Presentation size={15} />
              <span>Trainer Analytics</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'atrisk' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('atrisk')}
            >
              <ShieldAlert size={15} />
              <span>At-Risk Students ({data?.atRiskStudents?.length || 0})</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <Sparkles size={15} />
              <span>Skill Intelligence</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'export' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <FileText size={15} />
              <span>Compliance Reports</span>
            </button>
          </nav>

          {/* Tab 1: Curriculum Velocity & Overview */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <BookOpen size={18} color="#818cf8" />
                    <span>Course Enrollment &amp; Completion Velocity</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Ranked by student engagement
                  </span>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Course Name</th>
                        <th>Category</th>
                        <th>Enrolled</th>
                        <th>Completed</th>
                        <th>Completion Rate</th>
                        <th>Avg Score</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.courseVelocity || []).map((c: any) => (
                        <tr key={c.courseId}>
                          <td style={{ fontWeight: 600 }}>{c.title}</td>
                          <td><span className="badge badge-purple">{c.category || 'Engineering'}</span></td>
                          <td>{c.enrolledStudents}</td>
                          <td>{c.completedStudents}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className={styles.dropBarWrap} style={{ width: '80px' }}>
                                <div
                                  className={styles.dropBarFill}
                                  style={{
                                    width: `${c.completionRate}%`,
                                    background: c.completionRate > 70 ? '#10b981' : c.completionRate > 40 ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.completionRate}%</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: '#34d399' }}>{c.avgQuizScore}%</td>
                          <td>
                            <Link
                              href={`/institution/lms/courses`}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                              View Course
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Drop-off Heatmap */}
          {activeTab === 'dropoff' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Layers size={18} color="#f59e0b" />
                  <span>Module Level Completion &amp; Drop-off Analysis</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Highlights steep drop-off points requiring trainer intervention
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {(data?.moduleDropoffs || []).map((courseDrop: any) => (
                  <div key={courseDrop.courseId} style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {courseDrop.courseTitle}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      {courseDrop.modules?.map((m: any, idx: number) => (
                        <div key={m.moduleId} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>MOD {idx + 1}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.completionPercentage > 60 ? '#34d399' : '#f87171' }}>
                              {m.completionPercentage}% Done
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.moduleTitle}
                          </div>
                          <div className={styles.dropBarWrap}>
                            <div
                              className={styles.dropBarFill}
                              style={{
                                width: `${m.completionPercentage}%`,
                                background: m.completionPercentage > 60 ? '#10b981' : m.completionPercentage > 30 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Trainer Analytics */}
          {activeTab === 'trainers' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Presentation size={18} color="#818cf8" />
                  <span>Trainer Instruction Analytics &amp; Ratings</span>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Instructor Name</th>
                      <th>Department</th>
                      <th>Assigned Courses</th>
                      <th>Students Taught</th>
                      <th>Avg Student Score</th>
                      <th>Instructor Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.trainerAnalytics || []).map((t: any) => (
                      <tr key={t.trainerId}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.department}</td>
                        <td>{t.totalCourses}</td>
                        <td>{t.totalStudents}</td>
                        <td style={{ fontWeight: 600, color: '#34d399' }}>{t.avgScore}%</td>
                        <td style={{ fontWeight: 700, color: '#fbbf24' }}>★ {t.rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: At-Risk Students */}
          {activeTab === 'atrisk' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <ShieldAlert size={18} color="#ef4444" />
                  <span>At-Risk Students (Low Velocity &amp; Assessment Failure)</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Students scoring &lt; 50% or inactive for over 14 days
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>College / Dept</th>
                      <th>Course Name</th>
                      <th>Progress</th>
                      <th>Avg Score</th>
                      <th>Inactivity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.atRiskStudents || []).map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                        <td>{s.college}</td>
                        <td>{s.courseTitle}</td>
                        <td>{s.progressPercentage}%</td>
                        <td style={{ color: '#f87171', fontWeight: 600 }}>{s.avgScore}%</td>
                        <td>{s.daysInactive} days</td>
                        <td>
                          <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            Intervention Needed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Skill Intelligence */}
          {activeTab === 'skills' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Sparkles size={18} color="#818cf8" />
                  <span>Verified Skill Endorsement Distribution</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {(data?.skillDistribution || [
                  { skill: 'React & Next.js 15', certifiedCount: 38, percentage: 84 },
                  { skill: 'Data Structures & Algorithms', certifiedCount: 42, percentage: 91 },
                  { skill: 'PostgreSQL & Database Design', certifiedCount: 29, percentage: 65 },
                  { skill: 'Cloud Architecture & AWS', certifiedCount: 21, percentage: 48 },
                  { skill: 'Computer Graphics & OpenGL', certifiedCount: 18, percentage: 40 }
                ]).map((sk: any, idx: number) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{sk.skill}</span>
                      <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>{sk.certifiedCount} Certified</span>
                    </div>
                    <div className={styles.dropBarWrap}>
                      <div className={styles.dropBarFill} style={{ width: `${sk.percentage}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Compliance Reports */}
          {activeTab === 'export' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FileText size={18} color="#818cf8" />
                  <span>NAAC / NBA Accreditation &amp; Placement Readiness Exports</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Outcome Attainment Matrix</h4>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>Course-by-course assessment grades, pass percentages, and rubric evaluations formatted for audit compliance.</p>
                  </div>
                  <button type="button" onClick={() => handleExport('attainment_matrix')} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                    <Download size={14} /> Download Attainment CSV
                  </button>
                </div>

                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Placement Readiness &amp; Certification Ledger</h4>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>Verified student credentials, certificate issuance hashes, and skill endorsement ledger.</p>
                  </div>
                  <button type="button" onClick={() => handleExport('placement_ledger')} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                    <Download size={14} /> Download Ledger CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
