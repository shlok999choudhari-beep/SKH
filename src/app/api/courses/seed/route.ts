import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 1. Create or ensure categories
    const categoriesData = [
      { name: 'Computer Science & Engineering', slug: 'cse', description: 'Core CS, algorithms, graphics, and system architectures', icon: 'Code' },
      { name: 'Humanities & Social Sciences', slug: 'humanities', description: 'Value education, ethics, and professional communication', icon: 'Users' },
      { name: 'Full Stack Web Development', slug: 'full-stack-web', description: 'Frontend, backend, APIs, and modern web engineering', icon: 'Layers' },
      { name: 'Data Structures & Algorithms', slug: 'dsa-algorithms', description: 'Problem solving, computational complexity, and interview patterns', icon: 'Binary' }
    ]

    const categories: Record<string, any> = {}
    for (const cat of categoriesData) {
      const created = await prisma.courseCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat
      })
      categories[cat.slug] = created
    }

    // 2. Fetch or create a default trainer user and profile
    let trainerUser = await prisma.user.findFirst({
      where: { email: 'rajesh.sharma@placeiq.internal' }
    })

    if (!trainerUser) {
      trainerUser = await prisma.user.create({
        data: {
          name: 'Prof. Rajesh Sharma',
          email: 'rajesh.sharma@placeiq.internal',
          password: 'password123',
          role: 'trainer',
          status: 'active'
        }
      })
    }

    let trainer = await prisma.trainer.findFirst({
      where: { userId: trainerUser.id }
    })

    if (!trainer) {
      // Find an institution or fallback
      let inst = await prisma.institution.findFirst()
      if (!inst) {
        inst = await prisma.institution.create({
          data: {
            name: 'PlaceIQ Institute of Technology',
            domain: 'placeiq.internal',
            contactEmail: 'admin@placeiq.internal'
          }
        })
      }

      trainer = await prisma.trainer.create({
        data: {
          userId: trainerUser.id,
          institutionId: inst.id,
          expertiseTags: 'OpenGL, Computer Graphics, GPU Architecture, Shaders',
          subjects: 'Computer Graphics Lab, Computational Geometry',
          bio: 'Associate Professor with 12+ years of research and teaching experience in real-time computer graphics and GPU rendering pipelines.',
          rating: 4.9
        }
      })
    }

    // 3. Define the benchmark courses
    const collegeCourses = [
      {
        title: 'Computer Graphics Lab',
        shortName: 'CGL',
        slug: 'computer-graphics-lab',
        joinCode: 'CGL-7F42K9',
        academicYear: 'AY 2026-27',
        semester: 'Semester I',
        department: 'Department of Computer Engineering',
        description: 'Hands-on laboratory curriculum exploring 2D/3D rendering algorithms, OpenGL graphics pipeline, shader programming, polygon clipping, and geometric transformations.',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['cse']?.id,
        trainerId: trainer.id,
        difficulty: 'Intermediate',
        estimatedDuration: '14 Weeks (42 Hours)',
        learningObjectives: JSON.stringify([
          'Master OpenGL graphics rendering pipeline and shader architectures',
          'Implement fundamental 2D line and circle drawing algorithms (Bresenham, DDA)',
          'Apply 2D and 3D geometric matrix transformations and projections',
          'Implement Cohen-Sutherland and Sutherland-Hodgman polygon clipping algorithms'
        ]),
        prerequisites: 'Fundamental knowledge of C/C++ or Python and Linear Algebra (Matrix Transformations).',
        status: 'published',
        modules: [
          {
            title: 'General',
            description: 'Course administrative guides, syllabus, question papers, and software installation manuals.',
            orderIndex: 0,
            announcements: [
              {
                title: 'Welcome to Computer Graphics Lab (AY 2026-27)',
                content: 'Welcome students! Please ensure you have Visual Studio / CodeBlocks and freeglut/GLEW configured before the first practical session. Review the syllabus and installation manual attached below.',
                isPinned: true
              },
              {
                title: 'Lab Submission Guidelines & Grading Policy',
                content: 'All practical submissions must include: 1. Handwritten theory derivations as clear photos/PDF, 2. Well-commented program code, 3. Output screenshots demonstrating test cases.',
                isPinned: false
              }
            ],
            resources: [
              {
                title: 'Syllabus- Computer Graphics Lab',
                type: 'PDF',
                url: 'https://placeiq.site/docs/cgl-syllabus-2026.pdf',
                fileSize: 1850000,
                orderIndex: 0
              },
              {
                title: 'OpenGL Tutorial',
                type: 'PDF',
                url: 'https://placeiq.site/docs/opengl-programming-guide.pdf',
                fileSize: 3400000,
                orderIndex: 1
              },
              {
                title: 'OpenGL Installation Manual Link',
                type: 'EXTERNAL',
                url: 'https://www.opengl.org/documentation/install.html',
                orderIndex: 2
              },
              {
                title: 'Previous Year Question Papers',
                type: 'DOCUMENT',
                url: 'https://placeiq.site/docs/cgl-pyq-papers.docx',
                fileSize: 920000,
                orderIndex: 3
              },
              {
                title: 'Course Description & Reference Textbook',
                type: 'PDF',
                url: 'https://placeiq.site/docs/computer-graphics-hearn-baker.pdf',
                fileSize: 4200000,
                orderIndex: 4
              }
            ]
          },
          {
            title: 'Practical No 1',
            description: 'Introductory OpenGL program to draw basic 2D geometric primitives.',
            orderIndex: 1,
            assignments: [
              {
                title: 'Practical No. 1 : Develop a program to draw a triangle using OpenGL.',
                openedAt: new Date('2026-08-27T00:00:00.000Z'),
                dueDate: new Date('2026-09-07T00:00:00.000Z'),
                maxMarks: 10,
                description: '1. Add Handwritten Content as an Image in assignment.\n2. Include Program Code and Output Screenshots',
                allowedFileTypes: 'pdf,zip,png,jpg,cpp',
                submissionType: 'both',
                status: 'published'
              }
            ]
          },
          {
            title: 'Practical No. 2',
            description: 'Rasterization algorithms for line drawing.',
            orderIndex: 2,
            assignments: [
              {
                title: 'Practical No. 2 : Implement Bresenham\'s Line Generation Algorithm with slope cases.',
                openedAt: new Date('2026-09-08T00:00:00.000Z'),
                dueDate: new Date('2026-09-18T00:00:00.000Z'),
                maxMarks: 10,
                description: '1. Derive Bresenham decision parameter pk on handwritten sheets.\n2. Write OpenGL/C++ implementation for all 8 octants.\n3. Attach test cases and raster output screenshots.',
                allowedFileTypes: 'pdf,zip,png,jpg,cpp',
                submissionType: 'both',
                status: 'published'
              }
            ]
          },
          {
            title: 'Practical No. 3',
            description: '2D Transformations and Matrix Manipulations.',
            orderIndex: 3,
            assignments: [
              {
                title: 'Practical No. 3 : 2D Geometric Transformations (Translation, Scaling, Rotation about arbitrary point).',
                openedAt: new Date('2026-09-19T00:00:00.000Z'),
                dueDate: new Date('2026-09-30T00:00:00.000Z'),
                maxMarks: 10,
                description: '1. Include composite transformation matrix derivations.\n2. Interactive keyboard-driven transformation program.\n3. Output verification.',
                allowedFileTypes: 'pdf,zip,png,jpg,cpp',
                submissionType: 'both',
                status: 'published'
              }
            ]
          },
          {
            title: 'Practical No. 4',
            description: 'Clipping algorithms for viewport rendering.',
            orderIndex: 4,
            assignments: [
              {
                title: 'Practical No. 4 : Cohen-Sutherland Line Clipping Algorithm against rectangular window.',
                openedAt: new Date('2026-10-01T00:00:00.000Z'),
                dueDate: new Date('2026-10-12T00:00:00.000Z'),
                maxMarks: 10,
                description: '1. Implement 4-bit region outcode evaluation.\n2. Show before-clipping and after-clipping screenshots.\n3. Test with partially and fully clipped segments.',
                allowedFileTypes: 'pdf,zip,png,jpg,cpp',
                submissionType: 'both',
                status: 'published'
              }
            ]
          }
        ]
      },
      {
        title: 'Universal Human Values',
        shortName: 'UHV',
        slug: 'universal-human-values',
        joinCode: 'UHV-8X29M1',
        academicYear: 'AY 2026-27',
        semester: 'Semester I',
        department: 'Humanities & Social Sciences',
        description: 'Holistic curriculum on self-exploration, harmony in human relationships, professional ethics, society and value education for engineering graduates.',
        thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['humanities']?.id,
        trainerId: trainer.id,
        difficulty: 'Beginner',
        estimatedDuration: '10 Weeks (30 Hours)',
        learningObjectives: JSON.stringify([
          'Develop holistic perspective towards life, profession, and happiness',
          'Understand harmony at self, family, society, and nature levels',
          'Cultivate professional ethics and social responsibility'
        ]),
        prerequisites: 'Open mindset for introspective self-exploration.',
        status: 'published',
        modules: [
          {
            title: 'General',
            description: 'Course syllabus and introductory readings.',
            orderIndex: 0,
            announcements: [
              {
                title: 'Course Introduction & Discussion Schedule',
                content: 'Welcome to UHV. Please review the course syllabus and join weekly cohort dialogues on human values.',
                isPinned: true
              }
            ],
            resources: [
              {
                title: 'Syllabus - Universal Human Values',
                type: 'PDF',
                url: 'https://placeiq.site/docs/uhv-syllabus.pdf',
                fileSize: 1200000,
                orderIndex: 0
              },
              {
                title: 'Foundation Course in Human Values Textbook',
                type: 'PDF',
                url: 'https://placeiq.site/docs/uhv-foundation-textbook.pdf',
                fileSize: 3100000,
                orderIndex: 1
              }
            ]
          },
          {
            title: 'Module 1: Introduction to Value Education',
            description: 'Understanding self-exploration as the process for value education.',
            orderIndex: 1,
            assignments: [
              {
                title: 'Assignment 1: Reflection on Continuous Happiness & Prosperity',
                openedAt: new Date('2026-08-25T00:00:00.000Z'),
                dueDate: new Date('2026-09-10T00:00:00.000Z'),
                maxMarks: 10,
                description: 'Write a 500-word self-reflective essay analyzing physical facilities vs. relationship harmony in daily life.',
                allowedFileTypes: 'pdf,docx,txt',
                submissionType: 'both',
                status: 'published'
              }
            ]
          }
        ]
      },
      {
        title: 'Foundations of Computing',
        shortName: 'FC',
        slug: 'foundations-of-computing',
        joinCode: 'FC-4K91T7',
        academicYear: 'AY 2025-26',
        semester: 'Semester II',
        department: 'Department of Computer Engineering',
        description: 'Core fundamentals of computer systems, digital logic, binary computation, computational theory, and algorithm principles.',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        categoryId: categories['cse']?.id,
        trainerId: trainer.id,
        difficulty: 'Beginner',
        estimatedDuration: '12 Weeks (36 Hours)',
        learningObjectives: JSON.stringify([
          'Analyze Boolean algebra and digital logic circuits',
          'Understand computer memory hierarchy and instruction sets',
          'Model state machines and finite automata'
        ]),
        prerequisites: 'Basic high school mathematics and logic reasoning.',
        status: 'published',
        modules: [
          {
            title: 'General',
            description: 'Course resources and syllabus.',
            orderIndex: 0,
            resources: [
              {
                title: 'Syllabus - Foundations of Computing',
                type: 'PDF',
                url: 'https://placeiq.site/docs/fc-syllabus.pdf',
                fileSize: 1400000,
                orderIndex: 0
              }
            ]
          }
        ]
      }
    ]

    // 4. Create or update each course and its hierarchy
    for (const cData of collegeCourses) {
      let existingCourse = await prisma.course.findFirst({
        where: {
          OR: [
            { slug: cData.slug },
            { joinCode: cData.joinCode }
          ]
        }
      })

      if (existingCourse) {
        // Update course attributes
        await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            title: cData.title,
            shortName: cData.shortName,
            academicYear: cData.academicYear,
            semester: cData.semester,
            department: cData.department,
            joinCode: cData.joinCode,
            joinCodeEnabled: true,
            status: 'published',
            description: cData.description,
            thumbnail: cData.thumbnail
          }
        })
      } else {
        existingCourse = await prisma.course.create({
          data: {
            title: cData.title,
            shortName: cData.shortName,
            slug: cData.slug,
            joinCode: cData.joinCode,
            joinCodeEnabled: true,
            academicYear: cData.academicYear,
            semester: cData.semester,
            department: cData.department,
            description: cData.description,
            thumbnail: cData.thumbnail,
            categoryId: cData.categoryId,
            trainerId: cData.trainerId,
            difficulty: cData.difficulty,
            estimatedDuration: cData.estimatedDuration,
            learningObjectives: cData.learningObjectives,
            prerequisites: cData.prerequisites,
            status: cData.status
          }
        })
      }

      // Check modules count
      const existingModCount = await prisma.courseModule.count({
        where: { courseId: existingCourse.id }
      })

      if (existingModCount === 0 && cData.modules) {
        for (const modData of cData.modules) {
          const mod = await prisma.courseModule.create({
            data: {
              courseId: existingCourse.id,
              title: modData.title,
              description: modData.description,
              orderIndex: modData.orderIndex
            }
          })

          // Create resources
          if (modData.resources) {
            for (const res of modData.resources) {
              await prisma.courseResource.create({
                data: {
                  moduleId: mod.id,
                  title: res.title,
                  type: res.type,
                  url: res.url,
                  fileSize: res.fileSize || null,
                  orderIndex: res.orderIndex
                }
              })
            }
          }

          // Create announcements
          if (modData.announcements) {
            for (const ann of modData.announcements) {
              await prisma.courseAnnouncement.create({
                data: {
                  courseId: existingCourse.id,
                  moduleId: mod.id,
                  authorId: trainerUser.id,
                  trainerId: trainer.id,
                  title: ann.title,
                  content: ann.content,
                  isPinned: ann.isPinned,
                  status: 'published'
                }
              })
            }
          }

          // Create assignments
          if (modData.assignments) {
            for (const assign of modData.assignments) {
              await prisma.assignment.create({
                data: {
                  courseId: existingCourse.id,
                  moduleId: mod.id,
                  trainerId: trainer.id,
                  title: assign.title,
                  description: assign.description,
                  openedAt: assign.openedAt,
                  dueDate: assign.dueDate,
                  maxMarks: assign.maxMarks,
                  allowedFileTypes: assign.allowedFileTypes || 'pdf,zip,docx,png',
                  submissionType: assign.submissionType || 'both',
                  status: assign.status || 'published'
                }
              })
            }
          }
        }
      }
    }

    // 5. If a student is currently logged in or default student exists, auto-enroll them in Computer Graphics Lab
    const defaultStudent = await prisma.student.findFirst({
      where: { email: { in: ['student@placeiq.internal', 'soham@placeiq.internal'] } }
    }) || await prisma.student.findFirst()

    if (defaultStudent) {
      const cglCourse = await prisma.course.findFirst({
        where: { slug: 'computer-graphics-lab' }
      })

      if (cglCourse) {
        await prisma.courseEnrollment.upsert({
          where: {
            courseId_studentId: { courseId: cglCourse.id, studentId: defaultStudent.id }
          },
          update: {
            lastAccessedAt: new Date()
          },
          create: {
            courseId: cglCourse.id,
            studentId: defaultStudent.id,
            status: 'active',
            progressPercent: 35,
            enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastAccessedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'College LMS courses and practical curriculums seeded successfully.'
    })
  } catch (error: any) {
    console.error('Error seeding college courses:', error)
    return NextResponse.json({ error: 'Failed to seed courses', details: error.message }, { status: 500 })
  }
}
