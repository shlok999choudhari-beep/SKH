'use client'
import { useState } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import dashboardStyles from '../dashboard.module.css'
import styles from './resources.module.css'
import {
  BookOpen,
  Search,
  Loader2,
  Video,
  Play,
  BookMarked,
  FileText,
  ArrowRight,
  Users,
  MessageSquare,
  Bot,
  GraduationCap,
  Globe,
  Languages,
  Film,
  Sparkles,
  Layers,
  Zap,
  ExternalLink,
  Tv,
  X,
  Compass,
  CheckCircle2,
  Flame,
  Book,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react'

const REGIONS = [
  { code: 'us', label: 'Global / US', flag: '🌐' },
  { code: 'in', label: 'India', flag: '🇮🇳' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' },
  { code: 'de', label: 'Germany', flag: '🇩🇪' },
  { code: 'sg', label: 'Singapore', flag: '🇸🇬' }
]

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ja', label: 'Japanese', native: '日本語' }
]

const MAIN_CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: Layers },
  { id: 'docs', label: 'Documentation & Notes', icon: BookMarked },
  { id: 'videos', label: 'Videos & Playlists', icon: Video },
  { id: 'communities', label: 'Communities & Groups', icon: Users }
]

const LEARNING_DOMAINS = [
  { id: 'all', label: 'All Learning Scope' },
  { id: 'academic', label: 'Academic (Math, Physics, CS)' },
  { id: 'technical', label: 'Technical Skills (Code, AI, Web)' },
  { id: 'languages', label: 'Languages (English, Hindi, Marathi)' },
  { id: 'career', label: 'Career Prep (Interview, Resume)' },
  { id: 'soft_skills', label: 'Soft Skills (Communication)' },
  { id: 'personal_dev', label: 'Personal Development (Motivation)' },
  { id: 'research', label: 'Research & Projects' }
]

const DIFFICULTY_LEVELS = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' }
]

const ALLOWED_QUICK_SUGGESTIONS = [
  { name: 'Explain recursion in C++', category: 'Technical Skills', color: '#61dafb' },
  { name: 'Learn English grammar', category: 'Languages', color: '#34d399' },
  { name: 'Hindi vocabulary', category: 'Languages', color: '#fbbf24' },
  { name: 'Python programming tutorial', category: 'Technical Skills', color: '#3776ab' },
  { name: 'How to prepare for interviews', category: 'Career', color: '#8b5cf6' },
  { name: 'How to improve communication', category: 'Soft Skills', color: '#ec4899' },
  { name: 'Study motivation', category: 'Personal Development', color: '#f59e0b' },
  { name: 'Machine learning project ideas', category: 'Research', color: '#06b6d4' },
  { name: 'Data Structures & Algorithms', category: 'Technical Skills', color: '#a855f7' }
]

const VIDEO_FORMATS = [
  { id: 'all', label: 'All Formats' },
  { id: 'playlist', label: 'Full Playlists & Courses' },
  { id: 'short', label: 'Short Crash Course (< 30 min)' },
  { id: 'course', label: 'Bootcamp & Masterclass' }
]

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return ''
  const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (videoMatch && videoMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${videoMatch[1]}?autoplay=1`
  }
  const listMatch = url.match(/[?&]list=([^"&?\/\s]+)/)
  if (listMatch && listMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${listMatch[1]}&autoplay=1`
  }
  return ''
}

export default function LearningResources() {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('us')
  const [language, setLanguage] = useState('en')
  const [contentType, setContentType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'docs' | 'videos' | 'communities'>('all')
  const [docSubType, setDocSubType] = useState<'all' | 'ai_notes' | 'official_docs' | 'book' | 'notes'>('all')
  const [searching, setSearching] = useState(false)
  const [resources, setResources] = useState<any>(null)
  const [activeFilters, setActiveFilters] = useState<any>(null)

  // Show more / less state for docs
  const [showAllDocs, setShowAllDocs] = useState(false)

  // AI Notes State
  const [aiNotes, setAiNotes] = useState<string | null>(null)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [copiedNotes, setCopiedNotes] = useState(false)

  // Video Modal State
  const [activePlayingVideo, setActivePlayingVideo] = useState<{ title: string; link: string; channel?: string } | null>(null)

  // Scope Guard State
  const [scopeBlocked, setScopeBlocked] = useState(false)
  const [scopeBlockedMessage, setScopeBlockedMessage] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const executeSearch = async (
    searchQuery: string,
    customRegion = region,
    customLang = language,
    customType = contentType,
    categoryToFocus = selectedCategory
  ) => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setAiNotes(null)
    setShowAllDocs(false)
    setScopeBlocked(false)
    setScopeBlockedMessage('')

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          region: customRegion,
          language: customLang,
          type: customType
        })
      })

      const data = await res.json()

      if (data.blocked) {
        setScopeBlocked(true)
        setScopeBlockedMessage(data.message || data.error || "This search is outside PlaceIQ's learning scope. Try searching for academic topics, skills, languages, career preparation, or personal development.")
        setResources(null)
      } else if (data.success) {
        setScopeBlocked(false)
        setResources(data.resources)
        setActiveFilters(data.filtersApplied || { query: searchQuery, region: customRegion, language: customLang, type: customType })
        if (categoryToFocus) {
          setSelectedCategory(categoryToFocus)
        }
      } else {
        alert(data.error || 'Search failed')
      }
    } catch (error) {
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleGenerateAiNotes = async (topicToNote?: string) => {
    const targetTopic = topicToNote || activeFilters?.query || query
    if (!targetTopic.trim()) return

    setGeneratingNotes(true)
    try {
      const res = await fetch('/api/resources/ai-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: targetTopic.trim(),
          language
        })
      })
      const data = await res.json()
      if (data.success && data.notes) {
        setAiNotes(data.notes)
      }
    } catch (err) {
      console.error('Error generating AI notes:', err)
    } finally {
      setGeneratingNotes(false)
    }
  }

  const handleCopyNotes = () => {
    if (!aiNotes) return
    navigator.clipboard.writeText(aiNotes)
    setCopiedNotes(true)
    setTimeout(() => setCopiedNotes(false), 2000)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch(query)
  }

  const popularTopics = [
    { name: 'React', color: '#61dafb' },
    { name: 'Node.js', color: '#68a063' },
    { name: 'Python', color: '#3776ab' },
    { name: 'JavaScript', color: '#f7df1e' },
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'Docker', color: '#2496ed' },
    { name: 'AWS', color: '#ff9900' },
    { name: 'MongoDB', color: '#47a248' },
    { name: 'Data Structures & Algorithms', color: '#ec4899' },
    { name: 'Next.js', color: '#8b5cf6' }
  ]

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '')
    } catch {
      return urlStr || 'web'
    }
  }

  const getCommunityMeta = (link: string, title: string) => {
    const l = (link || '').toLowerCase()
    const t = (title || '').toLowerCase()
    if (l.includes('discord') || t.includes('discord')) {
      return { platform: 'Discord', color: '#5865F2', icon: <MessageSquare size={18} color="white" /> }
    }
    if (l.includes('reddit') || t.includes('reddit')) {
      return { platform: 'Reddit', color: '#FF4500', icon: <Bot size={18} color="white" /> }
    }
    if (l.includes('telegram') || t.includes('telegram')) {
      return { platform: 'Telegram', color: '#229ED9', icon: <MessageSquare size={18} color="white" /> }
    }
    if (l.includes('dev.to') || t.includes('dev.to')) {
      return { platform: 'DEV Community', color: '#8b5cf6', icon: <Users size={18} color="white" /> }
    }
    return { platform: 'Developer Forum', color: '#10b981', icon: <Users size={18} color="white" /> }
  }

  const currentRegionLabel = REGIONS.find(r => r.code === region)?.label || 'Global'
  const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || 'English'

  const spotlightVideo = resources?.videos?.[0]
  const remainingVideos = resources?.videos?.slice(1) || []

  // Documentation Filtering
  const allDocumentation = resources?.documentation || []
  const filteredDocumentation = allDocumentation.filter((item: any) => {
    if (docSubType === 'all') return true
    if (docSubType === 'official_docs') return item.docType === 'official_docs' || !item.docType
    if (docSubType === 'book') return item.docType === 'book'
    if (docSubType === 'notes') return item.docType === 'notes'
    return true
  })

  // Limit display based on Show More / Less
  const displayedDocs = showAllDocs ? filteredDocumentation : filteredDocumentation.slice(0, 6)

  return (
    <div className={dashboardStyles.layout}>
      <StudentSidebar />
      <div className={dashboardStyles.content}>
        <header className={dashboardStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton fallbackHref="/student/campus" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} strokeWidth={2} color="#8b5cf6" />
                </div>
                <h1 className={dashboardStyles.pageTitle}>Learning Resources</h1>
              </div>
              <p className={dashboardStyles.pageSubtitle}>
                Interactive video courses, official API documentation, AI smart notes, online books & developer communities.
              </p>
            </div>
          </div>
        </header>

        <main className={dashboardStyles.main}>
          <div className={styles.container}>

            {/* UNIFIED HERO COMMAND BAR WITH CATEGORY SELECTOR */}
            <div className={styles.searchHero}>
              <div className={styles.searchHeroGlow} />

              {/* 1. UPFRONT CATEGORY SELECTOR */}
              <div className={styles.categoryTabsRow}>
                {MAIN_CATEGORIES.map((cat) => {
                  const IconComp = cat.icon
                  const isActive = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id as any)
                      }}
                      className={`${styles.categoryTabBtn} ${isActive ? styles.categoryTabBtnActive : ''}`}
                    >
                      <IconComp size={16} strokeWidth={2} />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              <form onSubmit={handleSearch}>
                {/* Search Input Box */}
                <div className={styles.inputWrapper}>
                  <Search size={22} strokeWidth={2} color="#94a3b8" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      selectedCategory === 'docs'
                        ? 'Search for documentation, notes, books, cheat sheets (e.g. Recursion in C++, Python, Math)...'
                        : selectedCategory === 'videos'
                        ? 'Search for video tutorials, playlists, crash courses (e.g. DSA, Web Dev, English Grammar)...'
                        : selectedCategory === 'communities'
                        ? 'Search for study groups, developer forums, peer learning hubs...'
                        : 'Search learning resources (e.g. Python recursion, English grammar, study motivation)...'
                    }
                    className={styles.mainInput}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        setScopeBlocked(false)
                      }}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={searching || !query.trim()}
                    className={styles.searchSubmitBtn}
                  >
                    {searching ? (
                      <>
                        <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search size={16} strokeWidth={2} />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preference & Educational Scope Controls Bar */}
                <div className={styles.preferencesBar}>
                  <div className={styles.filterGroup}>
                    {/* Educational Scope Domain Select */}
                    <div className={styles.filterPill}>
                      <GraduationCap size={14} strokeWidth={2} color="#c084fc" />
                      <label htmlFor="domain-picker" style={{ color: '#94a3b8', fontSize: '12px' }}>Domain:</label>
                      <select
                        id="domain-picker"
                        value={selectedDomain}
                        onChange={(e) => {
                          setSelectedDomain(e.target.value)
                        }}
                        className={styles.filterSelect}
                      >
                        {LEARNING_DOMAINS.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Difficulty Level Select */}
                    <div className={styles.filterPill}>
                      <Zap size={14} strokeWidth={2} color="#fbbf24" />
                      <label htmlFor="level-picker" style={{ color: '#94a3b8', fontSize: '12px' }}>Level:</label>
                      <select
                        id="level-picker"
                        value={selectedLevel}
                        onChange={(e) => {
                          setSelectedLevel(e.target.value)
                        }}
                        className={styles.filterSelect}
                      >
                        {DIFFICULTY_LEVELS.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Region Select */}
                    <div className={styles.filterPill}>
                      <Globe size={14} strokeWidth={2} color="#38bdf8" />
                      <label htmlFor="region-picker" style={{ color: '#94a3b8', fontSize: '12px' }}>Region:</label>
                      <select
                        id="region-picker"
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value)
                          if (query.trim() && resources) {
                            executeSearch(query, e.target.value, language, contentType)
                          }
                        }}
                        className={styles.filterSelect}
                      >
                        {REGIONS.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.flag} {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Language Select */}
                    <div className={styles.filterPill}>
                      <Languages size={14} strokeWidth={2} color="#34d399" />
                      <label htmlFor="language-picker" style={{ color: '#94a3b8', fontSize: '12px' }}>Language:</label>
                      <select
                        id="language-picker"
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value)
                          if (query.trim() && resources) {
                            executeSearch(query, region, e.target.value, contentType)
                          }
                        }}
                        className={styles.filterSelect}
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label} ({l.native})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Video Format Modifier */}
                    {(selectedCategory === 'videos' || selectedCategory === 'all') && (
                      <div className={styles.filterPill}>
                        <Film size={14} strokeWidth={2} color="#fbbf24" />
                        <label htmlFor="format-picker" style={{ color: '#94a3b8', fontSize: '12px' }}>Video Format:</label>
                        <select
                          id="format-picker"
                          value={contentType}
                          onChange={(e) => {
                            setContentType(e.target.value)
                            if (query.trim() && resources) {
                              executeSearch(query, region, language, e.target.value)
                            }
                          }}
                          className={styles.filterSelect}
                        >
                          {VIDEO_FORMATS.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </form>

              {/* Scope Guard Blocked Notice */}
              {scopeBlocked && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <GraduationCap size={20} color="#fca5a5" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fca5a5', fontSize: '0.95rem' }}>
                        Learning Scope Notice
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                        {scopeBlockedMessage}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Try searching one of these learning topics:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ALLOWED_QUICK_SUGGESTIONS.slice(0, 6).map((sug) => (
                        <button
                          key={sug.name}
                          type="button"
                          onClick={() => {
                            setQuery(sug.name)
                            executeSearch(sug.name, region, language, contentType)
                          }}
                          className={styles.topicChip}
                          style={{
                            background: `${sug.color}15`,
                            borderColor: `${sug.color}35`,
                            color: sug.color
                          }}
                        >
                          <Sparkles size={11} strokeWidth={2} />
                          <span>{sug.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Topic Badges when Idle */}
              {!resources && !scopeBlocked && (
                <div className={styles.topicChipsRow}>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 500, marginRight: '4px' }}>
                    Suggested learning topics:
                  </span>
                  {ALLOWED_QUICK_SUGGESTIONS.map((topic) => (
                    <button
                      key={topic.name}
                      type="button"
                      onClick={() => {
                        setQuery(topic.name)
                        executeSearch(topic.name, region, language, contentType)
                      }}
                      className={styles.topicChip}
                      style={{
                        background: `${topic.color}15`,
                        borderColor: `${topic.color}35`,
                        color: topic.color
                      }}
                    >
                      <Sparkles size={11} strokeWidth={2} />
                      <span>{topic.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RESULTS VIEW */}
            {resources && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {/* Sub-Navigation Bar with Badges */}
                <div className={styles.resultsHeaderBar}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Results for</span>
                    <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', fontWeight: 700, fontSize: '13px' }}>
                      "{activeFilters?.query || query}"
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={11} strokeWidth={2} />
                      <span>{currentRegionLabel}</span>
                    </span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Languages size={11} strokeWidth={2} />
                      <span>{currentLangLabel}</span>
                    </span>
                  </div>

                  {/* Section View Tabs with Instant Filter */}
                  <div className={styles.sectionTabs}>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`${styles.sectionTab} ${selectedCategory === 'all' ? styles.sectionTabActive : ''}`}
                    >
                      <Layers size={13} strokeWidth={2} />
                      <span>All</span>
                    </button>
                    <button
                      onClick={() => setSelectedCategory('docs')}
                      className={`${styles.sectionTab} ${selectedCategory === 'docs' ? styles.sectionTabActive : ''}`}
                    >
                      <BookMarked size={13} strokeWidth={2} />
                      <span>Documentation & Notes ({allDocumentation.length})</span>
                    </button>
                    <button
                      onClick={() => setSelectedCategory('videos')}
                      className={`${styles.sectionTab} ${selectedCategory === 'videos' ? styles.sectionTabActive : ''}`}
                    >
                      <Video size={13} strokeWidth={2} />
                      <span>Videos ({resources.videos?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => setSelectedCategory('communities')}
                      className={`${styles.sectionTab} ${selectedCategory === 'communities' ? styles.sectionTabActive : ''}`}
                    >
                      <Users size={13} strokeWidth={2} />
                      <span>Communities ({resources.communities?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* 1. DOCUMENTATION & SMART NOTES SECTION (WITH VARIETY FILTERS & SHOW MORE/LESS) */}
                {(selectedCategory === 'all' || selectedCategory === 'docs') && (
                  <div className={styles.sectionCard}>
                    {/* Header */}
                    <div className={styles.sectionHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.sectionIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                          <BookMarked size={20} strokeWidth={2} color="#3b82f6" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            Documentation, Notes & Books
                          </h2>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Official API guides, instant AI revision notes, free online books & cheat sheets
                          </span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', fontSize: '12px', fontWeight: 600 }}>
                        {filteredDocumentation.length} resources
                      </span>
                    </div>

                    {/* DOCUMENTATION VARIETY SUB-FILTERS */}
                    <div className={styles.docSubFilterRow}>
                      <button
                        type="button"
                        onClick={() => {
                          setDocSubType('all')
                        }}
                        className={`${styles.docSubFilterBtn} ${docSubType === 'all' ? styles.docSubFilterBtnActive : ''}`}
                      >
                        <Layers size={13} />
                        <span>All ({allDocumentation.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDocSubType('ai_notes')
                          if (!aiNotes && !generatingNotes) {
                            handleGenerateAiNotes()
                          }
                        }}
                        className={`${styles.docSubFilterBtn} ${docSubType === 'ai_notes' ? styles.docSubFilterBtnAiActive : ''}`}
                      >
                        <Sparkles size={13} color="#c084fc" />
                        <span>AI Smart Notes & Summary</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocSubType('official_docs')}
                        className={`${styles.docSubFilterBtn} ${docSubType === 'official_docs' ? styles.docSubFilterBtnActive : ''}`}
                      >
                        <FileCode size={13} color="#38bdf8" />
                        <span>Official Docs ({allDocumentation.filter((d: any) => d.docType === 'official_docs').length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocSubType('book')}
                        className={`${styles.docSubFilterBtn} ${docSubType === 'book' ? styles.docSubFilterBtnActive : ''}`}
                      >
                        <Book size={13} color="#fbbf24" />
                        <span>Online Books ({allDocumentation.filter((d: any) => d.docType === 'book').length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocSubType('notes')}
                        className={`${styles.docSubFilterBtn} ${docSubType === 'notes' ? styles.docSubFilterBtnActive : ''}`}
                      >
                        <FileText size={13} color="#f472b6" />
                        <span>Revision Notes & Cheat Sheets ({allDocumentation.filter((d: any) => d.docType === 'notes').length})</span>
                      </button>
                    </div>

                    {/* AI SMART NOTES VIEWER */}
                    {docSubType === 'ai_notes' && (
                      <div className={styles.aiNotesCard}>
                        <div className={styles.aiNotesHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#c084fc" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                              AI-Generated Revision Notes & Study Guide: {activeFilters?.query || query}
                            </h3>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={handleCopyNotes}
                              disabled={!aiNotes || generatingNotes}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#e2e8f0',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {copiedNotes ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                              <span>{copiedNotes ? 'Copied!' : 'Copy Notes'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGenerateAiNotes()}
                              disabled={generatingNotes}
                              style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <RefreshCw size={13} className={generatingNotes ? 'spin' : ''} />
                              <span>{generatingNotes ? 'Generating...' : 'Regenerate'}</span>
                            </button>
                          </div>
                        </div>

                        {generatingNotes ? (
                          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <MorphingInfinity className="size-16" style={{ width: '64px', height: '64px', color: '#c084fc' }} />
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#f1f5f9' }}>Groq AI is synthesizing quick revision notes and basic examples...</p>
                          </div>
                        ) : aiNotes ? (
                          <div className={styles.aiNotesContent} style={{ whiteSpace: 'pre-wrap' }}>
                            {aiNotes}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <button
                              type="button"
                              onClick={() => handleGenerateAiNotes()}
                              className={styles.searchSubmitBtn}
                              style={{ margin: '0 auto' }}
                            >
                              <Sparkles size={16} />
                              <span>Generate AI Notes for {activeFilters?.query || query}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DOCUMENTATION CARDS GRID */}
                    {docSubType !== 'ai_notes' && (
                      <>
                        <div className={styles.docsGrid}>
                          {displayedDocs.map((doc: any, i: number) => {
                            const isBook = doc.docType === 'book'
                            const isNotes = doc.docType === 'notes'

                            return (
                              <a
                                key={i}
                                href={doc.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.docCard}
                                style={{
                                  borderColor: isBook ? 'rgba(245, 158, 11, 0.25)' : isNotes ? 'rgba(236, 72, 153, 0.25)' : 'rgba(59, 130, 246, 0.25)'
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        background: isBook ? 'rgba(245, 158, 11, 0.15)' : isNotes ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                        color: isBook ? '#fbbf24' : isNotes ? '#f472b6' : '#60a5fa',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}>
                                        {isBook ? '📚 Online Book' : isNotes ? '📝 Revision Notes' : '💻 Official Docs'}
                                      </span>
                                    </div>
                                    <ExternalLink size={13} strokeWidth={2} color="#94a3b8" />
                                  </div>

                                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                    {doc.title}
                                  </h3>

                                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {doc.snippet}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    {getHostname(doc.link)}
                                  </span>
                                  <span style={{ fontSize: '12px', color: isBook ? '#fbbf24' : isNotes ? '#f472b6' : '#60a5fa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{isBook ? 'Read Free Book' : isNotes ? 'View Notes' : 'Open Documentation'}</span>
                                    <ArrowRight size={13} strokeWidth={2} />
                                  </span>
                                </div>
                              </a>
                            )
                          })}
                        </div>

                        {/* SHOW MORE / SHOW LESS BUTTON */}
                        {filteredDocumentation.length > 6 && (
                          <div className={styles.showMoreRow}>
                            <button
                              type="button"
                              onClick={() => setShowAllDocs(!showAllDocs)}
                              className={styles.showMoreBtn}
                            >
                              <span>{showAllDocs ? 'Show Less' : `Show More (${filteredDocumentation.length - 6} more resources)`}</span>
                              {showAllDocs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 2. VIDEOS & COMPLETE PLAYLISTS */}
                {(selectedCategory === 'all' || selectedCategory === 'videos') && resources.videos && resources.videos.length > 0 && (
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.sectionIconWrapper} style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                          <Video size={20} strokeWidth={2} color="#ef4444" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            Video Courses & Interactive Playlists
                          </h2>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Full structured playlists, hands-on masterclasses, and quick crash courses
                          </span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>
                        {resources.videos.length} video courses
                      </span>
                    </div>

                    <div className={styles.videoSectionContainer}>
                      {/* SPOTLIGHT HERO VIDEO (TOP RECOMMENDED COURSE) */}
                      {spotlightVideo && (
                        <div className={styles.videoSpotlightCard}>
                          {/* Thumbnail with Play Overlay */}
                          <div
                            className={styles.spotlightThumbContainer}
                            onClick={() => setActivePlayingVideo(spotlightVideo)}
                          >
                            <img
                              src={spotlightVideo.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80'}
                              alt={spotlightVideo.title}
                              className={styles.spotlightThumbImg}
                            />
                            <div className={styles.videoPlayOverlay}>
                              <div className={styles.playCircle}>
                                <Play size={20} fill="white" color="white" style={{ marginLeft: '3px' }} />
                              </div>
                            </div>
                          </div>

                          {/* Spotlight Information */}
                          <div className={styles.spotlightInfo}>
                            <div>
                              <div className={styles.spotlightBadge}>
                                <Flame size={12} strokeWidth={2.5} />
                                <span>#1 Top Recommended Course</span>
                              </div>

                              <h3 className={styles.spotlightTitle}>
                                {spotlightVideo.title}
                              </h3>

                              <div className={styles.spotlightChannel}>
                                <Tv size={14} strokeWidth={2} color="#ef4444" />
                                <span>Channel: <strong>{spotlightVideo.channel || 'YouTube Learning'}</strong></span>
                                <CheckCircle2 size={13} strokeWidth={2} color="#38bdf8" />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.spotlightActions}>
                              <button
                                type="button"
                                onClick={() => setActivePlayingVideo(spotlightVideo)}
                                className={styles.playSpotlightBtn}
                              >
                                <Play size={15} fill="white" color="white" />
                                <span>Watch Video Here</span>
                              </button>

                              <a
                                href={spotlightVideo.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.secondaryWatchBtn}
                              >
                                <span>Open in YouTube</span>
                                <ExternalLink size={13} strokeWidth={2} />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* REMAINING CURATED PLAYLISTS & LECTURES GRID */}
                      {remainingVideos.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', margin: '1rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Film size={16} strokeWidth={2} color="#f59e0b" />
                            <span>More Curated Playlists & Tutorials ({remainingVideos.length})</span>
                          </h4>

                          <div className={styles.videoGrid}>
                            {remainingVideos.map((video: any, i: number) => (
                              <div
                                key={i}
                                className={styles.videoCard}
                                onClick={() => setActivePlayingVideo(video)}
                              >
                                {/* Thumbnail */}
                                <div className={styles.videoThumbContainer}>
                                  <img
                                    src={video.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'}
                                    alt={video.title}
                                    className={styles.videoThumbImg}
                                  />
                                  <div className={styles.videoPlayOverlay}>
                                    <div className={styles.playCircle}>
                                      <Play size={16} fill="white" color="white" style={{ marginLeft: '2px' }} />
                                    </div>
                                  </div>
                                  <span style={{ position: 'absolute', bottom: '8px', left: '10px', background: 'rgba(0,0,0,0.75)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                    {video.channel || 'YouTube'}
                                  </span>
                                </div>

                                {/* Info */}
                                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 10px 0', lineHeight: '1.4', color: '#f1f5f9', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {video.title}
                                  </h3>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Play size={11} strokeWidth={2} color="#ef4444" />
                                      <span>Click to Play</span>
                                    </span>
                                    <a
                                      href={video.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                                      title="Open directly in YouTube"
                                    >
                                      <ExternalLink size={13} strokeWidth={2} />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. COMMUNITIES & DISCUSSION GROUPS */}
                {(selectedCategory === 'all' || selectedCategory === 'communities') && resources.communities && resources.communities.length > 0 && (
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={styles.sectionIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                          <Users size={20} strokeWidth={2} color="#10b981" />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            Communities & Discussion Groups
                          </h2>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Join active developer chats, Reddit subreddits, Telegram channels, and forums
                          </span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
                        {resources.communities.length} groups
                      </span>
                    </div>

                    <div className={styles.communityGrid}>
                      {resources.communities.map((community: any, i: number) => {
                        const meta = getCommunityMeta(community.link, community.title)
                        return (
                          <a
                            key={i}
                            href={community.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.communityCard}
                            style={{
                              borderColor: 'rgba(255,255,255,0.07)'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: meta.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {meta.icon}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: meta.color, textTransform: 'uppercase' }}>
                                    {meta.platform}
                                  </span>
                                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {community.title}
                                  </h3>
                                </div>
                              </div>

                              <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.45', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {community.snippet}
                              </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {getHostname(community.link)}
                              </span>
                              <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>Join Community</span>
                                <ArrowRight size={12} strokeWidth={2} />
                              </span>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* EMPTY STATE */}
            {!resources && !searching && (
              <div className={styles.sectionCard} style={{ textAlign: 'center', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={32} strokeWidth={1.8} color="#8b5cf6" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
                  Start Your Learning Journey
                </h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px', margin: 0, lineHeight: 1.6 }}>
                  Explore <strong>Official Docs</strong>, <strong>AI Smart Notes</strong>, <strong>Free Online Books</strong>, <strong>Playlists</strong>, and <strong>Communities</strong>.
                </p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* EMBEDDED IN-APP VIDEO PLAYER MODAL */}
      {activePlayingVideo && (
        <div
          className={styles.playerModalOverlay}
          onClick={() => setActivePlayingVideo(null)}
        >
          <div
            className={styles.playerModalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={styles.playerModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={16} strokeWidth={2} color="#ef4444" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activePlayingVideo.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {activePlayingVideo.channel || 'YouTube'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={activePlayingVideo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.secondaryWatchBtn}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <span>Open in YouTube</span>
                  <ExternalLink size={12} strokeWidth={2} />
                </a>

                <button
                  type="button"
                  onClick={() => setActivePlayingVideo(null)}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Iframe Video Embed */}
            <div className={styles.playerFrameWrapper}>
              {getYouTubeEmbedUrl(activePlayingVideo.link) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activePlayingVideo.link)}
                  title={activePlayingVideo.title}
                  className={styles.playerIframe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', margin: 0 }}>This video cannot be embedded inline.</p>
                  <a
                    href={activePlayingVideo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.playSpotlightBtn}
                  >
                    <span>Watch directly on YouTube</span>
                    <ExternalLink size={14} strokeWidth={2} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
