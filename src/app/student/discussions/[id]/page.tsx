'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StudentSidebar from '@/components/StudentSidebar'
import BackButton from '@/components/BackButton'
import styles from '../discussions.module.css'
import { MorphingInfinity } from '@/components/ui/morphing-infinity'
import {
  MessageSquare,
  ArrowLeft,
  Pin,
  Lock,
  ThumbsUp,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  BookOpen
} from 'lucide-react'

export default function StudentDiscussionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [discussion, setDiscussion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(0)
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const discussionId = params?.id

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion()
    }
  }, [discussionId])

  const fetchDiscussion = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/discussions/${discussionId}`)
      const data = await res.json()
      if (data.discussion) {
        setDiscussion(data.discussion)
        setHelpfulCount(data.discussion.helpfulCount || 0)
      } else {
        setErrorMsg('Discussion not found')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch discussion')
    } finally {
      setLoading(false)
    }
  }

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || submittingReply) return

    const text = replyContent.trim()
    setSubmittingReply(true)

    try {
      const res = await fetch(`/api/discussions/${discussionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      const data = await res.json()
      if (res.ok && data.success && data.reply) {
        setDiscussion((prev: any) => ({
          ...prev,
          replies: [...(prev.replies || []), data.reply]
        }))
        setReplyContent('')
      } else {
        alert(data.error || 'Failed to post reply')
      }
    } catch (err: any) {
      alert(err.message || 'Error posting reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleUpvoteHelpful = async () => {
    if (hasVotedHelpful) return
    try {
      const res = await fetch(`/api/discussions/${discussionId}/helpful`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setHelpfulCount(data.helpfulCount)
        setHasVotedHelpful(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <BackButton fallbackHref="/student/discussions" />
              <h1 className={styles.pageTitle}>
                <MessageSquare size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Discussion Thread</span>
              </h1>
            </div>
          </header>
          <div className={styles.loadingBox}>
            <MorphingInfinity
              style={{
                width: '52px',
                height: '52px',
                color: '#8b5cf6',
                filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.5))'
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
                Loading Thread
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Fetching discussion and replies...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className={styles.layout}>
        <StudentSidebar />
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <BackButton fallbackHref="/student/discussions" />
              <h1 className={styles.pageTitle}>
                <MessageSquare size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Discussion Thread</span>
              </h1>
            </div>
          </header>
          <div style={{ padding: '32px 40px' }}>
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <MessageSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Discussion Not Found</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{errorMsg || 'The discussion topic you requested does not exist.'}</p>
              <Link href="/student/discussions" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Discussions
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isInstructorAuthor = !discussion.studentId && (discussion.author?.role === 'trainer' || discussion.author?.role === 'institution-admin')
  const authorName = discussion.student?.name || discussion.author?.name || 'Student'

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {/* Sticky Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <BackButton fallbackHref="/student/discussions" />
            <div>
              <h1 className={styles.pageTitle}>
                <MessageSquare size={22} color="#8b5cf6" strokeWidth={2} />
                <span>Discussion Thread</span>
              </h1>
              <p className={styles.pageSubtitle}>{discussion.course?.title || 'Course Discussion'}</p>
            </div>
          </div>
        </header>

        <div className={styles.detailContainer}>
          {/* Main Post */}
          <div className={styles.mainPost}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {discussion.isPinned && (
                <span className={`${styles.badge} ${styles.badgePinned}`}>
                  <Pin size={11} /> Pinned
                </span>
              )}
              {discussion.isLocked && (
                <span className={`${styles.badge} ${styles.badgeLocked}`}>
                  <Lock size={11} /> Locked Thread
                </span>
              )}
              {discussion.course?.title && (
                <span className={`${styles.badge} ${styles.badgeCourse}`}>
                  <BookOpen size={11} /> {discussion.course.title}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', lineHeight: 1.35 }}>
              {discussion.title}
            </h1>

            <div className={styles.authorRow}>
              <div className={`${styles.avatar} ${isInstructorAuthor ? styles.avatarInstructor : ''}`}>
                {authorName[0].toUpperCase()}
              </div>
              <div className={styles.authorInfo}>
                <div className={styles.authorName}>
                  <span>{authorName}</span>
                  <span className={`${styles.roleBadge} ${isInstructorAuthor ? styles.roleInstructor : styles.roleStudent}`}>
                    {isInstructorAuthor ? 'Instructor' : 'Student'}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Posted on {new Date(discussion.createdAt).toLocaleDateString()} at {new Date(discussion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className={styles.postContent} style={{ whiteSpace: 'pre-wrap' }}>
              {discussion.content}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleUpvoteHelpful}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  color: hasVotedHelpful ? '#34d399' : 'inherit',
                  borderColor: hasVotedHelpful ? 'rgba(52,211,153,0.4)' : undefined
                }}
              >
                <ThumbsUp size={14} />
                <span>{hasVotedHelpful ? 'Marked Helpful' : 'Helpful'} ({helpfulCount})</span>
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {discussion.replies?.length || 0} response{discussion.replies?.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Replies Thread */}
          <div className={styles.repliesSection}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Responses ({discussion.replies?.length || 0})
            </h3>

            {(!discussion.replies || discussion.replies.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>No responses yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              discussion.replies.map((reply: any) => {
                const isReplyInstructor = !reply.studentId && (reply.author?.role === 'trainer' || reply.author?.role === 'institution-admin')
                const replyAuthorName = reply.student?.name || reply.author?.name || 'Student'

                return (
                  <div
                    key={reply.id}
                    className={`${styles.replyCard} ${reply.isHelpful ? styles.replyCardHelpful : ''}`}
                  >
                    {reply.isHelpful && (
                      <div className={styles.helpfulBadge}>
                        <CheckCircle2 size={12} />
                        <span>Marked as Helpful Answer</span>
                      </div>
                    )}

                    <div className={styles.authorRow}>
                      <div className={`${styles.avatar} ${isReplyInstructor ? styles.avatarInstructor : ''}`} style={{ width: '36px', height: '36px', fontSize: '0.875rem' }}>
                        {replyAuthorName[0].toUpperCase()}
                      </div>
                      <div className={styles.authorInfo}>
                        <div className={styles.authorName}>
                          <span>{replyAuthorName}</span>
                          <span className={`${styles.roleBadge} ${isReplyInstructor ? styles.roleInstructor : styles.roleStudent}`}>
                            {isReplyInstructor ? 'Instructor' : 'Peer'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                      {reply.content}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Reply Box */}
          {discussion.isLocked ? (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#f87171'
            }}>
              <Lock size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                This conversation has been locked by the instructor. Further replies are closed.
              </span>
            </div>
          ) : (
            <div className={styles.replyBox}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--primary)" />
                <span>Leave a Response</span>
              </h4>

              <form onSubmit={handlePostReply}>
                <textarea
                  className={styles.replyTextarea}
                  placeholder="Write your explanation, suggestion, or question reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handlePostReply(e)
                    }
                  }}
                  required
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingReply || !replyContent.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={14} />
                    <span>{submittingReply ? 'Posting...' : 'Post Response'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
