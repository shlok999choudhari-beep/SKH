import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const studentId = parseInt(id, 10)
    const session = await getSession(req)
    const body = await req.json()
    const { skillName, proficiencyPercent = 90, notes = 'Verified by Course Instructor' } = body

    if (!skillName?.trim()) {
      return NextResponse.json({ error: 'skillName is required' }, { status: 400 })
    }

    let trainerId: number | null = null
    if (session?.userId) {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const pct = Math.min(100, Math.max(0, parseInt(proficiencyPercent.toString(), 10)))
    const level = pct >= 90 ? 'Expert' : pct >= 75 ? 'Advanced' : pct >= 60 ? 'Intermediate' : 'Beginner'

    const profile = await prisma.skillProfile.upsert({
      where: {
        studentId_skillName: {
          studentId,
          skillName: skillName.trim()
        }
      },
      update: {
        proficiencyPercent: pct,
        level,
        verifiedStatus: 'TRAINER_VERIFIED',
        lastEvaluatedAt: new Date()
      },
      create: {
        studentId,
        skillName: skillName.trim(),
        proficiencyPercent: pct,
        level,
        verifiedStatus: 'TRAINER_VERIFIED'
      }
    })

    await prisma.skillEvidence.create({
      data: {
        skillProfileId: profile.id,
        studentId,
        sourceType: 'TRAINER_ENDORSEMENT',
        evidenceText: `Verified by Instructor: "${notes.trim()}" (Score: ${pct}%)`,
        confidenceScore: 1.0,
        verificationType: 'TRAINER_VERIFIED',
        trainerId
      }
    })

    return NextResponse.json({
      success: true,
      message: `Skill "${skillName}" successfully verified by trainer!`,
      profile
    })
  } catch (error: any) {
    console.error('[API Verify Skill Error]:', error)
    return NextResponse.json({ error: 'Failed to verify skill', details: error.message }, { status: 500 })
  }
}
