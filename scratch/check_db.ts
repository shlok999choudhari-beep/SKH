import fs from 'fs'
import path from 'path'

// Read .env manually
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8')
  envText.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '')
      if (key && val && !process.env[key]) {
        process.env[key] = val
      }
    }
  })
}

import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    const trainers = await prisma.trainer.findMany({
      include: { user: true, institution: true }
    })
    console.log('Successfully queried trainers from PostgreSQL!')
    console.log('Trainers count:', trainers.length)
    console.log('Trainers data:', JSON.stringify(trainers, null, 2))
  } catch (err) {
    console.error('Error querying trainers:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
