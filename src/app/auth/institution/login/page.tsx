import { redirect } from 'next/navigation'

export default function InstitutionLoginPage() {
  redirect('/auth/login?role=institution')
}
