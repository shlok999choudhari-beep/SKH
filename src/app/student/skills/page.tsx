'use client';

import { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import StudentSidebar from '@/components/StudentSidebar';
import BackButton from '@/components/BackButton';
import { MorphingInfinity } from '@/components/ui/morphing-infinity';
import styles from './skills.module.css';
import dashboardStyles from '../dashboard.module.css';
import {
  Target,
  Building2,
  Sparkles,
  Loader2,
  FileText,
  BarChart2,
  RotateCcw,
  TrendingUp,
  TriangleAlert,
  Zap,
  Pin,
  Award
} from 'lucide-react';

interface Question {
  skill: string;
  question: string;
  importance: number;
}

interface SkillScore {
  skill: string;
  score: number;
  required: number;
  gap: number;
}

export default function SkillRadarChart() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SkillScore[]>([]);
  const [companyAnalysis, setCompanyAnalysis] = useState('');
  const [scopeError, setScopeError] = useState('');

  const analyzeCompany = async () => {
    setLoading(true);
    setScopeError('');
    try {
      const prompt = `Analyze ${company} company and identify 7 key technical skills required for software engineering roles. Return ONLY a JSON object with this exact structure:
{
  "analysis": "brief company overview and tech stack",
  "skills": [
    {"skill": "skill name", "question": "Rate your proficiency in [skill] (0-10)", "importance": 9}
  ]
}`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || data.blocked) {
        setScopeError(data.error || "This request is outside PlaceIQ's learning scope. Ask me about your studies, skills, languages, career preparation, or personal development.");
        setLoading(false);
        return;
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response format');
      }
      const parsed = JSON.parse(content);
      
      setCompanyAnalysis(parsed.analysis);
      setQuestions(parsed.skills);
      setStep(2);
    } catch (error: any) {
      console.error('Analysis error:', error);
      setScopeError(error.message || 'Failed to analyze company. Please enter a valid company name.');
    }
    setLoading(false);
  };

  const handleAnswerChange = (skill: string, value: number) => {
    setAnswers({ ...answers, [skill]: value });
  };

  const generateResults = () => {
    const skillScores: SkillScore[] = questions.map((q) => ({
      skill: q.skill,
      score: answers[q.skill] || 0,
      required: q.importance || 8,
      gap: (q.importance || 8) - (answers[q.skill] || 0),
    }));
    setResults(skillScores);
    setStep(3);
  };

  return (
    <div className={dashboardStyles.layout}>
      <StudentSidebar />
      <div className={dashboardStyles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <BackButton fallbackHref="/student/dashboard" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={26} strokeWidth={2} color="#8b5cf6" />
                  <h1>Skill Radar Chart</h1>
                </div>
                <p>AI-powered skill gap analysis for your dream company</p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Target size={18} strokeWidth={2} color="#8b5cf6" />
                  <h2>Step 1: Company Analysis</h2>
                </div>
                <p>Enter your target company and let Grok AI analyze the required skills</p>
              </div>
              
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={15} strokeWidth={2} color="#8b5cf6" />
                    <span>Target Company</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter target company (e.g. Google, Microsoft, Amazon, TCS)..."
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value)
                      if (scopeError) setScopeError('')
                    }}
                    className={styles.input}
                  />
                </div>

                {scopeError && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎓</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fca5a5' }}>
                        Learning Scope Notice
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {scopeError}
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={analyzeCompany} 
                  disabled={loading || !company} 
                  className={styles.button}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? <MorphingInfinity className="size-4" style={{ width: '16px', height: '16px' }} /> : <Sparkles size={16} strokeWidth={2} />}
                  <span>{loading ? 'Analyzing...' : 'Analyze Company'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <FileText size={18} strokeWidth={2} color="#8b5cf6" />
                  <h2>Step 2: Skill Assessment for {company}</h2>
                </div>
                <div className={styles.analysis}>{companyAnalysis}</div>
              </div>
              
              <div className={styles.questions}>
                {questions.map((q, idx) => (
                  <div key={idx} className={styles.question}>
                    <div className={styles.questionHeader}>
                      <label>{q.question}</label>
                      <span className={styles.score}>{answers[q.skill] || 0}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={answers[q.skill] || 0}
                      onChange={(e) => handleAnswerChange(q.skill, parseInt(e.target.value))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={generateResults} className={styles.button} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BarChart2 size={16} strokeWidth={2} />
                <span>Generate Analysis</span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={styles.results}>
              <div className={styles.resultsHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={20} strokeWidth={2} color="#8b5cf6" />
                  <h2>Your Skill Gap Analysis</h2>
                </div>
                <button onClick={() => { setStep(1); setResults([]); setAnswers({}); }} className={styles.resetBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} strokeWidth={2} />
                  <span>New Analysis</span>
                </button>
              </div>
              
              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Target size={16} strokeWidth={2} color="#8884d8" />
                    <h3>Radar Chart - Overall Profile</h3>
                  </div>
                  <p className={styles.chartDesc}>Compare your skills against {company} requirements</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={results}>
                      <PolarGrid stroke="#e0e0e0" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#666', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#999' }} />
                      <Radar name="Your Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Required" dataKey="required" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <BarChart2 size={16} strokeWidth={2} color="#82ca9d" />
                    <h3>Bar Chart - Skill Comparison</h3>
                  </div>
                  <p className={styles.chartDesc}>Side-by-side comparison of current vs required levels</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8884d8" name="Your Score" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="required" fill="#82ca9d" name="Required" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <TrendingUp size={16} strokeWidth={2} color="#8884d8" />
                    <h3>Line Chart - Progress Tracking</h3>
                  </div>
                  <p className={styles.chartDesc}>Visualize your skill trajectory</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={3} name="Your Score" dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="required" stroke="#82ca9d" strokeWidth={3} name="Required" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <TriangleAlert size={16} strokeWidth={2} color="#ff6b6b" />
                    <h3>Gap Analysis</h3>
                  </div>
                  <p className={styles.chartDesc}>Focus areas - higher bars need more attention</p>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="gap" fill="#ff6b6b" name="Skill Gap" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={styles.summary}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Target size={18} strokeWidth={2} color="#8b5cf6" />
                  <h3>Priority Areas for Improvement</h3>
                </div>
                <div className={styles.summaryGrid}>
                  {results
                    .filter(r => r.gap > 2)
                    .sort((a, b) => b.gap - a.gap)
                    .map((r, idx) => (
                      <div key={idx} className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {idx === 0 ? <Zap size={20} strokeWidth={2} color="#ef4444" /> : idx === 1 ? <TriangleAlert size={20} strokeWidth={2} color="#f59e0b" /> : <Pin size={20} strokeWidth={2} color="#8b5cf6" />}
                        </div>
                        <div className={styles.summaryContent}>
                          <h4>{r.skill}</h4>
                          <p>Gap: <strong>{r.gap} points</strong></p>
                          <div className={styles.summaryBar}>
                            <div className={styles.summaryProgress} style={{ width: `${(r.score / r.required) * 100}%` }} />
                          </div>
                          <small>Current: {r.score}/10 | Required: {r.required}/10</small>
                        </div>
                      </div>
                    ))}
                </div>
                {results.filter(r => r.gap > 2).length === 0 && (
                  <div className={styles.noGaps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Award size={24} strokeWidth={2} color="#10b981" />
                    <p>Great job! You meet or exceed all requirements!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

