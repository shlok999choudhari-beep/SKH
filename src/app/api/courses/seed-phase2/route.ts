import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    if (courses.length === 0) {
      return NextResponse.json({ error: 'No courses found. Please seed Phase 1 courses first.' }, { status: 400 })
    }

    const trainer = await prisma.trainer.findFirst()
    const trainerId = trainer?.id || null

    for (const course of courses) {
      const firstModule = course.modules[0]
      const secondModule = course.modules[1] || firstModule

      // --- 1. Seed Assignments ---
      let assignmentTitle = ''
      let assignmentDesc = ''
      let allowedTypes = 'pdf,zip,docx,png'

      if (course.slug.includes('nextjs')) {
        assignmentTitle = 'Hands-on Project: Implement Next.js 15 Streaming SSR & Server Actions Pipeline'
        assignmentDesc = `# Next.js 15 Streaming & Server Actions Assignment

## Objectives
1. Create a dynamic dashboard using Next.js 15 App Router.
2. Implement **React Server Components (RSC)** with granular \`<Suspense>\` boundaries for streaming data.
3. Build secure Server Actions with Zod schema validation and optimistic UI updates via \`useOptimistic\`.

## Submission Instructions
- Compress your project code as a \`.zip\` file OR upload an architectural implementation summary as a \`.pdf\`.
- Ensure all environment variable samples are documented in \`.env.example\`.`
      } else if (course.slug.includes('data-structures')) {
        assignmentTitle = 'System Coding Task: Implement an LRU Cache & Dijkstra Shortest Path'
        assignmentDesc = `# Data Structures & Algorithms Benchmark Project

## Problem Statement
1. Implement a thread-safe **LRU Cache** supporting $O(1)$ \`get\` and \`put\` operations using a Doubly Linked List and Hash Map.
2. Implement **Dijkstra's Algorithm** with a Min-Heap priority queue to find the shortest routing path in a directed weighted graph.

## Deliverables
- Submit your source code (.zip) or benchmark results report (.pdf).`
      } else if (course.slug.includes('ai-llm')) {
        assignmentTitle = 'Production Project: Hybrid Vector Search & Self-Correcting RAG System'
        assignmentDesc = `# Applied AI & LLM Systems: RAG Architecture

## Objectives
1. Implement a Retrieval-Augmented Generation (RAG) pipeline using chunked embeddings.
2. Implement hybrid search combining Dense vector similarity (Cosine) with Sparse keyword search (BM25).
3. Add hallucinations evaluation check using a secondary LLM judge.

## Deliverables
- Submit your project repository link or document submission (.pdf / .docx).`
      } else {
        assignmentTitle = 'Cloud Architecture Lab: Terraform AWS Multi-AZ VPC & Container Service'
        assignmentDesc = `# Cloud & DevOps Lab: Production VPC Setup

## Tasks
1. Write Terraform HCL configuration for a 3-tier VPC with public and private subnets across 2 Availability Zones.
2. Configure an Application Load Balancer (ALB) routing traffic to an ECS Fargate cluster with Auto-Scaling policies.

## Deliverables
- Submit your Terraform plan output or architecture diagram (.pdf / .png / .zip).`
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: { courseId: course.id, title: assignmentTitle }
      })

      if (!existingAssignment) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 14) // 14 days from now

        await prisma.assignment.create({
          data: {
            courseId: course.id,
            moduleId: firstModule ? firstModule.id : null,
            trainerId,
            title: assignmentTitle,
            description: assignmentDesc,
            dueDate,
            maxMarks: 100,
            allowedFileTypes: allowedTypes,
            maxFileSizeMb: 25,
            submissionType: 'file_upload',
            status: 'published',
            orderIndex: 1
          }
        })
      }

      // --- 2. Seed Quizzes ---
      let quizTitle = ''
      let quizDesc = ''
      let questionsData: any[] = []

      if (course.slug.includes('nextjs')) {
        quizTitle = 'Next.js 15 & Modern Web Architecture Assessment'
        quizDesc = 'Validate your understanding of Server Components, Streaming SSR, caching layers, and Server Actions.'
        questionsData = [
          {
            type: 'mcq',
            question: 'Which component type executes exclusively on the server and does not add client-side JavaScript bundle weight?',
            marks: 2,
            explanation: 'React Server Components (RSC) run only on the server, producing rendered HTML/JSON without bundling component code to the client.',
            options: [
              { optionText: 'React Server Component (RSC)', isCorrect: true },
              { optionText: 'Client Component ("use client")', isCorrect: false },
              { optionText: 'Traditional Hydrated Component', isCorrect: false },
              { optionText: 'Dynamic Client Boundary', isCorrect: false }
            ]
          },
          {
            type: 'multiple_select',
            question: 'Select all caching layers present in Next.js App Router architecture:',
            marks: 3,
            explanation: 'Next.js App Router includes Request Memoization, Data Cache, Full Route Cache, and Router Cache (client memory).',
            options: [
              { optionText: 'Request Memoization (React deduplication)', isCorrect: true },
              { optionText: 'Data Cache (Persistent server fetch cache)', isCorrect: true },
              { optionText: 'Full Route Cache (Static HTML/RSC payload on server)', isCorrect: true },
              { optionText: 'Browser Flash Storage Cache', isCorrect: false }
            ]
          },
          {
            type: 'true_false',
            question: 'Server Actions can be called directly inside inline forms without writing an explicit REST API route handler.',
            marks: 1,
            explanation: 'True. Next.js Server Actions allow asynchronous server-side functions to be invoked directly from JSX forms via the action attribute.',
            options: [
              { optionText: 'True', isCorrect: true },
              { optionText: 'False', isCorrect: false }
            ]
          },
          {
            type: 'mcq',
            question: 'What is the purpose of the \`<Suspense>\` component in streaming SSR?',
            marks: 2,
            explanation: 'Suspense boundaries allow Next.js to stream critical UI immediately while showing a fallback skeleton for slower asynchronous server operations.',
            options: [
              { optionText: 'It defines loading boundaries to stream chunks of UI progressively', isCorrect: true },
              { optionText: 'It halts all browser rendering until all database queries finish', isCorrect: false },
              { optionText: 'It encrypts local storage on the client browser', isCorrect: false },
              { optionText: 'It compresses static image assets', isCorrect: false }
            ]
          }
        ]
      } else if (course.slug.includes('data-structures')) {
        quizTitle = 'Algorithmic Complexity & Advanced Data Structures Quiz'
        quizDesc = 'Test your mastery of Big-O complexity, graphs, dynamic programming, and binary search trees.'
        questionsData = [
          {
            type: 'mcq',
            question: 'What is the average time complexity for lookup, insertion, and deletion in a balanced AVL tree?',
            marks: 2,
            explanation: 'Balanced BSTs maintain a height of O(log N), guaranteeing logarithmic time operations.',
            options: [
              { optionText: 'O(log N)', isCorrect: true },
              { optionText: 'O(N)', isCorrect: false },
              { optionText: 'O(1)', isCorrect: false },
              { optionText: 'O(N log N)', isCorrect: false }
            ]
          },
          {
            type: 'true_false',
            question: 'Dijkstra’s algorithm functions correctly on graphs containing negative edge weights.',
            marks: 1,
            explanation: 'False. Dijkstra’s algorithm assumes visited nodes have final shortest paths. Bellman-Ford or SPFA is required for graphs with negative weights.',
            options: [
              { optionText: 'True', isCorrect: false },
              { optionText: 'False', isCorrect: true }
            ]
          },
          {
            type: 'multiple_select',
            question: 'Which of the following problems can be solved optimally using Dynamic Programming?',
            marks: 3,
            explanation: '0/1 Knapsack, Longest Common Subsequence, and Matrix Chain Multiplication have optimal substructure and overlapping subproblems.',
            options: [
              { optionText: '0/1 Knapsack Problem', isCorrect: true },
              { optionText: 'Longest Common Subsequence (LCS)', isCorrect: true },
              { optionText: 'Matrix Chain Multiplication', isCorrect: true },
              { optionText: 'Random Shuffle Generator', isCorrect: false }
            ]
          },
          {
            type: 'mcq',
            question: 'In an LRU Cache, which combination of data structures provides O(1) get and put operations?',
            marks: 2,
            explanation: 'A Hash Map provides O(1) key lookups, and a Doubly Linked List provides O(1) node relocation and removal.',
            options: [
              { optionText: 'Hash Map + Doubly Linked List', isCorrect: true },
              { optionText: 'Array + Stack', isCorrect: false },
              { optionText: 'Binary Heap + Queue', isCorrect: false },
              { optionText: 'Singly Linked List + Trie', isCorrect: false }
            ]
          }
        ]
      } else if (course.slug.includes('ai-llm')) {
        quizTitle = 'Transformer & Large Language Model Architecture Evaluation'
        quizDesc = 'Evaluate your grasp of Self-Attention, Positional Encoding, Vector Quantization, and RAG.'
        questionsData = [
          {
            type: 'mcq',
            question: 'What is the computational complexity of standard Multi-Head Self-Attention with respect to sequence length N?',
            marks: 2,
            explanation: 'Standard Self-Attention computes dot-products between all pairs of N tokens, resulting in O(N^2) complexity.',
            options: [
              { optionText: 'O(N^2)', isCorrect: true },
              { optionText: 'O(N log N)', isCorrect: false },
              { optionText: 'O(N)', isCorrect: false },
              { optionText: 'O(1)', isCorrect: false }
            ]
          },
          {
            type: 'true_false',
            question: 'In a RAG system, dense embeddings capture semantic meaning while sparse BM25 search captures exact keyword matches.',
            marks: 1,
            explanation: 'True. Combining both in Hybrid Search yields superior recall and precision.',
            options: [
              { optionText: 'True', isCorrect: true },
              { optionText: 'False', isCorrect: false }
            ]
          },
          {
            type: 'multiple_select',
            question: 'Select all techniques used to mitigate LLM hallucinations in production systems:',
            marks: 3,
            explanation: 'Grounding via RAG, Constrained Decoding (JSON schema), and Guardrail evaluation models are proven techniques.',
            options: [
              { optionText: 'Grounding generation on retrieved context (RAG)', isCorrect: true },
              { optionText: 'Using Constrained JSON Decoding / Schema enforcement', isCorrect: true },
              { optionText: 'Implementing automated LLM guardrail judges', isCorrect: true },
              { optionText: 'Increasing generation temperature to 2.0', isCorrect: false }
            ]
          },
          {
            type: 'mcq',
            question: 'What does LoRA (Low-Rank Adaptation) modify during parameter-efficient fine-tuning?',
            marks: 2,
            explanation: 'LoRA freezes pre-trained model weights and injects trainable rank decomposition matrices into transformer layers.',
            options: [
              { optionText: 'It injects trainable low-rank decomposition matrices while freezing base weights', isCorrect: true },
              { optionText: 'It deletes 50% of the transformer layers', isCorrect: false },
              { optionText: 'It quantizes weights to 1-bit without training', isCorrect: false },
              { optionText: 'It retrains all model parameters from scratch', isCorrect: false }
            ]
          }
        ]
      } else {
        quizTitle = 'AWS Cloud Systems & Reliability Engineering Assessment'
        quizDesc = 'Validate understanding of High Availability, IAM Policies, VPC Routing, and Serverless Containers.'
        questionsData = [
          {
            type: 'mcq',
            question: 'Which AWS service provides managed container orchestration without having to provision or manage underlying EC2 instances?',
            marks: 2,
            explanation: 'AWS Fargate is a serverless compute engine for containers that works with ECS and EKS.',
            options: [
              { optionText: 'AWS Fargate', isCorrect: true },
              { optionText: 'Amazon EC2 M5 Instances', isCorrect: false },
              { optionText: 'AWS CloudFormation Template', isCorrect: false },
              { optionText: 'Amazon Lightsail', isCorrect: false }
            ]
          },
          {
            type: 'true_false',
            question: 'A Security Group in AWS VPC is stateful, meaning return traffic is automatically allowed regardless of inbound rules.',
            marks: 1,
            explanation: 'True. Security Groups are stateful. Network ACLs (NACLs) on the other hand are stateless.',
            options: [
              { optionText: 'True', isCorrect: true },
              { optionText: 'False', isCorrect: false }
            ]
          },
          {
            type: 'multiple_select',
            question: 'Which components are required for EC2 instances in a private subnet to securely download software updates from the internet?',
            marks: 3,
            explanation: 'A NAT Gateway in a public subnet with an Elastic IP and a route table entry (0.0.0.0/0 -> nat-gateway) allows outbound-only internet access.',
            options: [
              { optionText: 'NAT Gateway in a Public Subnet', isCorrect: true },
              { optionText: 'Internet Gateway attached to the VPC', isCorrect: true },
              { optionText: 'Route Table pointing 0.0.0.0/0 to the NAT Gateway', isCorrect: true },
              { optionText: 'Direct Public IP assigned to private EC2 instances', isCorrect: false }
            ]
          },
          {
            type: 'mcq',
            question: 'What is the primary benefit of deploying an Application Load Balancer (ALB) across multiple Availability Zones (Multi-AZ)?',
            marks: 2,
            explanation: 'Multi-AZ distribution prevents single point of failure in data centers and ensures high availability.',
            options: [
              { optionText: 'Fault tolerance and high availability across physical data center failures', isCorrect: true },
              { optionText: 'Automatic database normalization', isCorrect: false },
              { optionText: 'Zero-cost compute hosting', isCorrect: false },
              { optionText: 'Replaces DNS resolution entirely', isCorrect: false }
            ]
          }
        ]
      }

      // Check if quiz already exists
      const existingQuiz = await prisma.quiz.findFirst({
        where: { courseId: course.id, title: quizTitle }
      })

      if (!existingQuiz) {
        const createdQuiz = await prisma.quiz.create({
          data: {
            courseId: course.id,
            moduleId: secondModule ? secondModule.id : null,
            trainerId,
            title: quizTitle,
            description: quizDesc,
            timeLimit: 15,
            maxAttempts: 3,
            passingScore: 60,
            randomizeQuestions: false,
            showResultsAfter: true,
            status: 'published',
            orderIndex: 2
          }
        })

        // Create questions & options
        for (let qIdx = 0; qIdx < questionsData.length; qIdx++) {
          const q = questionsData[qIdx]
          await prisma.quizQuestion.create({
            data: {
              quizId: createdQuiz.id,
              type: q.type,
              question: q.question,
              marks: q.marks,
              explanation: q.explanation,
              orderIndex: qIdx,
              options: {
                create: q.options.map((opt: any, optIdx: number) => ({
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                  orderIndex: optIdx
                }))
              }
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seeded Phase 2 Assignments and Quizzes successfully!'
    })
  } catch (err: any) {
    console.error('Error seeding Phase 2 assessments:', err)
    return NextResponse.json({ error: 'Failed to seed Phase 2 assessments', details: err.message }, { status: 500 })
  }
}
