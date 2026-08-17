import { redirect } from 'next/navigation'

export default function CompanySignupPage() {
  redirect('/auth/signup?role=company')
}
