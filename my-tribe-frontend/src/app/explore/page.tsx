import { TokenDiscovery } from '@/components/token-discovery'

export default function ExplorePage() {
  return (
    <div className="hero-section">
      <div style={{ paddingTop: '100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card">
            <TokenDiscovery />
          </div>
        </div>
      </div>
    </div>
  )
}