import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const id = institutionId ? parseInt(institutionId, 10) : 1
    
    // Aggregates
    const studentsCount = await prisma.student.count({ where: { institutionId: id } })
    const drivesCount = await prisma.placementDrive.count({ where: { institutionId: id, status: "active" } })
    const internshipsCount = await prisma.internship.count({ where: { institutionId: id, status: "open" } })
    const trainersCount = await prisma.trainer.count({ where: { institutionId: id } })

    // Pipeline Data
    const drives = await prisma.placementDrive.findMany({
      where: { institutionId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        title: true,
        _count: { select: { applications: true } }
      }
    })
    
    const pipelineData = drives.map(d => ({
      name: d.title,
      applications: d._count.applications
    }))

    // Activity Timeline using Prisma raw query for date grouping
    const activityDataRaw = await prisma.$queryRaw<any[]>`
      SELECT DATE(a.applied_at) as date, CAST(COUNT(*) AS INTEGER) as count
      FROM placement_applications a
      JOIN placement_drives d ON a.drive_id = d.id
      WHERE d.institution_id = ${id}
      GROUP BY DATE(a.applied_at)
      ORDER BY DATE(a.applied_at) ASC
      LIMIT 14
    `

    // Prisma $queryRaw might return Date objects for the 'date' field in postgres
    const activityData = activityDataRaw.map(r => ({
      date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0],
      count: Number(r.count)
    }))

    return NextResponse.json({ 
      stats: {
        totalStudents: studentsCount || 0,
        activeDrives: drivesCount || 0,
        openInternships: internshipsCount || 0,
        totalTrainers: trainersCount || 0
      },
      pipelineData: pipelineData.length > 0 ? pipelineData : [
        { name: 'Drive A', applications: 0 },
        { name: 'Drive B', applications: 0 }
      ],
      activityData: activityData.length > 0 ? activityData : [
        { date: new Date().toISOString().split('T')[0], count: 0 }
      ]
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
