'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email('Invalid email').trim(),
  password: z.string().min(1, 'Password is required'),
})

export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

export async function institutionLogin(state: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: { institution: true }
  })

  if (!user) {
    return { errors: { email: ['No institution user found with this email'] } }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return { errors: { password: ['Incorrect password'] } }
  }

  // Update user record if needed
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() }
  })

  // We set the role to 'institution-admin' for layout & permissions check
  await createSession({
    userId: user.id,
    role: 'institution-admin',
    email: user.email,
    name: user.name,
    expiresAt: new Date()
  })

  redirect('/institution/dashboard')
}
