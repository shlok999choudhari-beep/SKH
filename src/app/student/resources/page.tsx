'use client'
import { useState } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import styles from '../dashboard.module.css'

export default function LearningResources() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [resources, setResources] = useState<any>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await res.json()
      
      if (data.success) {
        setResources(data.resources)
      } else {
        alert(data.error || 'Search failed')
      }
    } catch (error) {
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const popularTopics = [
    { name: 'React', icon: '⚛️', color: '#61dafb' },
    { name: 'Node.js', icon: '🟢', color: '#68a063' },
    { name: 'Python', icon: '🐍', color: '#3776ab' },
    { name: 'JavaScript', icon: '📜', color: '#f7df1e' },
    { name: 'TypeScript', icon: '📘', color: '#3178c6' },
    { name: 'Docker', icon: '🐳', color: '#2496ed' },
    { name: 'AWS', icon: '☁️', color: '#ff9900' },
    { name: 'MongoDB', icon: '🍃', color: '#47a248' },
  ]

  const getHostname = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname
    } catch {
      return urlStr || 'web'
    }
  }

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>📚 Learning Resources</h1>
            <p className={styles.pageSubtitle}>Discover tutorials, documentation, and communities</p>
          </div>
        </header>

        <main className={styles.main}>
          {/* Search Section */}
          <div className={`glass ${styles.panel}`}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for any technology, framework, or skill..."
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '48px', fontSize: '16px', height: '56px' }}
                  />
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px' }}>
                    🔍
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  className="btn btn-primary btn-lg"
                  style={{ height: '56px', minWidth: '140px' }}
                >
                  {searching ? '🔄 Searching...' : '🚀 Search'}
                </button>
              </div>
            </form>

            {/* Popular Topics */}
            {!resources && (
              <div style={{ marginTop: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Popular topics:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {popularTopics.map((topic) => (
                    <button
                      key={topic.name}
                      onClick={() => {
                        setQuery(topic.name)
                        handleSearch({ preventDefault: () => {} } as any)
                      }}
                      className={styles.skillTag}
                      style={{ 
                        cursor: 'pointer',
                        background: `${topic.color}20`,
                        borderColor: `${topic.color}50`,
                        color: topic.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{topic.icon}</span>
                      <span>{topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {resources && (
            <>
              {/* YouTube Videos */}
              {resources.videos && resources.videos.length > 0 && (
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className={styles.panelTitle}>🎥 Video Tutorials</h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {resources.videos.length} videos found
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {resources.videos.map((video: any, i: number) => (
                      <a
                        key={i}
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div className={styles.videoCard}>
                          <div className={styles.videoThumbnail}>
                            <img 
                              src={video.imageUrl || 'https://via.placeholder.com/320x180?text=Video'} 
                              alt={video.title}
                              style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }}
                            />
                            <div className={styles.playButton}>▶</div>
                          </div>
                          <div style={{ padding: '12px 0' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', lineHeight: '1.4' }}>
                              {video.title}
                            </h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {video.channel || 'YouTube'}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation & Articles */}
              {resources.documentation && resources.documentation.length > 0 && (
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className={styles.panelTitle}>📖 Documentation & Guides</h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {resources.documentation.length} resources found
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {resources.documentation.map((doc: any, i: number) => (
                      <a
                        key={i}
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.docCard}
                      >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '12px', 
                            background: 'var(--grad-primary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '24px',
                            flexShrink: 0
                          }}>
                            📄
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                              {doc.title}
                            </h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '8px' }}>
                              {doc.snippet}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {getHostname(doc.link)}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--accent-violet)' }}>→</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Communities */}
              {resources.communities && resources.communities.length > 0 && (
                <div className={`glass ${styles.panel}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className={styles.panelTitle}>👥 Communities & Groups</h3>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {resources.communities.length} communities found
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {resources.communities.map((community: any, i: number) => (
                      <a
                        key={i}
                        href={community.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.communityCard}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: 'var(--grad-green)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}>
                            {(community.link || '').includes('telegram') ? '✈️' : 
                             (community.link || '').includes('discord') ? '💬' : 
                             (community.link || '').includes('reddit') ? '🤖' : '👥'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {community.title}
                            </h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {getHostname(community.link)}
                            </p>
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {community.snippet?.substring(0, 100)}...
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* New Search Button */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    setResources(null)
                    setQuery('')
                  }}
                  className="btn btn-secondary"
                >
                  🔍 New Search
                </button>
              </div>
            </>
          )}

          {/* Empty State */}
          {!resources && !searching && (
            <div className={`glass ${styles.panel}`} style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎓</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                Start Your Learning Journey
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                Search for any technology, programming language, or framework to discover curated learning resources including video tutorials, documentation, and active communities.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
