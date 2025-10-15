import { PortfolioView } from '@/components/portfolio-view'

export default function PortfolioPage() {
  return (
    <div className="hero-section w-full">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-8" style={{ paddingTop: '100px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card">
            <PortfolioView />
          </div>
        </div>
      </div>
    </div>
  )
}