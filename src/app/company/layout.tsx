import CompanySidebar from '@/components/CompanySidebar'
import styles from './dashboard.module.css'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.layout}>
      <CompanySidebar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
