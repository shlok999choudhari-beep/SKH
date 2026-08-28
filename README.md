<div align="center">

# 🚀 PLACEIQ
### *Next-Gen AI Smart Placement, Skill Gap Analysis & Institutional Career Ecosystem*

[![Live Production](https://img.shields.io/badge/Live-placeiq.site-10b981?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.placeiq.site)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Resend](https://img.shields.io/badge/Resend-Email_Security-000000?style=for-the-badge&logo=resend)](https://resend.com/)
[![Groq AI](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

<p align="center">
  <b>Bridging the gap between students, recruiters, and academic institutions with generative AI, real-time code evaluation, WebRTC video interviews, and adaptive zero-trust security.</b>
</p>

[Live Website](https://www.placeiq.site) •
[Key Features](#-key-features) •
[Security & Auth](#-intelligent-login-shield--security) •
[Architecture](#-system-architecture) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-getting-started) •
[Environment Variables](#-environment-variables) •
[Deployment](#-deployment)

---

</div>

## 📖 Overview

**PlaceIQ** is an enterprise-grade AI career intelligence and campus placement platform connecting three primary stakeholders:
1. **Students** — Analyze resumes with ATS scoring, discover semantic skill gaps, practice conversational voice mock interviews, participate in live coding evaluations, and track placement roadmaps.
2. **Companies / Recruiters** — Discover verified candidates, post placement drives, manage hiring pipelines, and conduct real-time collaborative coding interviews with synchronized editors and WebRTC video streaming.
3. **Institutions / Colleges** — Monitor campus placement analytics, verify student academic credentials in a tamper-proof document vault, and participate in an inter-college resource-sharing marketplace.

---

## 🌟 Key Features

### 🎓 1. Student Portal
* **📄 AI Resume Analyzer & ATS Score:** Instant extraction and deep analysis of PDF/Image resumes with ATS score breakdown and targeted bullet-point improvements.
* **🧠 Semantic Skill Gap Detector:** Compares student resumes against industry job descriptions to identify missing technical, framework, and soft skills.
* **🗺️ Personalized 4-Week AI Roadmap:** Generates day-by-day learning schedules with targeted search queries for YouTube tutorials and official documentation.
* **🎤 AI Voice Mock Interview Simulator:** Real-time conversational interview simulator powered by **Vapi AI voice agent** with live transcription, performance evaluations, and PDF report downloads.
* **💻 Real-Time Coding Judge:** LeetCode-style code editor (powered by Monaco Editor) with multi-language code execution (C++, Python, Java), custom stdin input, and test case verification.
* **🏫 Campus Resource Booking:** Reserve computer labs, seminar halls, and equipment across partner institutions.
* **🎯 Dream Company Mode:** Tailored preparation paths specifically designed for Tier-1 companies (Google, Microsoft, Amazon, etc.).
* **📑 Verified Document Vault:** Upload and verify academic marks, degrees, and certificates with automated quality checks.

---

### 🏢 2. Company / Recruiter Portal
* **👥 Candidate Matching & Pipeline:** Filter applicants by CGPA, 10th/12th percentages, and AI skill-match scores.
* **🚀 Live Technical Coding Judge & Video Interview Rooms:** 
  * Real-time peer-to-peer coding sessions with synchronized Monaco editor state via **Socket.IO**.
  * Integrated **WebRTC video and audio streaming** with camera preview and live connection status.
  * **Prominent, copyable Coding Judge Room ID** displayed across the header and active session banners for quick candidate onboarding.
  * In-session candidate scoring (out of 100) and structured feedback submission linked directly to student profiles.
* **💼 Internship & Placement Drive Management:** Post roles, set eligibility cutoffs, schedule rounds, and issue offers.

---

### 🏛️ 3. Institution / College Admin Portal
* **📈 Placement Ecosystem Analytics:** Live dashboards tracking drive applications, hiring trends, active trainers, and student success rates.
* **🤝 Inter-College Resource Sharing:** List institutional resources (laboratories, software licenses, halls) and manage resource-sharing agreements with neighboring colleges.
* **👨‍🏫 Trainer & Workshop Management:** Coordinate specialized skill-training sessions and track faculty ratings.
* **📂 Document Verification & Auditing:** Verify student records, issue verification badges, and maintain tamper-proof audit logs.

---

## 🛡️ Intelligent Login Shield & Security

PlaceIQ incorporates an adaptive, enterprise-grade authentication and security engine:

* **🧠 Adaptive Risk Engine (`loginRiskEngine.ts`):** Evaluates incoming logins using browser/OS fingerprinting, IP velocity, impossible travel distance heuristics (>800 km/h), and consecutive failed attempt brute-force locks.
* **💻 Real-Time Device Telemetry (`clientDevice.ts`):** Accurately detects real client browsers (**Brave**, Chrome, Edge, Firefox, Safari, Opera, Arc, Vivaldi) and operating systems (**Windows 11/10**, macOS, Linux, Android, iOS).
* **📍 Live Geolocation Resolution:** Dynamically resolves and displays real-time approximate location (**City, State**) via fast IP geolocation APIs on security alerts and audit logs.
* **🔐 7-Day Persistent "Trust this Device":** Users verifying via email OTP can choose to trust their browser. PlaceIQ registers the device in PostgreSQL and issues a secure 7-day cookie (`placeiq_trusted_device`), allowing subsequent logins from the same browser with **password only (zero OTP friction)**.
* **📧 Transactional Security Delivery (Resend):** Sends 6-digit cryptographic SHA-256 OTPs and new device login alerts from the verified domain **`notifications@placeiq.site`** with DKIM and SPF compliance.
* **⚡ Bcrypt Password Auto-Upgrade:** Seamlessly detects and automatically upgrades legacy credentials to 12-round salted Bcrypt hashes on authenticated sign-in.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client[Next.js 16 Client - React 19] -->|HTTPS / REST| UnifiedServer[PlaceIQ Unified Server - Next.js + Socket.IO]
    Client -->|WebSockets| UnifiedServer
    
    UnifiedServer -->|Prisma ORM with Connection Pooler| DB[(Supabase PostgreSQL)]
    UnifiedServer -->|Inference API| Groq[Groq AI - Llama 3.3 70B]
    UnifiedServer -->|Transactional Emails| Resend[Resend API - placeiq.site]
    Client -->|Live Voice WebRTC| Vapi[Vapi AI Voice Engine]
    
    subgraph Real-Time Coding Judge Room
      Client -->|P2P WebRTC Media Streams| Candidate[Candidate / Student Peer]
      UnifiedServer -.->|Signaling & Monaco Code Sync| Client
      UnifiedServer -.->|Signaling & Monaco Code Sync| Candidate
    end
```

---

## 💻 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Live Production Domain** | [https://www.placeiq.site](https://www.placeiq.site) (Railway + Automated SSL) |
| **Frontend Framework** | [Next.js 16.2.2](https://nextjs.org/) (App Router, native ESM), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | Vanilla CSS Modules, Glassmorphism Design System, Lucide Icons |
| **Database & ORM** | [PostgreSQL (Supabase)](https://supabase.com/), [Prisma ORM 5.22](https://www.prisma.io/) (with PgBouncer connection pooling) |
| **Real-Time & Collaboration** | [Socket.IO 4.8](https://socket.io/), [WebRTC](https://webrtc.org/) (P2P Audio/Video & Code Sync) |
| **Transactional Email** | [Resend API](https://resend.com/) (Custom Domain: `notifications@placeiq.site` with DKIM/SPF) |
| **AI & NLP Inference** | [Groq SDK](https://groq.com/) (Llama-3.3-70B-Versatile), [Vapi AI](https://vapi.ai/) (Voice Agent) |
| **Document & Media Processing**| `pdf-parse`, `jspdf`, `html2canvas`, `tesseract.js`, `sharp` |
| **Code Editor** | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) |
| **Data Visualization** | [Recharts](https://recharts.org/) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v20.x or higher (tested up to Node 24)
* **npm**: v10.x or higher
* **PostgreSQL Database** (e.g. [Supabase](https://supabase.com))

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shlok999choudhari-beep/SKH.git
   cd SKH
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables)).

4. **Initialize Database Schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

### Running Locally

* **Run Unified Production Server (Next.js + Socket.IO on a single port):**
  ```bash
  npm run build
  npm start
  ```

* **Run Development Server:**
  ```bash
  npm run dev
  ```

* **Run Dev Server with WebSockets concurrently:**
  ```bash
  npm run dev:all
  ```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
# Database Connections (Supabase PostgreSQL with PgBouncer Pooler)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&sslaccept=accept_invalid_certs"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&sslaccept=accept_invalid_certs"

# Authentication & JWT Session Secret
SESSION_SECRET="your_super_secure_jwt_session_secret_32_characters_min"

# Resend Email Service (Security OTPs & Login Alerts)
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="notifications@placeiq.site"

# Supabase Cloud Storage (Document Vault & Resumes)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_public_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_secret_key"

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
│   └── schema.prisma          # Relational PostgreSQL schema with indexes
├── server/
│   ├── server.js              # Unified production HTTP + Next.js + Socket.IO server
│   └── socket-server.js       # Standalone WebSocket signaling server
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes (auth, code runner, student, company, institution)
│   │   ├── auth/              # Unified login (Student, Company, Institution) with Login Shield
│   │   ├── student/           # Student portal (Resume Analyzer, Mock Interview, Coding Judge, Roadmap)
│   │   ├── company/           # Recruiter portal (Dashboard, Candidates, Live Coding Judge Rooms)
│   │   ├── institution/       # College Admin portal (Analytics, Resource Sharing, Documents)
│   │   └── page.tsx           # Interactive landing page with dynamic UI showcase
│   ├── components/            # UI components (LoginSecurityChallenge, Monaco Editor, Sidebars)
│   ├── lib/                   # clientDevice, loginRiskEngine, loginOtpService, emailService, prisma
│   └── types/                 # Shared TypeScript interfaces
├── public/                    # Static assets & illustrations
└── package.json
```

---

## 🚢 Deployment (Railway)

PlaceIQ is optimized for zero-configuration container deployment on **Railway**:

1. **Link GitHub Repository** to Railway.
2. In **Railway Service Settings**:
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start` *(or `node server/server.js`)*
   * **Port:** Set to `8080` (or leave default `$PORT`)
3. Add your **Environment Variables** in Railway's **Variables** tab.
4. Add your **Custom Domain** (`www.placeiq.site`) and configure CNAME and TXT records in your DNS registrar.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for students, universities, and companies aiming for career excellence.</sub>
</div>
