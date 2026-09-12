import React from 'react'
import { insights } from '../data/mockData'

const InsightCard = ({it}) => (
  <div className="insight-card">
    <div className="insight-head">
      <div className="crop-icon">{it.crop.charAt(0)}</div>
      <div>
        <div className="crop-name">{it.crop}</div>
        <div className="muted">Demo data</div>
      </div>
    </div>
    <div className="insight-body">
      <div>Demand: <strong>{it.demand}</strong></div>
      <div>Expected Supply: <strong>{it.expectedSupply}</strong></div>
      <div>Price Trend: <span className={`trend ${it.priceTrend}`}>{it.priceTrend === 'up' ? '↑' : it.priceTrend === 'down' ? '↓' : '→'}</span></div>
    </div>
    <div className="insight-footer">
      <div className="score">Opportunity {it.score}/100</div>
      <div className="spark" />
    </div>
  </div>
)

const Insights = () => {
  return (
    <section className="insights premium-insights" id="insights">
      <div className="insights-header">
        <h2>AI-Powered Market Intelligence</h2>
        <p className="muted">Demo/mock data to illustrate AI-driven market insights and opportunity scoring.</p>
      </div>
      <div className="insight-grid">
        {insights.map((it) => (
          <InsightCard key={it.crop} it={it} />
        ))}
      </div>
      <div className="insights-actions">
        <button className="btn btn-primary">Explore Market Insights →</button>
      </div>
    </section>
  )
}

export default Insights
