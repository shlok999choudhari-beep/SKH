'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

// ── Schemas ──────────────────────────────────────────
const SignupSchema = z.object({
  company_name: z.string().min(2, 'Company name required').trim(),
  email: z.string().email('Invalid email address').trim(),
  industry: z.string().optional(),
  contact_person: z.string().min(2, 'Contact person name required').trim(),
  website: z.string().optional(),
  location: z.string().optional(),
  company_size: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(1, 'Password is required'),
})

export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

// ── Signup ───────────────────────────────────────────
export async function companySignup(state: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    company_name: formData.get('company_name') as string,
    email: formData.get('email') as string,
    industry: formData.get('industry') as string,
    contact_person: formData.get('contact_person') as string,
    website: formData.get('website') as string,
    location: formData.get('location') as string,
    company_size: formData.get('company_size') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
  }

  const parsed = SignupSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { company_name, email, industry, contact_person, website, location, company_size, phone, password } = parsed.data

  const existing = await prisma.company.findUnique({
    where: { email }
  })
  if (existing) {
    return { errors: { email: ['A company with this email already exists'] } }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await prisma.company.create({
    data: {
      companyName: company_name,
      email,
      password: hashedPassword,
      industry: industry || null,
      website: website || null,
      location: location || null,
      companySize: company_size || null,
      contactPerson: contact_person,
      phone: phone || null
    }
  })

  const userId = result.id

  await createSession({ userId, role: 'company', email, name: company_name, expiresAt: new Date() })
  redirect('/company/dashboard')
}

// ── Login ────────────────────────────────────────────
export async function companyLogin(state: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { email, password } = parsed.data

  const company = await prisma.company.findUnique({
    where: { email }
  })

  if (!company) {
    return { errors: { email: ['No company account found with this email'] } }
  }

  const passwordMatch = await bcrypt.compare(password, company.password)
  if (!passwordMatch) {
    return { errors: { password: ['Incorrect password'] } }
  }

  await prisma.company.update({
    where: { id: company.id },
    data: { updatedAt: new Date() }
  })

  await createSession({ userId: company.id, role: 'company', email: company.email, name: company.companyName, expiresAt: new Date() })
  redirect('/company/dashboard')
}
