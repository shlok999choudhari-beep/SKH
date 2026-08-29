'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import CourseWorkspace from '@/components/CourseWorkspace'

export default function TrainerCourseWorkspacePage() {
  const params = useParams()
  const courseId = params?.id ? parseInt(params.id as string, 10) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '2rem 1.5rem 5rem' }}>
      <CourseWorkspace courseId={courseId} role="trainer" />
    </div>
  )
}
