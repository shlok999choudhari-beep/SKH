'use client';

import { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import styles from './skill-analysis.module.css';

interface Question {
  skill: string;
  question: string;
}

interface SkillScore {
  skill: string;
  score: number;
  required: number;
  gap: number;
}

export default function SkillAnalysis() {
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState('');
  const [apiKey, setApiKey] = useState('');
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
  "analysis": "brief company overview",
  "skills": [
    {"skill": "skill name", "question": "Rate your proficiency in [skill] (0-10)", "importance": 9}
  ]
}`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKey }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      setCompanyAnalysis(parsed.analysis);
      setQuestions(parsed.skills);
      setStep(2);
    } catch (error) {
      alert('Error analyzing company. Please check your API key and try again.');
    }
    setLoading(false);
  };

  const handleAnswerChange = (skill: string, value: number) => {
    setAnswers({ ...answers, [skill]: value });
  };

  const generateResults = () => {
    const skillScores: SkillScore[] = questions.map((q: any) => ({
      skill: q.skill,
      score: answers[q.skill] || 0,
      required: q.importance || 8,
      gap: (q.importance || 8) - (answers[q.skill] || 0),
    }));
    setResults(skillScores);
    setStep(3);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Skill Gap Analysis</h1>

      {step === 1 && (
        <div className={styles.card}>
          <h2>Step 1: Company Analysis</h2>
          <input
            type="text"
            placeholder="Enter company name (e.g., Google, Amazon)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Enter your Grok API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={styles.input}
          />
          <button onClick={analyzeCompany} disabled={loading || !company || !apiKey} className={styles.button}>
            {loading ? 'Analyzing...' : 'Analyze Company'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.card}>
          <h2>Step 2: Skill Assessment for {company}</h2>
          <p className={styles.analysis}>{companyAnalysis}</p>
          
          <div className={styles.questions}>
            {questions.map((q, idx) => (
              <div key={idx} className={styles.question}>
                <label>{q.question}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={answers[q.skill] || 0}
                  onChange={(e) => handleAnswerChange(q.skill, parseInt(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.score}>{answers[q.skill] || 0}/10</span>
              </div>
            ))}
          </div>
          
          <button onClick={generateResults} className={styles.button}>
            Generate Analysis
          </button>
        </div>
      )}

      {step === 3 && (
        <div className={styles.results}>
          <h2>Your Skill Gap Analysis</h2>
          
          <div className={styles.chartGrid}>
            <div className={styles.chartCard}>
              <h3>Radar Chart - Overall Profile</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={results}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar name="Your Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Required" dataKey="required" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h3>Bar Chart - Skill Gaps</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" name="Your Score" />
                  <Bar dataKey="required" fill="#82ca9d" name="Required" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h3>Line Chart - Progress Tracking</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" name="Your Score" />
                  <Line type="monotone" dataKey="required" stroke="#82ca9d" name="Required" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h3>Gap Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gap" fill="#ff6b6b" name="Skill Gap" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.summary}>
            <h3>Areas to Improve:</h3>
            <ul>
              {results
                .filter(r => r.gap > 2)
                .sort((a, b) => b.gap - a.gap)
                .map((r, idx) => (
                  <li key={idx}>
                    <strong>{r.skill}</strong>: Gap of {r.gap} points (Current: {r.score}, Required: {r.required})
                  </li>
                ))}
            </ul>
          </div>

          <button onClick={() => { setStep(1); setResults([]); setAnswers({}); }} className={styles.button}>
            Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
}
