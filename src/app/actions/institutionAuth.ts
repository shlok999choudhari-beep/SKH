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
    email: (formData.get('email') as string)?.trim(),
    password: formData.get('password') as string,
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { name: { equals: email, mode: 'insensitive' } },
        { email: { startsWith: `${email}@`, mode: 'insensitive' } }
      ]
    },
    include: { institution: true }
  })

  if (!user) {
    return { errors: { email: ['No institution user found with this email or username'] } }
  }

  let passwordMatch = false
  const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')

  if (isBcrypt) {
    try {
      passwordMatch = await bcrypt.compare(password, user.password)
    } catch {
      passwordMatch = false
    }
  }

  if (!passwordMatch && user.password === password) {
    passwordMatch = true
  }

  if (!passwordMatch) {
    return { errors: { password: ['Incorrect password'] } }
  }

  let updatedPassword = user.password
  if (!isBcrypt) {
    updatedPassword = await bcrypt.hash(password, 12)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      updatedAt: new Date(),
      password: updatedPassword
    }
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
