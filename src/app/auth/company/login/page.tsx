import { redirect } from 'next/navigation'

export default function CompanyLoginPage() {
  redirect('/auth/login?role=company')
}
