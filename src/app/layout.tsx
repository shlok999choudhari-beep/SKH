import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'PLACEIQ — AI Smart Placement Gap Analyzer',
  description: 'Analyze your resume against job requirements, detect skill gaps, and get an AI-powered roadmap to land your dream job. Trusted by students and top companies.',
  keywords: 'AI placement, resume analysis, skill gap, career roadmap, job matching',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  )
}

