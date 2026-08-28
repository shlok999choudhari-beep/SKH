'use client'

import React from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import CampusResourcesSection from '@/components/CampusResourcesSection'
import BackButton from '@/components/BackButton'
import styles from '../dashboard.module.css'
import Link from 'next/link'
import {
  Landmark,
  ArrowRight,
  Presentation,
  BookOpen,
  CalendarDays,
  FolderLock
} from 'lucide-react'

export default function StudentCampusPage() {
  return (
    <div className={styles.layout}>
      <StudentSidebar />

      <div className={styles.content}>
        {/* ── STICKY PAGE HEADER ── */}
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/dashboard" />
            <div>
              <h1 className={styles.pageTitle}>Campus & Resources Hub</h1>
              <p className={styles.pageSubtitle}>
                One-stop access to industry trainers, campus spaces, study materials, bookings, and document vault.
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link
              href="/student/trainers"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Presentation size={14} />
              <span>Book Trainer</span>
            </Link>
            <Link
              href="/student/campus-resources"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Landmark size={14} />
              <span>Reserve Space</span>
            </Link>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className={styles.main}>
          <CampusResourcesSection showHeader={true} />
        </main>
      </div>
    </div>
  )
}
