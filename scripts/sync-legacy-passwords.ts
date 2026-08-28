import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function syncPasswords() {
  console.log('🔄 Starting legacy password synchronization...')

  // 1. Students
  const students = await prisma.student.findMany({
    select: { id: true, email: true, name: true, password: true }
  })

  let upgradedStudents = 0
  for (const s of students) {
    if (!s.password.startsWith('$2a$') && !s.password.startsWith('$2b$') && !s.password.startsWith('$2y$')) {
      const hashed = await bcrypt.hash(s.password, 12)
      await prisma.student.update({
        where: { id: s.id },
        data: { password: hashed }
      })
      console.log(`✓ Upgraded password for student: ${s.email} (${s.name})`)
      upgradedStudents++
    }
  }

  // 2. Companies
  const companies = await prisma.company.findMany({
    select: { id: true, email: true, companyName: true, password: true }
  })

  let upgradedCompanies = 0
  for (const c of companies) {
    if (!c.password.startsWith('$2a$') && !c.password.startsWith('$2b$') && !c.password.startsWith('$2y$')) {
      const hashed = await bcrypt.hash(c.password, 12)
      await prisma.company.update({
        where: { id: c.id },
        data: { password: hashed }
      })
      console.log(`✓ Upgraded password for company: ${c.email} (${c.companyName})`)
      upgradedCompanies++
    }
  }

  // 3. Users (Institution / Trainers / Admin)
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, password: true, role: true }
  })

  let upgradedUsers = 0
  for (const u of users) {
    if (!u.password.startsWith('$2a$') && !u.password.startsWith('$2b$') && !u.password.startsWith('$2y$')) {
      const hashed = await bcrypt.hash(u.password, 12)
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashed }
      })
      console.log(`✓ Upgraded password for user: ${u.email} (${u.name})`)
      upgradedUsers++
    }
  }

  console.log(`\n🎉 Synchronization complete:`)
  console.log(`- Students upgraded: ${upgradedStudents}/${students.length}`)
  console.log(`- Companies upgraded: ${upgradedCompanies}/${companies.length}`)
  console.log(`- Users/Admins upgraded: ${upgradedUsers}/${users.length}`)
}

syncPasswords()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
