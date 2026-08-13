import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import SideRays from '@/components/SideRays'

export const metadata: Metadata = {
  title: 'PLACEIQ — AI Smart Placement Gap Analyzer',
  description: 'Analyze your resume against job requirements, detect skill gaps, and get an AI-powered roadmap to land your dream job. Trusted by students and top companies.',
  keywords: 'AI placement, resume analysis, skill gap, career roadmap, job matching',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <SideRays
              speed={2.5}
              rayColor1="#ffffff"
              rayColor2="#cbd5e1"
              intensity={0.8}
              spread={2}
              origin="top-right"
              tilt={0}
              saturation={1.5}
              blend={0.75}
              falloff={1.6}
              opacity={0.15}
            />
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  )
}

