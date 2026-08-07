'use client';

import { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import StudentSidebar from '@/components/StudentSidebar';
import styles from './skills.module.css';
import dashboardStyles from '../dashboard.module.css';

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

  const analyzeCompany = async () => {
    setLoading(true);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze company');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      setCompanyAnalysis(parsed.analysis);
      setQuestions(parsed.skills);
      setStep(2);
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(`Error: ${error.message || 'Failed to analyze company. Please try again.'}`);
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
        <h1>📊 Skill Radar Chart</h1>
        <p>AI-powered skill gap analysis for your dream company</p>
      </div>

      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>🎯 Step 1: Company Analysis</h2>
            <p>Enter your target company and let Grok AI analyze the required skills</p>
          </div>
          
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label>🏢 Target Company</label>
              <input
                type="text"
                placeholder="e.g., Google, Amazon, Microsoft, Netflix"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={styles.input}
              />
            </div>

            <button 
              onClick={analyzeCompany} 
              disabled={loading || !company} 
              className={styles.button}
            >
              {loading ? '🔄 Analyzing...' : '🚀 Analyze Company'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📝 Step 2: Skill Assessment for {company}</h2>
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
          
          <button onClick={generateResults} className={styles.button}>
            📊 Generate Analysis
          </button>
        </div>
      )}

      {step === 3 && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>🎯 Your Skill Gap Analysis</h2>
            <button onClick={() => { setStep(1); setResults([]); setAnswers({}); }} className={styles.resetBtn}>
              🔄 New Analysis
            </button>
          </div>
          
          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h3>🎯 Radar Chart - Overall Profile</h3>
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
              <h3>📊 Bar Chart - Skill Comparison</h3>
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
              <h3>📈 Line Chart - Progress Tracking</h3>
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
              <h3>🔴 Gap Analysis</h3>
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
            <h3>🎯 Priority Areas for Improvement</h3>
            <div className={styles.summaryGrid}>
              {results
                .filter(r => r.gap > 2)
                .sort((a, b) => b.gap - a.gap)
                .map((r, idx) => (
                  <div key={idx} className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>
                      {idx === 0 ? '🔥' : idx === 1 ? '⚠️' : '📌'}
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
              <div className={styles.noGaps}>
                <span>🎉</span>
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
