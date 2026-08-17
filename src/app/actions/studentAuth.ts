'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

// ── Schemas ──────────────────────────────────────────
const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  college: z.string().min(2, 'College name required').trim(),
  degree: z.string().min(2, 'Degree required').trim(),
  year: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(1, 'Password is required'),
})

// ── Types ────────────────────────────────────────────
export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

// ── Signup ───────────────────────────────────────────
export async function studentSignup(state: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    college: formData.get('college') as string,
    degree: formData.get('degree') as string,
    year: formData.get('year') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = SignupSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { name, email, college, degree, year, phone, password } = parsed.data

  // Check duplicate email
  const existing = await prisma.student.findUnique({
    where: { email }
  })
  if (existing) {
    return { errors: { email: ['An account with this email already exists'] } }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await prisma.student.create({
    data: {
      name,
      email,
      password: hashedPassword,
      college,
      degree,
      graduation_year: year ? parseInt(year) : null,
      phone: phone || null
    }
  })

  const userId = result.id

  await createSession({ userId, role: 'student', email, name, expiresAt: new Date() })
  redirect('/student/dashboard')
}

// ── Login ────────────────────────────────────────────
export async function studentLogin(state: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { email, password } = parsed.data

  const student = await prisma.student.findUnique({
    where: { email }
  })

  if (!student) {
    return { errors: { email: ['No account found with this email'] } }
  }

  const passwordMatch = await bcrypt.compare(password, student.password)
  if (!passwordMatch) {
    return { errors: { password: ['Incorrect password'] } }
  }

  // Update last login
  await prisma.student.update({
    where: { id: student.id },
    data: { updated_at: new Date() }
  })

  await createSession({ userId: student.id, role: 'student', email: student.email, name: student.name, expiresAt: new Date() })
  redirect('/student/dashboard')
}
