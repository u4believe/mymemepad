import { TradingInterface } from '@/components/trading-interface'

export default function TradePage() {
  return (
    <div className="hero-section">
      <div style={{ paddingTop: '100px' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card">
            <TradingInterface />
          </div>
        </div>
      </div>
    </div>
  )
}