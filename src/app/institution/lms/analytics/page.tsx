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
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <TrendingUp size={24} color="#818cf8" />
            <h1 className={styles.title}>LMS Analytics & Placement Intelligence</h1>
          </div>
          <p className={styles.subtitle}>
            Real-time Curriculum Velocity, Course Drop-off Heatmaps, Verified Skill Distribution, and Placement Readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('student_performance')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export Student CSV</span>
          </button>
          <button
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
            <option value="Computer">Computer Science & Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics">Electronics & Communication</option>
            <option value="AI">Data Science & AI</option>
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
          <MorphingInfinity size={48} />
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
                <div className={styles.kpiValue}>{data?.stats?.courseCompletionRate || 0}%</div>
                <div className={styles.kpiTitle}>Course Completion</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                <HelpCircle size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.averageQuizScore || 0}%</div>
                <div className={styles.kpiTitle}>Avg Quiz Score</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                <Award size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.certificatesCount || 0}</div>
                <div className={styles.kpiTitle}>Certificates Issued</div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>
                <GraduationCap size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div className={styles.kpiValue}>{data?.stats?.placementReadiness || 0}%</div>
                <div className={styles.kpiTitle}>Placement Readiness</div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className={styles.tabsBar}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={16} />
              <span>Executive Overview & Trends</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'dropoff' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('dropoff')}
            >
              <TrendingUp size={16} />
              <span>Course Drop-Off Analysis</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'trainers' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('trainers')}
            >
              <Presentation size={16} />
              <span>Trainer Operational Insights</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'atrisk' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('atrisk')}
            >
              <ShieldAlert size={16} />
              <span>Students Needing Attention ({data?.atRiskStudents?.length || 0})</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <Award size={16} />
              <span>Department Readiness</span>
            </button>
          </div>

          {/* ================= TAB 1: EXECUTIVE OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <GraduationCap size={18} color="#818cf8" />
                    <span>Placement Readiness by Department</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {(data?.departmentBreakdown || []).map((dept: any, idx: number) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.department}</span>
                        <span style={{ fontWeight: 700, color: '#818cf8' }}>{dept.avgReadiness}% Readiness</span>
                      </div>
                      <div className={styles.dropBarWrap}>
                        <div
                          className={styles.dropBarFill}
                          style={{
                            width: `${dept.avgReadiness}%`,
                            background: dept.avgReadiness >= 80 ? 'linear-gradient(90deg, #4f46e5, #818cf8)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <span>{dept.students} Students Enrolled</span>
                        <span>Course Completion: {dept.completionRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <Sparkles size={18} color="#10b981" />
                    <span>Institutional Learning Velocity</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Course Completion Velocity</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{data?.stats?.courseCompletionRate}%</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Based on verified milestone progress across {data?.stats?.totalCourses} curriculum masterclasses.
                    </p>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Assessment Quality Index</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>{data?.stats?.averageQuizScore}% Avg</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Calculated across all timed chapter quizzes and module assessments.
                    </p>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Credential Verification Ratio</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7' }}>{data?.stats?.certificatesCount} Issued</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Tamper-proof verifiable credentials with public QR verification URLs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: COURSE DROP-OFF ANALYSIS ================= */}
          {activeTab === 'dropoff' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <TrendingUp size={18} color="#818cf8" />
                    <span>Curriculum Drop-Off Points & Friction Analysis</span>
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Identifies specific modules where student progress slows or halts to optimize instructional pacing.
                  </p>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Course Title</th>
                      <th>Level</th>
                      <th>Enrollments</th>
                      <th>Completion %</th>
                      <th>Highest Drop-off Point</th>
                      <th>Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.coursePerformance || []).map((c: any) => (
                      <tr key={c.courseId}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>
                          <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {c.difficulty}
                          </span>
                        </td>
                        <td>{c.enrollments} Learners</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, minWidth: '35px' }}>{c.completionRate}%</span>
                            <div className={styles.dropBarWrap} style={{ width: '80px', margin: 0 }}>
                              <div className={styles.dropBarFill} style={{ width: `${c.completionRate}%`, background: '#10b981' }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#fbbf24', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={13} />
                            <span>{c.highestDropOffModule}</span>
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#a855f7' }}>{c.certificatesIssued} Issued</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: TRAINER OPERATIONAL INSIGHTS ================= */}
          {activeTab === 'trainers' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <Presentation size={18} color="#818cf8" />
                    <span>Trainer Delivery & Operational Metrics</span>
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Curriculum management, student enrollment velocity, and assignment turnaround metrics.
                  </p>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Trainer Name</th>
                      <th>Specialization</th>
                      <th>Courses Managed</th>
                      <th>Students Reached</th>
                      <th>Avg Student Score</th>
                      <th>Grading Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.trainerAnalytics || []).map((t: any) => (
                      <tr key={t.trainerId}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.specialization || 'Full-Stack Web Engineering'}</td>
                        <td>{t.coursesManaged} Active Courses</td>
                        <td>{t.studentsEnrolled} Students</td>
                        <td style={{ fontWeight: 700, color: '#34d399' }}>{t.avgStudentScore}%</td>
                        <td>
                          <span className="badge badge-green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {t.gradingActivity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: STUDENTS NEEDING ATTENTION ================= */}
          {activeTab === 'atrisk' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <ShieldAlert size={18} color="#f59e0b" />
                    <span>Students Needing Academic Attention</span>
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Constructive intervention signals based on assessment activity, pending assignments, and score trends.
                  </p>
                </div>
              </div>

              {data?.atRiskStudents?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <p>All active students are currently meeting target progress milestones!</p>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Program / Batch</th>
                        <th>Risk Classification</th>
                        <th>Explainable Signals</th>
                        <th>Suggested Advisor Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.atRiskStudents?.map((s: any) => (
                        <tr key={s.studentId}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{s.studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                          </td>
                          <td>
                            <div>{s.degree || 'B.Tech CS'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class of {s.graduationYear || 2026}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: s.riskLevel === 'Needs Attention' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: s.riskLevel === 'Needs Attention' ? '#f87171' : '#fbbf24',
                                border: s.riskLevel === 'Needs Attention' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              {s.riskLevel}
                            </span>
                          </td>
                          <td>
                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {(s.signals || []).map((sig: string, sigIdx: number) => (
                                <li key={sigIdx}>{sig}</li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 500 }}>
                              {s.suggestedActions?.[0] || 'Schedule 1-on-1 check-in'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 5: DEPARTMENT READINESS ================= */}
          {activeTab === 'skills' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Award size={18} color="#818cf8" />
                  <span>Institutional Skill Mastery & Placement Cohorts</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                    Top In-Demand Verified Skills
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>React & Next.js 15</span>
                      <strong style={{ color: '#34d399' }}>92% Mastery</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>TypeScript & Modern JS</span>
                      <strong style={{ color: '#34d399' }}>88% Mastery</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Cloud Architecture & AWS</span>
                      <strong style={{ color: '#60a5fa' }}>85% Mastery</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Python & Data Engineering</span>
                      <strong style={{ color: '#c084fc' }}>84% Mastery</strong>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                    Placement Readiness Tiers
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Tier 1 (High Readiness &gt;80%)</span>
                      <strong style={{ color: '#34d399' }}>65% of Cohort</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Tier 2 (Moderate 65-79%)</span>
                      <strong style={{ color: '#60a5fa' }}>25% of Cohort</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Tier 3 (Developing &lt;65%)</span>
                      <strong style={{ color: '#fbbf24' }}>10% of Cohort</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
