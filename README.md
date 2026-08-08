# PlaceIQ

PlaceIQ is a Next.js full-stack platform with real-time WebSocket capabilities, Prisma PostgreSQL integration, AI-driven skill analysis, and role-based portals.

## Project Structure

```
├── docs/                      # Technical documentation & architecture specs
│   ├── BEHAVIORAL_ANALYSIS.md
│   ├── DASHBOARD_UPDATES.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── RESPONSIVE_LIGHTMODE_FIXES.md
├── server/                    # Standalone backend services
│   └── socket-server.js       # WebSockets / Real-time collaboration server
├── scripts/                   # Build, deployment, and utility scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── docker-push.sh
│   ├── start.sh
│   └── fix.js
├── prisma/                    # Prisma ORM schema & migrations
│   └── schema.prisma
├── src/                       # Application source code
│   ├── app/                   # Next.js App Router (Pages & API endpoints)
│   ├── components/            # UI components
│   ├── contexts/              # React Context Providers
│   ├── lib/                   # Backend services (DB, AI, Auth, Sessions)
│   └── types/                 # Shared TypeScript interfaces
├── public/                    # Static assets & file uploads
└── Dockerfile                 # Containerization configuration
```

## Getting Started

### Development

Run the frontend app and socket server concurrently:

```bash
npm run dev:all
```

Or run them individually:

```bash
# Next.js app on http://localhost:3000
npm run dev

# Socket.IO server on http://localhost:3001
npm run socket
```

### Production Build

```bash
npm run build
npm run start
```
