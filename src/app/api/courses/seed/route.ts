import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const existingCount = await prisma.course.count()
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Courses already exist', count: existingCount })
    }

    // 1. Create default categories
    const categoriesData = [
      { name: 'Full Stack Web Development', slug: 'full-stack-web', description: 'Frontend, backend, APIs, and modern web application development', icon: 'Code' },
      { name: 'Data Structures & Algorithms', slug: 'dsa-algorithms', description: 'Core problem solving, computational complexity, and interview patterns', icon: 'Binary' },
      { name: 'AI & Machine Learning', slug: 'ai-ml', description: 'Modern LLMs, neural architectures, PyTorch, and prompt engineering', icon: 'Brain' },
      { name: 'Cloud & DevOps Architecture', slug: 'cloud-devops', description: 'AWS, Docker, Kubernetes, CI/CD pipelines, and scalable infra', icon: 'Cloud' },
      { name: 'System Design & Distributed Systems', slug: 'system-design', description: 'Microservices, caching, database sharding, and high throughput systems', icon: 'Network' },
      { name: 'Soft Skills & Behavioral Mastery', slug: 'soft-skills', description: 'Leadership, interview communication, and corporate etiquette', icon: 'Users' }
    ]

    const categories: any = {}
    for (const cat of categoriesData) {
      const created = await prisma.courseCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat
      })
      categories[cat.slug] = created
    }

    // 2. Fetch or assign a trainer
    let firstTrainer = await prisma.trainer.findFirst({
      include: { user: true }
    })

    const sampleCourses = [
      {
        title: 'Full-Stack Next.js 15 & System Architecture Masterclass',
        slug: 'full-stack-nextjs-system-architecture',
        description: 'Comprehensive enterprise-grade full-stack engineering covering App Router, React Server Components, high-performance database design, caching patterns, and production deployments.',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['full-stack-web']?.id,
        trainerId: firstTrainer?.id || null,
        difficulty: 'Intermediate',
        estimatedDuration: '8 Weeks (36 Hours)',
        learningObjectives: JSON.stringify([
          'Architect full-stack applications with Next.js App Router and Server Actions',
          'Design resilient database schemas with PostgreSQL and Prisma ORM',
          'Implement JWT security, RBAC authorization, and session telemetry',
          'Deploy production workloads with zero-downtime CI/CD pipelines'
        ]),
        prerequisites: 'Foundational JavaScript/TypeScript and basic React knowledge.',
        status: 'published',
        modules: [
          {
            title: 'Module 1: Foundations of Modern Web Engineering',
            description: 'Introduction to full-stack paradigms, server/client boundaries, and modern frontend engines.',
            orderIndex: 0,
            lessons: [
              {
                title: 'Lesson 1.1: Next.js App Router & Hybrid Rendering Architecture',
                description: 'Deconstructing React Server Components (RSC), Client Components, and Streaming SSR.',
                duration: '25 mins',
                orderIndex: 0,
                content: '# Next.js Hybrid Architecture\n\nIn modern web engineering, understanding the split between Server Components and Client Components is critical.\n\n### Key Concepts:\n- **Server Components:** Render strictly on the server; zero client JS bundle impact.\n- **Client Components:** Interactive islands using `use client`.\n- **Streaming SSR:** Stream rendered HTML chunks using Suspense boundaries.',
                videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk',
                resources: [
                  { title: 'Next.js 15 Architecture Handbook (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/nextjs-architecture-guide.pdf', fileSize: 2400000, orderIndex: 0 },
                  { title: 'Official Documentation & RFC References', type: 'EXTERNAL', url: 'https://nextjs.org/docs', orderIndex: 1 }
                ]
              },
              {
                title: 'Lesson 1.2: Database Modeling with PostgreSQL & Prisma',
                description: 'Best practices for schema design, migrations, indices, and avoiding N+1 queries.',
                duration: '35 mins',
                orderIndex: 1,
                content: '# PostgreSQL Schema Design\n\nLearn how to construct normalized relational schemas with appropriate index strategies and cascade policies.',
                videoUrl: 'https://www.youtube.com/watch?v=FMnlyiBag2k',
                resources: [
                  { title: 'Database Optimization Cheatsheet (Doc)', type: 'DOCUMENT', url: 'https://placeiq.site/docs/postgres-optimization.docx', fileSize: 850000, orderIndex: 0 }
                ]
              }
            ]
          },
          {
            title: 'Module 2: Enterprise Authentication & Threat Mitigation',
            description: 'Securing web applications with stateless JWTs, HTTP-only cookies, and rate-limiting defense.',
            orderIndex: 1,
            lessons: [
              {
                title: 'Lesson 2.1: Modern Auth & Session Tokens',
                description: 'Implementing high-assurance session verification with Jose JWT encryption.',
                duration: '30 mins',
                orderIndex: 0,
                content: '# Authentication & Token Security\n\nExplore symmetric and asymmetric cryptographic signatures, secure cookie flags, and cross-site scripting mitigation.',
                resources: [
                  { title: 'Authentication Security Spec (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/auth-security-spec.pdf', fileSize: 1800000, orderIndex: 0 }
                ]
              }
            ]
          },
          {
            title: 'Module 3: Production Deployment & Observability',
            description: 'Docker containerization, monitoring logs, and distributed tracing.',
            orderIndex: 2,
            lessons: [
              {
                title: 'Lesson 3.1: Containerization with Docker & Multi-stage Builds',
                description: 'Minimizing Docker image footprints and optimizing CI caching.',
                duration: '40 mins',
                orderIndex: 0,
                content: '# Multi-stage Docker Builds\n\nConstruct lean, production-ready container artifacts.',
                resources: [
                  { title: 'Docker Best Practices Reference', type: 'EXTERNAL', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', orderIndex: 0 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Data Structures, Algorithms & LeetCode Interview Mastery',
        slug: 'dsa-leetcode-interview-mastery',
        description: 'Master core algorithmic patterns, dynamic programming, graph traversal, and technical interview problem-solving with top FAANG/Tier-1 patterns.',
        thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc00e84b802?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['dsa-algorithms']?.id,
        trainerId: firstTrainer?.id || null,
        difficulty: 'Advanced',
        estimatedDuration: '10 Weeks (50 Hours)',
        learningObjectives: JSON.stringify([
          'Master Two Pointers, Sliding Window, Monotonic Stacks, and Trie algorithms',
          'Solve complex Tree and Graph algorithms (BFS, DFS, Dijkstra, TopoSort)',
          'Formulate Multi-Dimensional Dynamic Programming recurrence relations',
          'Ace FAANG/Tier-1 coding rounds and live technical whiteboard interviews'
        ]),
        prerequisites: 'Basic knowledge of Python, Java, or C++ syntax.',
        status: 'published',
        modules: [
          {
            title: 'Module 1: High-Yield Array & Pointer Patterns',
            description: 'Sliding window, fast & slow pointers, prefix sums, and two-pointer intervals.',
            orderIndex: 0,
            lessons: [
              {
                title: 'Lesson 1.1: Two Pointers & Two-Sum Variants',
                description: 'Optimizing O(N^2) brute forces down to O(N) linear scans.',
                duration: '20 mins',
                orderIndex: 0,
                content: '# Two Pointer Techniques\n\nMaster the standard opposite-ends two pointer scan and the sliding window window-size invariant.',
                resources: [
                  { title: 'Two Pointers Pattern Reference (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/dsa-two-pointers.pdf', fileSize: 1200000, orderIndex: 0 }
                ]
              },
              {
                title: 'Lesson 1.2: Sliding Window Algorithm Mastery',
                description: 'Fixed-size and dynamically expanding/contracting window problems.',
                duration: '30 mins',
                orderIndex: 1,
                content: '# Dynamic Sliding Window\n\nLearn how to track valid state frequencies using hash maps and character frequency tables.',
                resources: [
                  { title: 'Sliding Window Practice Sheet (Doc)', type: 'DOCUMENT', url: 'https://placeiq.site/docs/sliding-window-problems.docx', fileSize: 620000, orderIndex: 0 }
                ]
              }
            ]
          },
          {
            title: 'Module 2: Trees, Graphs & Dynamic Programming',
            description: 'Tree traversals, Union-Find disjoint sets, topological sorting, and 1D/2D memoization.',
            orderIndex: 1,
            lessons: [
              {
                title: 'Lesson 2.1: Graph Traversal — BFS, DFS & Cycle Detection',
                description: 'Detecting cycles in directed and undirected graphs, topological sorting via Kahn\'s algorithm.',
                duration: '45 mins',
                orderIndex: 0,
                content: '# Graph Theory in Technical Interviews\n\nAdjacency list representations, visited sets, recursion stack cycle checks, and topological ordering.',
                resources: [
                  { title: 'Graph Algorithms Guide (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/graph-algorithms.pdf', fileSize: 2100000, orderIndex: 0 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Applied AI & Generative LLM Engineering for Production',
        slug: 'applied-ai-llm-engineering',
        description: 'Build enterprise-grade AI systems with Retrieval-Augmented Generation (RAG), vector embeddings, function calling, agentic loops, and model evaluation.',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['ai-ml']?.id,
        trainerId: firstTrainer?.id || null,
        difficulty: 'Intermediate',
        estimatedDuration: '6 Weeks (28 Hours)',
        learningObjectives: JSON.stringify([
          'Understand Transformer tokenization, attention mechanisms, and context windows',
          'Build end-to-end RAG pipelines with semantic vector indexing and re-ranking',
          'Implement structured outputs, tool-calling agents, and hallucination guardrails',
          'Deploy AI apps with streaming responses and latency optimizations'
        ]),
        prerequisites: 'Python or JavaScript proficiency and familiarity with REST APIs.',
        status: 'published',
        modules: [
          {
            title: 'Module 1: Generative AI Foundations & Embeddings',
            description: 'Token mechanics, temperature, system prompts, and vector similarity metrics.',
            orderIndex: 0,
            lessons: [
              {
                title: 'Lesson 1.1: LLM Architecture & Structured Outputs',
                description: 'Zero-shot prompting, JSON mode schemas, and temperature control.',
                duration: '25 mins',
                orderIndex: 0,
                content: '# Structured LLM Prompting\n\nTechniques for eliciting strict JSON payloads from foundation models.',
                resources: [
                  { title: 'Prompt Engineering Cheatsheet (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/prompt-engineering.pdf', fileSize: 1500000, orderIndex: 0 }
                ]
              }
            ]
          },
          {
            title: 'Module 2: Retrieval-Augmented Generation (RAG)',
            description: 'Chunking strategies, embedding models, vector databases, and cosine similarity.',
            orderIndex: 1,
            lessons: [
              {
                title: 'Lesson 2.1: Semantic Search & Vector Databases',
                description: 'Setting up high-throughput vector indexes and context enrichment.',
                duration: '35 mins',
                orderIndex: 0,
                content: '# RAG Pipelines in Production\n\nOptimizing chunk sizes, semantic overlap, and hybrid vector/lexical retrieval.',
                resources: [
                  { title: 'RAG Architecture Blueprint (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/rag-blueprint.pdf', fileSize: 3200000, orderIndex: 0 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: 'Cloud Architecture & Microservices with AWS',
        slug: 'cloud-architecture-aws-microservices',
        description: 'Design highly available, fault-tolerant cloud architectures using AWS Lambda, ECS, SQS queues, API Gateways, and infrastructure-as-code.',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['cloud-devops']?.id,
        trainerId: firstTrainer?.id || null,
        difficulty: 'All Levels',
        estimatedDuration: '6 Weeks (24 Hours)',
        learningObjectives: JSON.stringify([
          'Design resilient cloud solutions using AWS Well-Architected Framework',
          'Deploy serverless microservices with AWS Lambda, API Gateway, and DynamoDB',
          'Implement event-driven asynchronous processing using SQS and SNS queues',
          'Secure cloud infrastructure using VPCs, security groups, and IAM policies'
        ]),
        prerequisites: 'Basic knowledge of web networking and command-line interfaces.',
        status: 'published',
        modules: [
          {
            title: 'Module 1: AWS Core Services & Networking',
            description: 'VPCs, subnets, route tables, IAM roles, and security groups.',
            orderIndex: 0,
            lessons: [
              {
                title: 'Lesson 1.1: Virtual Private Clouds (VPC) & Security Boundaries',
                description: 'Configuring private and public subnets with NAT gateways.',
                duration: '30 mins',
                orderIndex: 0,
                content: '# AWS VPC Architecture\n\nSegregating internal databases from public traffic with security groups and network ACLs.',
                resources: [
                  { title: 'AWS VPC Architecture Guide (PDF)', type: 'PDF', url: 'https://placeiq.site/docs/aws-vpc-guide.pdf', fileSize: 1900000, orderIndex: 0 }
                ]
              }
            ]
          }
        ]
      }
    ]

    for (const cData of sampleCourses) {
      const { modules, ...courseFields } = cData
      const course = await prisma.course.create({
        data: {
          ...courseFields,
          modules: {
            create: modules.map((m: any) => ({
              title: m.title,
              description: m.description,
              orderIndex: m.orderIndex,
              lessons: {
                create: m.lessons.map((l: any) => ({
                  title: l.title,
                  description: l.description,
                  duration: l.duration,
                  orderIndex: l.orderIndex,
                  content: l.content,
                  videoUrl: l.videoUrl || null,
                  resources: {
                    create: (l.resources || []).map((r: any) => ({
                      title: r.title,
                      type: r.type,
                      url: r.url,
                      fileSize: r.fileSize || null,
                      orderIndex: r.orderIndex
                    }))
                  }
                }))
              }
            }))
          }
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Seeded initial LMS courses successfully' })
  } catch (error: any) {
    console.error('Error seeding LMS courses:', error)
    return NextResponse.json({ error: 'Failed to seed courses', details: error.message }, { status: 500 })
  }
}
