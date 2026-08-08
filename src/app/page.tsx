import Link from 'next/link'
import styles from './page.module.css'

export default function LandingPage() {
  return (
    <main className={styles.main}>
      {/* ── Orbs ── */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.logoText}>De<span className="grad-text">mo</span></span>
          </div>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how-it-works" className={styles.navLink}>How It Works</a>
            <a href="#for-companies" className={styles.navLink}>For Companies</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/auth/student/login" className="btn btn-ghost btn-sm">Student Login</Link>
            <Link href="/auth/company/login" className="btn btn-company btn-sm">Company Login</Link>
            <Link href="/institution/dashboard" className="btn btn-sm" style={{background: 'var(--grad-purple)', color: 'white', border: 'none'}}>Institution Admin</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className="badge badge-purple">🚀 AI-Powered Career Intelligence</span>
        </div>
        <h1 className={styles.heroTitle}>
          Close the Gap Between<br />
          <span className="grad-text">You and Your Dream Job</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Upload your resume and let AI analyze your skill gaps, match you with top companies,
          generate a personalized 4-week roadmap, and simulate real interviews — all in one platform.
        </p>

        <div className={styles.heroCTA}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaIcon}>🎓</div>
            <h3>I&apos;m a Student</h3>
            <p>Analyze your resume, find skill gaps, and get placed faster</p>
            <div className={styles.ctaBtns}>
              <Link href="/auth/student/signup" className="btn btn-student btn-lg">Get Started Free</Link>
              <Link href="/auth/student/login" className="btn btn-secondary btn-sm">Already have account?</Link>
            </div>
          </div>

          <div className={styles.ctaDivider}>
            <span>or</span>
          </div>

          <div className={`${styles.ctaCard} ${styles.ctaCardCompany}`}>
            <div className={styles.ctaIcon}>🏢</div>
            <h3>I&apos;m a Company</h3>
            <p>Post jobs, discover top talent, and find the perfect fit</p>
            <div className={styles.ctaBtns}>
              <Link href="/auth/company/signup" className="btn btn-company btn-lg">Post a Job</Link>
              <Link href="/auth/company/login" className="btn btn-secondary btn-sm">Already registered?</Link>
            </div>
          </div>
        </div>

        <div className={styles.heroStats}>
          {[
            { num: '50K+', label: 'Students Placed', color: 'var(--accent-violet)' },
            { num: '2K+', label: 'Partner Companies', color: 'var(--accent-green)' },
            { num: '94%', label: 'Match Accuracy', color: 'var(--accent-blue)' },
            { num: '4 Weeks', label: 'Avg. Readiness', color: 'var(--accent-orange)' },
          ].map(s => (
            <div key={s.label} className={styles.heroStat}>
              <span className={styles.heroStatNum} style={{ color: s.color }}>{s.num}</span>
              <span className={styles.heroStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-purple">✨ Platform Features</span>
          <h2 className={styles.sectionTitle}>Everything You Need to Get <span className="grad-text">Placed</span></h2>
          <p className={styles.sectionSub}>20+ AI-powered tools built for students and recruiters</p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={`glass ${styles.featureCard}`}>
              <div className={styles.featureIcon} style={{ background: f.gradient }}>{f.icon}</div>
              <h4 className={styles.featureTitle}>{f.title}</h4>
              <p className={styles.featureDesc}>{f.desc}</p>
              <span className={`badge ${f.badge}`}>{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className="badge badge-blue">⚡ Simple Process</span>
          <h2 className={styles.sectionTitle}>From Resume to <span className="grad-text">Offer Letter</span> in 4 Steps</h2>
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
      <section id="for-companies" className={styles.section}>
        <div className={`glass ${styles.companyBanner}`}>
          <div className={styles.companyBannerText}>
            <span className="badge badge-green">🏢 For Recruiters</span>
            <h2>Find Pre-Screened, Skill-Verified Talent</h2>
            <p>Post jobs, access AI-matched candidates, view skill radar charts, and shortlist in minutes — not weeks.</p>
            <Link href="/auth/company/signup" className="btn btn-company btn-lg">Start Hiring Now →</Link>
          </div>
          <div className={styles.companyBannerStats}>
            {[['🎯', '95%', 'Qualified matches'], ['⚡', '3x', 'Faster hiring'], ['💡', '40%', 'Cost reduction']].map(([icon, num, label]) => (
              <div key={label} className={styles.companyStatItem}>
                <span className={styles.cmpIcon}>{icon}</span>
                <span className={`${styles.cmpNum} grad-text-green`}>{num}</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.logoText}>De<span className="grad-text">mo</span></span>
          </div>
          <p className={styles.footerTagline}>AI-powered placement intelligence • Built for the future of hiring</p>
          <p className={styles.footerCopy}>© 2026 Demo. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

const FEATURES = [
  { icon: '📄', title: 'Resume Upload & ATS Score', desc: 'Upload PDF resumes. Get ATS compatibility score like real companies run it.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { icon: '🧠', title: 'Semantic Skill Extraction', desc: 'AI reads between the lines and extracts hard + soft skills intelligently.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { icon: '🎯', title: 'Company Match Score', desc: 'Vector similarity matching against real company requirement profiles.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
  { icon: '🔍', title: 'Skill Gap Detection', desc: 'Pinpoint exact missing skills — both technical and soft skills breakdown.', tag: 'Core', badge: 'badge-purple', gradient: 'linear-gradient(135deg,#ef4444,#f59e0b)' },
  { icon: '🗺️', title: 'AI 4-Week Roadmap', desc: 'Personalized day-by-day learning plan to close your skill gaps fast.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
  { icon: '🎤', title: 'Live Interview Simulator', desc: 'Voice & chat AI for mock interviews. Get confidence scores instantly.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { icon: '💻', title: 'DSA Coding Judge', desc: 'Real-time coding round evaluator with test cases — like LeetCode meets AI.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { icon: '📊', title: 'Skill Radar Chart', desc: 'Beautiful visual radar showing your strengths across all domains.', tag: 'Visual', badge: 'badge-green', gradient: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  { icon: '🌟', title: 'Dream Company Mode', desc: 'Google, Amazon, Microsoft prep with company-specific question banks.', tag: 'Premium', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#f59e0b,#8b5cf6)' },
  { icon: '📈', title: 'Progress Tracker', desc: 'Track your before vs after improvement with timeline analytics.', tag: 'Visual', badge: 'badge-green', gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { icon: '🤖', title: 'AI Mentor Chatbot', desc: '24/7 career guidance chatbot trained on placement best practices.', tag: 'AI', badge: 'badge-blue', gradient: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
  { icon: '📂', title: 'Portfolio Analyzer', desc: 'Analyze GitHub, projects, and portfolio for depth and confidence scoring.', tag: 'Advanced', badge: 'badge-orange', gradient: 'linear-gradient(135deg,#3b82f6,#10b981)' },
]

const STEPS = [
  { icon: '📤', title: 'Upload Resume', desc: 'Upload your PDF resume or LinkedIn profile. Takes under 30 seconds.', grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { icon: '⚡', title: 'AI Analysis', desc: 'Our AI extracts skills, scores ATS compatibility, and maps gaps instantly.', grad: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { icon: '🎯', title: 'Get Your Roadmap', desc: 'Receive a personalized 4-week prep plan with resources & mock interviews.', grad: 'linear-gradient(135deg,#10b981,#3b82f6)' },
  { icon: '🚀', title: 'Land the Job', desc: 'Apply to matched companies with confidence. Track applications in real-time.', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
]
