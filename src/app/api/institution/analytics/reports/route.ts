import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionLmsAnalytics } from '@/lib/placementIntelligenceService'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const reportType = searchParams.get('reportType') || 'student_performance'

    const analytics = await getInstitutionLmsAnalytics({ institutionId: 1 })

    if (format === 'csv') {
      let csvContent = ''

      if (reportType === 'student_performance') {
        csvContent = 'Student ID,Name,Email,Degree,Risk Level,Average Score,Missed Tasks,Last Active\n'
        for (const s of analytics.atRiskStudents) {
          csvContent += `"${s.studentId}","${s.studentName}","${s.email}","${s.degree || 'N/A'}","${s.riskLevel}","${s.averageScore}%","${s.missedAssignmentsCount}","${s.lastActiveDaysAgo} days ago"\n`
        }
      } else if (reportType === 'course_performance') {
        csvContent = 'Course ID,Title,Difficulty,Enrollments,Completion Rate,Certificates Issued,Highest Drop-off Module\n'
        for (const c of analytics.coursePerformance) {
          csvContent += `"${c.courseId}","${c.title}","${c.difficulty}","${c.enrollments}","${c.completionRate}%","${c.certificatesIssued}","${c.highestDropOffModule}"\n`
        }
      } else {
        csvContent = 'Metric,Value\n'
        csvContent += `Total Students,${analytics.stats.totalStudents}\n`
        csvContent += `Active Courses,${analytics.stats.activeCourses}\n`
        csvContent += `Course Completion Rate,${analytics.stats.courseCompletionRate}%\n`
        csvContent += `Average Quiz Score,${analytics.stats.averageQuizScore}%\n`
        csvContent += `Placement Readiness,${analytics.stats.placementReadiness}%\n`
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="placeiq_${reportType}_report.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      reportType,
      data: analytics
    })
  } catch (error: any) {
    console.error('[API Reports Export Error]:', error)
    return NextResponse.json({ error: 'Failed to generate report', details: error.message }, { status: 500 })
  }
}
