import { TokenCreation } from '@/components/token-creation'

export default function CreatePage() {
  return (
    <div className="hero-section w-full">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-8" style={{ paddingTop: '100px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card">
            <TokenCreation />
          </div>
        </div>
      </div>
    </div>
  )
}