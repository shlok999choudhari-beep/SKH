import CompanySidebar from '@/components/CompanySidebar'
import styles from './dashboard.module.css'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.layout} suppressHydrationWarning>
      <CompanySidebar />
      <div className={styles.content} suppressHydrationWarning>
        {children}
      </div>
    </div>
  )
}
