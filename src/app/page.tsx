'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from './page.module.css'
import MaskedHeading from '@/components/MaskedHeading'
import BlurText from '@/components/BlurText'

const DriftWall = dynamic(() => import('@/components/DriftWall'), { ssr: false })
const CircularGallery = dynamic(() => import('@/components/CircularGallery'), { ssr: false })
const SideRays = dynamic(() => import('@/components/SideRays'), { ssr: false })


const DRIFT_ITEMS = [
  { icon: '📄', title: 'Resume Score', subtitle: '89/100 ATS Match', type: 'progress' as const, val: 89 },
  { icon: '🧠', title: 'Skill Gaps', subtitle: 'Next.js & Go missing', type: 'tags' as const, tags: ['Next.js', 'Go'] },
  { icon: '🎯', title: 'Job Matching', subtitle: '94% Google Match', type: 'match' as const, val: '94%' },
  { icon: '🗺️', title: 'AI Roadmap', subtitle: 'Week 1: System Design', type: 'step' as const, val: 'Active' },
  { icon: '🎤', title: 'Interview Sim', subtitle: 'Confidence: 87%', type: 'badge' as const, val: 'Ready' },
  { icon: '💻', title: 'Coding Judge', subtitle: 'LeetCode Sim 5/5 pass', type: 'code' as const, val: 'Accepted' },
  { icon: '📊', title: 'Skill Radar', subtitle: 'Frontend: 92%', type: 'progress' as const, val: 92 },
  { icon: '🌟', title: 'Dream Mode', subtitle: 'Google prep active', type: 'badge' as const, val: 'Tier 1' },
  { icon: '📂', title: 'Portfolio Scan', subtitle: 'GitHub: 12 projects', type: 'tags' as const, tags: ['GitHub', 'Projects'] },
]

export default function LandingPage() {
  const handleAnimationComplete = () => {
    console.log('Animation completed!')
  }

  return (
    <main className={styles.main}>
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
      {/* ── GLASSMORPHISM NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.logoText}>Place<span className="grad-text">IQ</span></span>
          </div>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how-it-works" className={styles.navLink}>How It Works</a>
            <a href="#showcase" className={styles.navLink}>Showcase</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/auth/login" className={`btn btn-sm ${styles.loginBtn}`}>
              Sign In →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className="badge badge-blue">🚀 AI-Powered Career Intelligence Platform</span>
        </div>

        <h1 className={styles.heroTitle}>
          <BlurText
            text="Close the Gap."
            delay={140}
            animateBy="words"
            direction="top"
            gradientText="linear-gradient(135deg, #EAB308, #96c8ff)"
            onAnimationComplete={handleAnimationComplete}
            style={{ display: 'block' }}
          />
          <BlurText
            text="Land Your Dream."
            delay={140}
            animateBy="words"
            direction="top"
            gradientText="linear-gradient(135deg, #EAB308, #96c8ff)"
            style={{ display: 'block' }}
          />
        </h1>

        <p className={styles.heroSubtitle}>
          <BlurText
            text="Upload your resume. AI analyzes skill gaps, matches top companies, generates your personalized 4-week roadmap, and simulates real interviews."
            delay={50}
            animateBy="words"
            direction="top"
          />
        </p>

        <div className={styles.heroCTA}>
          <Link href="/auth/login?role=student" className={`btn btn-student btn-lg`}>
            🎓 Start as Student — Free
          </Link>
          <Link href="/auth/login?role=company" className={`btn btn-company btn-lg`}>
            🏢 Hire Talent
          </Link>
          <Link href="/auth/login?role=institution" className={`btn btn-institution btn-lg`}>
            🏛️ Institution Portal
          </Link>
        </div>

        <div className={styles.heroStats}>
          {[
            { num: '50K+', label: 'Students Placed', color: 'var(--text-primary)' },
            { num: '2K+', label: 'Partner Companies', color: 'var(--accent-secondary)' },
            { num: '94%', label: 'Match Accuracy', color: 'var(--accent-primary)' },
            { num: '4 Weeks', label: 'Avg. Readiness', color: 'var(--accent-muted)' },
          ].map(s => (
            <div key={s.label} className={styles.heroStat}>
              <span className={styles.heroStatNum} style={{ color: s.color }}>{s.num}</span>
              <span className={styles.heroStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── DRIFT WALL SHOWCASE ── */}
      <section id="showcase" className={styles.driftSection}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-blue">✨ Platform Preview</span>
          <h2 className={styles.sectionTitle}>
            <BlurText
              text="Everything You Need to Get"
              delay={100}
              animateBy="words"
              direction="top"
            />{' '}
            <BlurText
              text="Placed"
              delay={100}
              animateBy="words"
              direction="top"
              gradientText="linear-gradient(135deg, #EAB308, #96c8ff)"
            />
          </h2>
          <p className={styles.sectionSub}>
            <BlurText
              text="20+ AI-powered tools built for students and recruiters"
              delay={80}
              animateBy="words"
              direction="top"
            />
          </p>
        </div>
        <div className={styles.driftWrap}>
          <DriftWall
            items={DRIFT_ITEMS}
            columns={5}
            tileWidth={200}
            tileHeight={132}
            gap={18}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#060010"
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-purple">⚡ Core Features</span>
          <h2 className={styles.sectionTitle}>
            <BlurText
              text="From Resume to"
              delay={100}
              animateBy="words"
              direction="top"
            />{' '}
            <BlurText
              text="Offer Letter"
              delay={100}
              animateBy="words"
              direction="top"
              gradientText="linear-gradient(135deg, #EAB308, #96c8ff)"
            />
          </h2>
          <p className={styles.sectionSub}>
            <BlurText
              text="20+ AI-powered tools built for students and recruiters"
              delay={80}
              animateBy="words"
              direction="top"
            />
          </p>
        </div>
        <div style={{ height: '600px', position: 'relative', marginTop: '40px' }}>
          <CircularGallery
            items={FEATURES}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollEase={0.02}
            fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
            font="bold 30px Orbitron"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-blue">⚡ Simple Process</span>
          <h2 className={styles.sectionTitle}>
            4 Steps to Your <MaskedHeading text="Dream Job" style={{ fontSize: 'inherit', fontWeight: 'inherit' }} />
          </h2>
        </div>
        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <div key={s.title} className={styles.stepCard}>
              <div className={styles.stepNum} style={{ background: s.grad }}>{i + 1}</div>
              <div className={styles.stepIcon}>{s.icon}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOR COMPANIES ── */}
      <section className={styles.section}>
        <div className={`glass ${styles.companyBanner}`}>
          <div className={styles.companyBannerText}>
            <span className="badge badge-green">🏢 For Recruiters</span>
            <h2>Find Pre-Screened, Skill-Verified Talent</h2>
            <p>Post jobs, access AI-matched candidates, view skill radar charts, and shortlist in minutes — not weeks.</p>
            <Link href="/auth/login?role=company" className="btn btn-company btn-lg">Start Hiring Now →</Link>
          </div>
          <div className={styles.companyBannerStats}>
            {[['🎯', '95%', 'Qualified matches'], ['⚡', '3x', 'Faster hiring'], ['💡', '40%', 'Cost reduction']].map(([icon, num, label]) => (
              <div key={String(label)} className={styles.companyStatItem}>
                <span className={styles.cmpIcon}>{icon}</span>
                <span className={`${styles.cmpNum} grad-text`}>{num}</span>
                <span className={styles.cmpLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.logoText}>Place<span className="grad-text">IQ</span></span>
          </div>
          <p className={styles.footerTagline}>AI-powered placement intelligence • Built for the future of hiring</p>
          <p className={styles.footerCopy}>© 2026 PLACEIQ. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

const FEATURES = [
  { icon: '📄', title: 'Resume Upload & ATS Score', desc: 'Upload PDF resumes. Get ATS compatibility score like real companies run it.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#ffffff,#cbd5e1)' },
  { icon: '🧠', title: 'Semantic Skill Extraction', desc: 'AI reads between the lines and extracts hard + soft skills intelligently.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#cbd5e1,#94a3b8)' },
  { icon: '🎯', title: 'Company Match Score', desc: 'Vector similarity matching against real company requirement profiles.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  { icon: '🔍', title: 'Skill Gap Detection', desc: 'Pinpoint exact missing skills — both technical and soft skills breakdown.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#ffffff,#94a3b8)' },
  { icon: '🗺️', title: 'AI 4-Week Roadmap', desc: 'Personalized day-by-day learning plan to close your skill gaps fast.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)' },
  { icon: '🎤', title: 'Live Interview Simulator', desc: 'Voice & chat AI for mock interviews. Get confidence scores instantly.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#cbd5e1,#475569)' },
  { icon: '💻', title: 'DSA Coding Judge', desc: 'Real-time coding round evaluator with test cases — like LeetCode meets AI.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#e2e8f0,#94a3b8)' },
  { icon: '📊', title: 'Skill Radar Chart', desc: 'Beautiful visual radar showing your strengths across all domains.', tag: 'Visual', badge: 'badge-green', gradient: 'linear-gradient(135deg,#ffffff,#cbd5e1)' },
  { icon: '🌟', title: 'Dream Company Mode', desc: 'Google, Amazon, Microsoft prep with company-specific question banks.', tag: 'Premium', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#cbd5e1,#94a3b8)' },
  { icon: '📈', title: 'Progress Tracker', desc: 'Track your before vs after improvement with timeline analytics.', tag: 'Visual', badge: 'badge-green', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  { icon: '🤖', title: 'AI Mentor Chatbot', desc: '24/7 career guidance chatbot trained on placement best practices.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#cbd5e1,#475569)' },
  { icon: '📂', title: 'Portfolio Analyzer', desc: 'Analyze GitHub, projects, and portfolio for depth and confidence scoring.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#ffffff,#94a3b8)' },
]

const STEPS = [
  { icon: '📤', title: 'Upload Resume', desc: 'Upload your PDF resume or LinkedIn profile. Takes under 30 seconds.', grad: 'linear-gradient(135deg,#ffffff,#cbd5e1)' },
  { icon: '⚡', title: 'AI Analysis', desc: 'Our AI extracts skills, scores ATS compatibility, and maps gaps instantly.', grad: 'linear-gradient(135deg,#cbd5e1,#94a3b8)' },
  { icon: '🎯', title: 'Get Your Roadmap', desc: 'Receive a personalized 4-week prep plan with resources & mock interviews.', grad: 'linear-gradient(135deg,#94a3b8,#64748b)' },
  { icon: '🚀', title: 'Land the Job', desc: 'Apply to matched companies with confidence. Track applications in real-time.', grad: 'linear-gradient(135deg,#64748b,#475569)' },
]
