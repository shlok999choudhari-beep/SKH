import { redirect } from 'next/navigation'

export default function StudentSignupPage() {
  redirect('/auth/signup?role=student')
}
