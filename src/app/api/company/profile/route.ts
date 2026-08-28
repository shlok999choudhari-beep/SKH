import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: session.userId },
      select: {
        id: true, companyName: true, email: true, industry: true, website: true,
        location: true, companySize: true, description: true, contactPerson: true,
        phone: true, createdAt: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Map to expected JSON format
    const mappedCompany = {
      ...company,
      company_name: company.companyName,
      company_size: company.companySize,
      contact_person: company.contactPerson,
      created_at: company.createdAt
    }

    return NextResponse.json(mappedCompany)
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // If password is being updated, verify current password
    if (data.currentPassword && data.newPassword) {
      const company = await prisma.company.findUnique({
        where: { id: session.userId },
        select: { password: true }
      })
      
      if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

      let validPassword = false
      if (company.password.startsWith('$2a$') || company.password.startsWith('$2b$') || company.password.startsWith('$2y$')) {
        try {
          validPassword = await bcrypt.compare(data.currentPassword, company.password)
        } catch {
          validPassword = false
        }
      }
      if (!validPassword && company.password === data.currentPassword) {
        validPassword = true
      }
      
      if (!validPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12)
      await prisma.company.update({
        where: { id: session.userId },
        data: { password: hashedPassword }
      })
    }

    // Update other fields
    await prisma.company.update({
      where: { id: session.userId },
      data: {
        companyName: data.company_name,
        industry: data.industry,
        website: data.website,
        location: data.location,
        companySize: data.company_size,
        description: data.description,
        contactPerson: data.contact_person,
        phone: data.phone
      }
    })

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
