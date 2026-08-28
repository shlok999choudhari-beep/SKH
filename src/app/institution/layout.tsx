import InstitutionSidebar from '@/components/InstitutionSidebar'
import styles from './institution.module.css'

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.layout} suppressHydrationWarning>
      <InstitutionSidebar />
      <div className={styles.content} suppressHydrationWarning>
        {children}
      </div>
    </div>
  )
}
