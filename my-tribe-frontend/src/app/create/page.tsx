import { TokenCreation } from '@/components/token-creation'

export default function CreatePage() {
  return (
    <div className="hero-section">
      <div style={{ paddingTop: '100px' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card">
            <TokenCreation />
          </div>
        </div>
      </div>
    </div>
  )
}