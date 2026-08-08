# Behavioral Analysis Feature

## Overview
AI-powered behavioral interview assessment with video recording, real-time transcription, gesture analysis, and comprehensive reporting.

## Features

### 1. **VAPI Integration**
- Assistant ID: `5be94cdf-1c98-49d3-ae29-828a33de84a0`
- Voice: Emma (VAPI)
- Model: GPT-4.1
- Transcriber: Deepgram (flux-general-en)
- Conducts 15-20 minute behavioral interviews
- Asks 8-10 STAR method questions

### 2. **Video Recording & Analysis**
- Records full interview video (1280x720)
- Captures snapshots every 5 seconds for gesture analysis
- Analyzes body language and non-verbal communication
- Mirror view for candidate comfort

### 3. **Real-time Transcription**
- Live transcript display during interview
- Separates interviewer and candidate responses
- Timestamps for each message
- Final transcripts only (no partial text)

### 4. **AI-Powered Analysis (Groq)**
- Comprehensive assessment using Llama 3.3 70B
- Analyzes:
  - Communication skills
  - Confidence level
  - Problem-solving ability
  - Leadership qualities
  - Teamwork capabilities
  - Adaptability
  - Emotional intelligence
  - Professionalism
  - Body language
  - STAR method usage
  - Response quality

### 5. **Scoring System**
- Overall Score: 0-100
- Individual Metrics: 0-10 each
  - Communication
  - Confidence
  - Problem Solving
  - Leadership
  - Teamwork
  - Adaptability
  - Emotional Intelligence
  - Professionalism

### 6. **Comprehensive Report**
- **Summary**: 2-3 paragraph overall assessment
- **Strengths**: 4-6 specific strengths observed
- **Areas for Improvement**: 4-6 specific areas to work on
- **Recommendations**: Detailed improvement suggestions
- **Body Language Analysis**: Non-verbal communication assessment
- **STAR Method Usage**: How well structured responses were
- **Response Quality**: Depth and relevance of answers

### 7. **Export Options**
- **PDF Download**: Professional formatted report
- **HTML Download**: Interactive web-based report with styling

## User Flow

1. **Start Interview**
   - Click "Start Interview"
   - Grant camera/microphone permissions
   - Video preview appears (mirrored)
   - VAPI assistant begins interview

2. **During Interview**
   - Answer behavioral questions naturally
   - Live transcript shows on right panel
   - Timer displays interview duration
   - Video snapshots captured automatically

3. **End Interview**
   - Click "End Interview"
   - AI analyzes transcript and video
   - Processing takes 10-20 seconds

4. **View Report**
   - Overall score displayed prominently
   - Score breakdown with visual indicators
   - Detailed analysis sections
   - Download PDF or HTML report

5. **Start New Interview**
   - Reset and begin fresh assessment

## Technical Implementation

### Frontend (`/student/behavioral-analysis/page.tsx`)
- React hooks for state management
- VAPI SDK integration
- MediaRecorder API for video capture
- Canvas API for snapshot capture
- Real-time transcript updates

### Backend APIs

#### `/api/behavioral-analysis` (POST)
- Receives: transcript, duration, videoSnapshots
- Processes: Groq AI analysis
- Returns: Comprehensive analysis JSON

#### `/api/behavioral-analysis/pdf` (POST)
- Receives: analysis object
- Generates: PDF using jsPDF
- Returns: PDF file download

### Data Flow
```
User → VAPI Interview → Transcript + Video
  ↓
Groq AI Analysis
  ↓
JSON Report → PDF/HTML Export
```

## Scoring Interpretation

- **80-100**: Excellent - Strong candidate, ready for role
- **60-79**: Good - Solid performance, minor improvements needed
- **40-59**: Average - Needs development in key areas
- **0-39**: Needs Improvement - Significant gaps identified

## Key Benefits

1. **Objective Assessment**: AI removes human bias
2. **Comprehensive Analysis**: Multiple dimensions evaluated
3. **Actionable Feedback**: Specific improvement suggestions
4. **Professional Reports**: Shareable with recruiters
5. **Practice Tool**: Students can improve interview skills
6. **Video Evidence**: Body language and gestures analyzed
7. **STAR Method Training**: Encourages structured responses

## Future Enhancements

- Emotion detection from video
- Voice tone analysis
- Comparison with industry benchmarks
- Progress tracking over multiple interviews
- Custom question sets per role
- Interview replay with annotations
