import React from 'react'
import TrainerSidebar from '@/components/TrainerSidebar'

export const metadata = {
  title: 'Trainer Portal — PlaceIQ LMS',
  description: 'Manage courses, modules, lessons, and track student learning progress.'
}

export default function TrainerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <TrainerSidebar />
      <div style={{ flex: 1, paddingTop: '84px', paddingBottom: '3rem' }}>
        {children}
      </div>
    </div>
  )
}
