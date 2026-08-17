<div align="center">

# 🚀 PLACEIQ
### *Next-Gen AI Smart Placement, Skill Gap Analysis & Institutional Career Ecosystem*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

<p align="center">
  <b>Bridging the gap between students, recruiters, and academic institutions with generative AI, real-time code evaluation, and automated hiring pipelines.</b>
</p>

[Key Features](#-key-features) •
[Architecture](#-system-architecture) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-getting-started) •
[Environment Variables](#-environment-variables) •
[Deployment](#-deployment)

---

</div>

## 📖 Overview

**PlaceIQ** is an all-in-one AI career intelligence and campus placement platform. It connects three primary stakeholders:
1. **Students** — To analyze resumes, discover skill gaps, practice live voice mock interviews, solve coding challenges, and apply to matched internships.
2. **Companies / Recruiters** — To discover top talent, manage hiring pipelines, host real-time coding evaluations with video interviews, and create placement drives.
3. **Institutions / Colleges** — To monitor placement statistics, manage student document verification vaults, and share campus labs/resources with peer institutions through an inter-college marketplace.

---

## 🌟 Key Features

### 🎓 1. Student Portal
* **📄 AI Resume Analyzer & ATS Score:** Instant extraction and analysis of PDF/Image resumes with ATS compatibility scoring and actionable improvement tips.
* **🧠 Semantic Skill Gap Detector:** Compares student resumes against target job descriptions to identify missing technical & soft skills.
* **🗺️ Personalized 4-Week AI Roadmap:** Generates day-by-day learning schedules with targeted search queries for YouTube and documentation.
* **🎤 AI Voice Mock Interview Simulator:** Real-time conversational interview practice powered by **Vapi AI voice agent** with post-interview transcription, evaluation, and PDF report downloads.
* **💻 Real-Time Coding Judge:** LeetCode-style code editor (powered by Monaco Editor) with multi-language code execution and test case verification.
* **🏫 Campus Resource Booking:** Reserve computer labs, seminar halls, and equipment across partner institutions.
* **🎯 Dream Company Mode:** Tailored preparation paths specifically designed for Tier-1 companies (Google, Microsoft, Amazon, etc.).
* **📑 Verified Document Vault:** Upload and verify academic marks, degrees, and certificates with automated quality checks.

---

### 🏢 2. Company / Recruiter Portal
* **👥 Candidate Matching & Pipeline:** Filter applicants by CGPA, 10th/12th percentages, and AI skill-match scores.
* **🚀 Live Technical Interview Rooms:** Real-time peer-to-peer coding sessions with synchronized editor state via **Socket.IO** and **WebRTC video streaming**.
* **💼 Internship & Placement Drive Management:** Post roles, set eligibility cutoffs, schedule rounds, and issue offers.
* **📊 Candidate Scoring & Feedback:** Real-time score assignment and feedback reports stored directly in the candidate profile.

---

### 🏛️ 3. Institution / College Admin Portal
* **📈 Placement Ecosystem Analytics:** Live dashboards tracking drive applications, hiring trends, active trainers, and student success rates.
* **🤝 Inter-College Resource Sharing:** List institutional resources (laboratories, software licenses, halls) and manage resource-sharing agreements with neighboring colleges.
* **👨‍🏫 Trainer & Workshop Management:** Coordinate specialized skill-training sessions and manage faculty ratings.
* **📂 Document Verification & Auditing:** Verify student records, issue verification badges, and maintain tamper-proof audit logs.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client[Next.js Client - React 19] -->|HTTPS / REST| AppRouter[Next.js App Router API Routes]
    Client -->|WebSockets| SocketServer[Socket.IO Server - Port 3001]
    
    AppRouter -->|Prisma Client| DB[(PostgreSQL on Supabase)]
    AppRouter -->|Llama-3.3-70B API| Groq[Groq AI Inference]
    Client -->|Voice Streams| Vapi[Vapi AI Voice Assistant]
    
    subgraph Real-Time Interview Room
      Client -->|WebRTC Media Streams| PeerClient[Recruiter / Student Peer]
      SocketServer -.->|Signaling & Code Sync| Client
      SocketServer -.->|Signaling & Code Sync| PeerClient
    end
```

---

## 💻 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16.2.2](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | Vanilla CSS Modules, Modern Glassmorphism Design System, Lucide Icons |
| **Database, Storage & ORM** | [PostgreSQL (Supabase)](https://supabase.com/), [Supabase Storage](https://supabase.com/storage), [Prisma ORM 5.22](https://www.prisma.io/) |
| **Real-Time & WebSockets** | [Socket.IO 4.8](https://socket.io/), [WebRTC](https://webrtc.org/) (Simple-Peer) |
| **AI & NLP Inference** | [Groq SDK](https://groq.com/) (Llama-3.3-70B-Versatile), [Vapi AI](https://vapi.ai/) (Voice Agent) |
| **Document & Media Processing**| `pdf-parse`, `jspdf`, `html2canvas`, `tesseract.js`, `sharp` |
| **Code Editor** | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) |
| **Data Visualization** | [Recharts](https://recharts.org/) |

---

## ⚡ Performance Optimizations

* **Parallel Query Execution (`Promise.all`):** Database queries across all dashboard APIs run concurrently, slashing server response times by 60–75%.
* **High-Performance Indexing:** Comprehensive `@@index` annotations across all high-traffic relational tables in PostgreSQL.
* **Non-Blocking Background Fetching:** Heavy external API calls (e.g. live job market scraping) load asynchronously in background threads.
* **On-Demand Bundle Splitting:** Bulky export libraries (`jsPDF`, `html2canvas`) and code editors are dynamically imported on click.
* **Row Level Security (RLS):** Fully enabled across all public tables in Supabase for enterprise-grade data protection.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL Database** (e.g. [Supabase](https://supabase.com))

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/PlaceIQ.git
   cd PlaceIQ
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables)).

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

### Running the Application

* **Run Frontend & Socket Server concurrently (Recommended):**
  ```bash
  npm run dev:all
  ```

* **Run Next.js App only (`http://localhost:3000`):**
  ```bash
  npm run dev
  ```

* **Run Socket.IO Server only (`http://localhost:3001`):**
  ```bash
  npm run socket
  ```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# Database Connections (Supabase PostgreSQL / Prisma)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# Supabase Cloud Storage (Vault & Resumes)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_public_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_secret_key"

# Authentication & Session (JWT)
SESSION_SECRET="your-super-secret-jwt-key-32-chars-minimum!!"

# AI & NLP Inference (Groq Llama 3.3 70B)
GROQ_API_KEY="gsk_your_groq_api_key"

# Vapi AI Voice Agent (Mock Interview Simulator)
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your_vapi_public_key"
NEXT_PUBLIC_VAPI_ASSISTANT_ID="your_vapi_assistant_id"

# Web Search & Live Market Jobs (Serper API)
SERPER_API_KEY="your_serper_api_key"
```

---

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma          # PostgreSQL database schema with indexes
├── server/
│   └── socket-server.js       # Real-time WebSocket signaling server
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # Serverless API routes (AI, auth, student, company, institution)
│   │   ├── auth/              # Login, register & role selection
│   │   ├── student/           # Student portal (Dashboard, Resume, Mock Interview, Coding Judge, Roadmap)
│   │   ├── company/           # Recruiter portal (Dashboard, Candidates, Coding Rooms, Internships)
│   │   ├── institution/       # College Admin portal (Analytics, Resource Sharing, Documents)
│   │   ├── layout.tsx         # Global theme provider & root layout
│   │   └── page.tsx           # Interactive landing page with dynamic WebGL showcase
│   ├── components/            # Reusable UI components & modals
│   ├── contexts/              # Theme and authentication contexts
│   ├── lib/                   # Database client, Groq service, Vapi service, JWT sessions
│   └── types/                 # Shared TypeScript interfaces
├── docs/                      # Architectural specifications & feature documentation
├── public/                    # Static assets & document uploads
└── package.json
```

---

## 🚢 Deployment

### 1. Next.js Frontend & API (Deploy to Vercel)
1. Push your repository to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Set the environment variables from your `.env`.
4. Click **Deploy**. Vercel will automatically build and serve the application globally via Edge CDN.

### 2. Standalone Socket Server (Deploy to Render / Railway)
For persistent WebSocket rooms (`server/socket-server.js`):
1. Create a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set Build Command: `npm install`
3. Set Start Command: `node server/socket-server.js`

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for students, universities, and companies aiming for career excellence.</sub>
</div>
