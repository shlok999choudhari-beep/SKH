import StudentSidebar from '@/components/StudentSidebar'
import styles from './dashboard.module.css'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
