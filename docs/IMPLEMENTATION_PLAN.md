# Demo Expansion Implementation Plan

## 1. Objective

This document outlines how to evolve the current Demo platform into a fuller institutional career and placement ecosystem that covers the features shown in the requested verification matrix:

- Resource sharing (infrastructure, trainers)
- Trainer management
- Internship portal
- Certification tracking
- Placement management
- Analytics dashboard

The current app already has strong foundations in:

- student/company dashboards
- AI-assisted mock interviews
- resume analysis
- skill-gap analysis
- coding judge flows
- Groq/Vapi-based AI interaction

The missing work is primarily around institutional coordination, persistent resource management, workflow automation, and analytics/reporting.

---

## 2. Current Platform Assessment

### What already exists

The codebase already contains:

- Student and company role-based flows
- AI interview and behavioral assessment workflows
- Career-related dashboards
- Job matching and resources APIs
- Resume extraction and analysis
- Skills and roadmap logic
- Socket-based real-time collaboration for coding interviews

### What is still missing

The following institutional features are either absent or only partially implemented:

1. Shared resource infrastructure
   - no institution-wide shared inventory
   - no trainer/resource booking model
   - no real multi-institution collaboration layer

2. Trainer management
   - no trainer profiles, availability, and scheduling engine
   - no trainer performance tracking

3. Internship portal
   - no dedicated internship posting workflow
   - no internship application lifecycle management

4. Certification tracking
   - no student certificate registry and verification workflow
   - no institution-approved credential posting

5. Placement management
   - no institution dashboard for placement outcomes
   - no end-to-end placement tracking workflow

6. Analytics dashboard
   - no unified institutional analytics layer across placements, outcomes, performance, and resource usage

---

## 3. Target Product Vision

Demo should evolve from a student-to-company career assistant into an institutional career intelligence platform that supports:

- students
- trainers/faculty
- placement teams
- companies/recruiters
- institution admins

The final platform should support a full lifecycle:

1. Student profile and skill visibility
2. Learning and mock interview preparation
3. Internship and placement opportunities
4. Certification and achievement tracking
5. Institution-level coordination and reporting
6. Dashboarding for outcomes and resource utilization

---

## 4. Core Functional Modules to Add

## 4.1 Resource Sharing and Infrastructure Layer

### Goal
Create an institution resource-sharing model where training labs, interview rooms, AI tools, mentors, and materials can be pooled and tracked.

### What is needed

- Resource catalog
- Resource owner/manager roles
- Allocation and booking system
- Availability calendar
- Resource utilization analytics

### Suggested entities

- `resources`
  - id
  - name
  - type
  - owner_id
  - institution_id
  - location
  - status
  - capacity
  - created_at

- `resource_bookings`
  - id
  - resource_id
  - booked_by_user_id
  - purpose
  - start_time
  - end_time
  - status

- `resource_access`
  - id
  - resource_id
  - user_id
  - permission_level

### Backend work

Add new route groups such as:

- `/api/resources`
- `/api/resources/[id]`
- `/api/resource-bookings`
- `/api/resource-availability`

### UI work

- institution admin resource dashboard
- trainer/student booking UI
- resource status cards
- calendar view and utilization charts

---

## 4.2 Trainer Management

### Goal
Allow institutions to manage trainer profiles, specialties, availability, assignments, and performance outcomes.

### What is needed

- trainer profile creation
- onboarding and verification
- skill tagging
- scheduled sessions
- feedback and ratings
- trainer assignment to student cohorts

### Suggested entities

- `trainers`
  - id
  - name
  - email
  - institution_id
  - expertise_tags
  - rating
  - status

- `trainer_sessions`
  - id
  - trainer_id
  - student_id
  - session_type
  - scheduled_at
  - status
  - notes

- `trainer_assignments`
  - id
  - trainer_id
  - cohort_id
  - role

### Backend work

Create APIs for:

- trainer listing and search
- session scheduling
- trainer assignment management
- session feedback collection

### UI work

- trainer directory
- trainer calendar
- profile page
- student-to-trainer mapping

---

## 4.3 Internship Portal

### Goal
Provide a dedicated internship portal where institutions can publish opportunities and students can discover and apply to them.

### What is needed

- internship posting management
- student applications
- application status workflow
- shortlist and interview coordination
- employer/institution visibility

### Suggested entities

- `internships`
  - id
  - company_id
  - title
  - description
  - location
  - stipend
  - duration
  - deadline
  - status

- `internship_applications`
  - id
  - internship_id
  - student_id
  - status
  - resume_url
  - cover_letter_url
  - applied_at

### Workflow

1. Company or institution admin creates internship
2. Students browse and apply
3. Institution placement team reviews shortlist
4. Interview or screening occurs
5. Final status is updated

### Backend/API work

Add routes such as:

- `/api/internships`
- `/api/internships/[id]`
- `/api/internship-applications`
- `/api/internship-applications/[id]`

### UI work

- internship list page
- detail page
- application form
- application tracking dashboard

---

## 4.4 Certification Tracking

### Goal
Track institutional and external certifications earned by students, with validation and badge visibility.

### What is needed

- certificate catalog
- upload and verification
- status tracking
- expiry reminders
- public verification tokens

### Suggested entities

- `certifications`
  - id
  - student_id
  - name
  - provider
  - issue_date
  - expiry_date
  - credential_url
  - verified

- `certificate_verifications`
  - id
  - certification_id
  - verifier_id
  - verification_status
  - verified_at

### Backend work

- upload certificate file or metadata
- verify and mark valid/invalid
- make certification badge available in student profile

### UI work

- student profile certification section
- admin verification view
- downloadable verified certificate view

---

## 4.5 Placement Management

### Goal
Give institutions a placement operations dashboard so they can manage placement outcomes and track student progress end-to-end.

### What is needed

- candidate pipeline management
- company interaction tracking
- placement offer record
- outcome analytics
- placement status stage transitions

### Suggested entities

- `placements`
  - id
  - student_id
  - company_id
  - role
  - stage
  - offer_status
  - placement_date
  - notes

- `placement_events`
  - id
  - placement_id
  - event_type
  - event_date
  - created_by
  - description

### Workflow

- student added to placement pipeline
- interview rounds tracked
- final offer recorded
- institutional dashboard reports on outcome metrics

### UI work

- placement dashboard for institution admin
- candidate pipeline board
- recruitment stage view
- student placement status page

---

## 4.6 Analytics Dashboard

### Goal
Provide a single analytics layer for institutional and student outcomes.

### What is needed

- dashboard data aggregation
- KPI cards
- charting and filtering
- student, company, trainer, and placement reporting

### Core KPIs

- total students active
- mock interview completion rate
- skill-score improvement rate
- internship application rate
- placement conversion rate
- trainer utilization rate
- resource utilization rate
- certification completion rate

### Suggested dashboard sections

- Institutional overview
- Student performance analytics
- Placement funnel analytics
- Resource usage analytics
- Trainer engagement analytics
- Company engagement analytics

### Tech stack suggestion

Use a server-side analytics endpoint plus charting components already in the repo:

- `recharts`
- database aggregation queries
- route-level API endpoints for dashboard data

---

## 5. Recommended Data Architecture

The current repo appears to use SQLite via `better-sqlite3` in the backend layer. That is acceptable for MVP and local development, but institutional scale will require formal schema discipline.

### Recommended tables

Add the following normalized tables:

- `institutions`
- `roles`
- `users`
- `students`
- `companies`
- `trainers`
- `cohorts`
- `resources`
- `resource_bookings`
- `internships`
- `internship_applications`
- `certifications`
- `placements`
- `analytics_events`

### Recommended relational model

- `users` is the shared identity table
- `students`, `companies`, `trainers`, and `admins` extend user identity
- `institutions` are a top-level dimension
- placement, internship, and certification records reference both `student_id` and `institution_id`

---

## 6. Backend Changes Required

### New API families

- `/api/institutions`
- `/api/trainers`
- `/api/resources`
- `/api/internships`
- `/api/certifications`
- `/api/placements`
- `/api/analytics`

### Important backend requirements

- role-based authorization
- institution-level scoping
- audit logs for admin actions
- status workflows for each domain
- notification triggers on key workflow events

### Suggested server-side patterns

Use the existing Next.js route structure and add:

- server actions for admin changes
- route handlers for list/create/update/delete operations
- server-side validation with `zod`
- centralized error responses

---

## 7. Frontend Changes Required

### New pages/components needed

- institution admin dashboard
- resource booking page
- trainer management page
- internship management page
- placement management page
- certificate verification dashboard
- analytics dashboard

### Shared UX patterns

Use consistent patterns already present in the app:

- sidebars for role-based navigation
- cards and metric blocks
- list/detail views
- forms with validation
- status badges and workflow steps

---

## 8. Integration Requirements

### AI and workflow services already used

- Vapi for voice interviews
- Groq for LLM-driven summaries and assessments
- LinkedIn jobs API integration for job discovery
- PDF/resume analysis

### New integrations likely needed

- email or notification service
- file storage for CVs, certificates, and documents
- calendar API for trainer/resource booking
- analytics/BI export service

### Suggested environment variables

Add the following to the environment layer:

- `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
- `NEXT_PUBLIC_APP_URL`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `S3_BUCKET_NAME`
- `S3_REGION`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

---

## 9. Security and Compliance Needs

### Must-have controls

- role-based access control
- institution data isolation
- signed upload endpoints for resumes and certificates
- audit logging for placement and certification updates
- encrypted transmission for all user-sensitive uploads

### Data privacy considerations

- store only necessary student data
- mask sensitive internal logs
- permit admin-only access to verification workflows

---

## 10. MVP Delivery Sequence

## Phase 1: Foundation

- institution role and admin dashboard
- base database schema for institutions, users, and resources
- permissions and audit layer

## Phase 2: Resource and trainer operations

- resource catalog and booking flows
- trainer profile and scheduling management

## Phase 3: Internships and certifications

- internship management portal
- certification upload and verification workflow

## Phase 4: Placement management

- placement pipeline board
- offer tracking and status changes

## Phase 5: Analytics

- institution KPI dashboards
- cohort and resource reporting
- placement funnel analytics

---

## 11. Suggested Team Responsibilities

### Frontend

- dashboard pages
- role-based navigation
- forms and data tables
- charts and analytics UI

### Backend

- route handlers
- database schemas
- workflow APIs
- permission enforcement

### Product/Operations

- placement workflow definition
- certification and internship business rules
- onboarding criteria for institutions and trainers

### QA

- role-based access testing
- workflow regression testing
- analytics validation
- file upload and verification testing

---

## 12. Minimum Dependencies Needed

To implement the full feature set, the project will need:

1. a more formal database schema design
2. role-aware backend permissions
3. a file-storage layer for documents
4. a notification/email system
5. institutional dashboard analytics APIs
6. deployment and admin tooling for institution-level management

---

## 13. Recommended Implementation Strategy

### Best approach

Use the current app as the MVP foundation and extend it in a modular, domain-based way.

### Suggested modular structure

- `student` module
- `company` module
- `institution-admin` module
- `trainer` module
- `placement` module
- `analytics` module
- `resources` module
- `certification` module

This keeps the platform maintainable instead of trying to bolt every feature into a single dashboard.

---

## 14. Success Criteria

The feature set can be considered complete only when all of the following are true:

- institutions can manage resources and trainer assignments
- students can see and apply to internships
- certifications can be uploaded and verified
- placement outcomes are tracked in a pipeline
- trainers and placement teams can access role-specific dashboards
- institution admins can view analytics and report outcomes

---

## 15. Final Recommendation

The fastest practical route is to implement this in 3 layered milestones:

1. core platform foundation
2. institutional operations modules
3. analytics and reporting layer

This keeps the work realistic while aligning with the capabilities already present in the app.
