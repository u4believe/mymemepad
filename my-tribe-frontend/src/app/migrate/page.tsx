import { MigrationInterface } from '@/components/migration-interface'

export default function MigratePage() {
  return (
    <div className="hero-section">
      <div style={{ paddingTop: '100px' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card">
            <MigrationInterface />
          </div>
        </div>
      </div>
    </div>
  )
}