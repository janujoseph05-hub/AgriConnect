import { useEffect } from 'react'
import { getForecastCommodities, getForecastMarkets, getForecastModelInfo, predictMarketPrice } from '../services/api'
import React, { useState } from 'react'
import './MarketIntelligence.css'

const crops = [
  { name: 'Tomato', currentDemand: 'High', expectedDemand: 72, expectedSupply: 88, priceTrend: '+4.2%', score: 86, status: 'Oversupply Risk', tone: 'warning' },
  { name: 'Banana', currentDemand: 'High', expectedDemand: 94, expectedSupply: 58, priceTrend: '+8.6%', score: 91, status: 'Excellent Opportunity', tone: 'excellent' },
  { name: 'Onion', currentDemand: 'Moderate', expectedDemand: 68, expectedSupply: 74, priceTrend: '+1.1%', score: 61, status: 'Moderate', tone: 'moderate' },
  { name: 'Carrot', currentDemand: 'High', expectedDemand: 84, expectedSupply: 62, priceTrend: '+6.3%', score: 82, status: 'Good Opportunity', tone: 'good' },
  { name: 'Paddy', currentDemand: 'High', expectedDemand: 87, expectedSupply: 69, priceTrend: '+3.8%', score: 74, status: 'Good Opportunity', tone: 'good' },
]

const demandHistory = {
  Tomato: [54, 61, 67, 72, 76],
  Banana: [63, 69, 75, 84, 91],
  Onion: [70, 68, 73, 71, 68],
  Carrot: [49, 58, 66, 74, 82],
  Paddy: [74, 78, 80, 84, 87],
}

const years = ['2022', '2023', '2024', '2025', '2026']
const colors = { Tomato: '#277b52', Banana: '#b27a22', Onion: '#6c5687', Carrot: '#c3683c', Paddy: '#287287' }

const linePoints = (values) => values.map((value, index) => `${index * 25},${100 - value}`).join(' ')

function OverviewCard({ label, value, detail, tone }) {
  return <article className={`intelligence-overview-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function MarketIntelligence() {
  const [selectedCrop, setSelectedCrop] = useState('Banana')
  const [forecast, setForecast] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [forecastCrops, setForecastCrops] = useState([])
  const [forecastMarkets, setForecastMarkets] = useState([])
  const [forecastForm, setForecastForm] = useState({ commodity: '', market: '', days_ahead: 7 })
  const [forecastError, setForecastError] = useState('')

  useEffect(() => {
    Promise.all([getForecastModelInfo(), getForecastCommodities(), getForecastMarkets()]).then(([info, cropsResponse, marketsResponse]) => {
      setModelInfo(info)
      setForecastCrops(cropsResponse.commodities)
      setForecastMarkets(marketsResponse.markets)
      setForecastForm((current) => ({ ...current, commodity: cropsResponse.commodities[0] || '', market: marketsResponse.markets[0] || '' }))
    }).catch((error) => setForecastError(error.message))
  }, [])

  const runForecast = async (event) => {
    event.preventDefault()
    setForecastError('')
    try { setForecast(await predictMarketPrice({ ...forecastForm, days_ahead: Number(forecastForm.days_ahead) })) } catch (error) { setForecast(null); setForecastError(error.message) }
  }

  const selected = crops.find((crop) => crop.name === selectedCrop) || crops[0]
  const oversupplyCrop = crops.find((crop) => crop.expectedSupply > crop.expectedDemand) || crops[0]

  return (
    <div className="market-intelligence">
      <header className="intelligence-header">
        <div>
          <p className="intelligence-eyebrow"><span className="intelligence-eyebrow-mark">+</span> Decision support workspace</p>
          <h1>Market Intelligence</h1>
          <p className="intelligence-subtitle">AI-powered insights to help farmers make data-driven crop planning decisions.</p>
        </div>
        <span className="intelligence-demo-pill">Prototype market data</span>
      </header>

      <section className="intelligence-overview-grid" aria-label="Market overview">
        <OverviewCard label="High Demand Crops" value="04" detail="Strong projected demand" tone="green" />
        <OverviewCard label="Rising Price Trends" value="05" detail="Positive expected movement" tone="gold" />
        <OverviewCard label="Oversupply Risk" value="01" detail="Needs market monitoring" tone="orange" />
        <OverviewCard label="Best Crop Opportunity" value="Banana" detail="91 / 100 opportunity score" tone="blue" />
      </section>

      <section className="ai-forecast-panel" aria-labelledby="ai-forecast-title">
        <div className="ai-forecast-heading"><div><p className="intelligence-eyebrow">AI Market Forecast</p><h2 id="ai-forecast-title">Modal Price Forecast</h2><p>Real model output only. Demand is not directly observed in this dataset.</p></div><span className={`forecast-status ${modelInfo?.trained ? 'active' : 'waiting'}`}>{modelInfo?.trained ? 'ML Forecast Active' : 'Historical Data Required'}</span></div>
        <form className="ai-forecast-form" onSubmit={runForecast}><label>Crop<select value={forecastForm.commodity} onChange={(event) => setForecastForm({ ...forecastForm, commodity: event.target.value })} disabled={!forecastCrops.length}><option value="">No trained crops available</option>{forecastCrops.map((crop) => <option key={crop}>{crop}</option>)}</select></label><label>Market<select value={forecastForm.market} onChange={(event) => setForecastForm({ ...forecastForm, market: event.target.value })} disabled={!forecastMarkets.length}><option value="">No trained markets available</option>{forecastMarkets.map((market) => <option key={market}>{market}</option>)}</select></label><label>Days ahead<input type="number" min="1" max="90" value={forecastForm.days_ahead} onChange={(event) => setForecastForm({ ...forecastForm, days_ahead: event.target.value })} /></label><button className="logistics-primary-button" type="submit" disabled={!modelInfo?.trained}>Get Forecast</button></form>
        {forecastError && <div className="forecast-message error" role="alert">{forecastError}</div>}
        {forecast && <div className="forecast-result"><strong>₹{forecast.forecast_value}</strong><span>{forecast.days_ahead}-day modal price forecast · {forecast.model}</span></div>}
        {!forecast && !forecastError && <p className="forecast-coverage">{modelInfo?.message || 'Historical training data is required before a real forecast can be produced.'}</p>}
      </section>

      <section className="crop-analysis-section" aria-labelledby="crop-analysis-title">
        <div className="intelligence-section-heading"><div><p className="intelligence-eyebrow">Crop analysis</p><h2 id="crop-analysis-title">Compare Market Opportunities</h2></div><span className="intelligence-count">{crops.length} crops tracked</span></div>
        <div className="crop-analysis-table-wrap">
          <table className="crop-analysis-table">
            <thead><tr><th>Crop</th><th>Current demand</th><th>Expected demand</th><th>Expected supply</th><th>Price trend</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>{crops.map((crop) => <tr key={crop.name}><td><strong>{crop.name}</strong></td><td>{crop.currentDemand}</td><td><div className="mini-progress"><span style={{ width: `${crop.expectedDemand}%` }} /></div><b>{crop.expectedDemand}</b></td><td><div className="mini-progress supply"><span style={{ width: `${crop.expectedSupply}%` }} /></div><b>{crop.expectedSupply}</b></td><td className="positive-trend">↑ {crop.priceTrend}</td><td><strong className="table-score">{crop.score}/100</strong></td><td><span className={`opportunity-status ${crop.tone}`}>{crop.status}</span></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="intelligence-grid-two">
        <article className="intelligence-panel trend-panel">
          <div className="panel-heading"><div><p className="intelligence-eyebrow">Historical view</p><h2>Demand Trend</h2></div><span className="sample-label">SAMPLE / PROTOTYPE</span></div>
          <p className="panel-description">Indexed demo values only. No verified historical demand data is currently available.</p>
          <div className="chart-legend">{Object.keys(demandHistory).map((crop) => <button type="button" key={crop} onClick={() => setSelectedCrop(crop)} className={selectedCrop === crop ? 'selected' : ''}><i style={{ background: colors[crop] }} />{crop}</button>)}</div>
          <div className="line-chart" aria-label="Five-year sample demand trend chart">
            <div className="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img"><path d="M0 75H100M0 50H100M0 25H100" className="chart-grid-line" />{Object.entries(demandHistory).map(([crop, values]) => <polyline key={crop} points={linePoints(values)} fill="none" stroke={colors[crop]} strokeWidth={selectedCrop === crop ? 2.8 : 1.5} opacity={selectedCrop === crop ? 1 : .3} vectorEffect="non-scaling-stroke" />)}</svg>
            <div className="chart-x-labels">{years.map((year) => <span key={year}>{year}</span>)}</div>
          </div>
        </article>

        <article className="intelligence-panel supply-panel">
          <div className="panel-heading"><div><p className="intelligence-eyebrow">Market balance</p><h2>Supply vs Demand</h2></div><span className="sample-label">DEMO VALUES</span></div>
          <p className="panel-description">Expected 2026 market balance for each tracked crop.</p>
          <div className="balance-list">{crops.map((crop) => <div className="balance-row" key={crop.name}><div className="balance-label"><strong>{crop.name}</strong><small>D {crop.expectedDemand} · S {crop.expectedSupply}</small></div><div className="balance-bars"><span className="demand-bar" style={{ width: `${crop.expectedDemand}%` }} /><span className="supply-bar" style={{ width: `${crop.expectedSupply}%` }} /></div></div>)}</div>
          <div className="balance-legend"><span><i className="demand-dot" />Expected demand</span><span><i className="supply-dot" />Expected supply</span></div>
        </article>
      </section>

      <section className="price-score-grid">
        <article className="intelligence-panel price-panel"><div className="panel-heading"><div><p className="intelligence-eyebrow">Pricing outlook</p><h2>Price Trend</h2></div><span className="sample-label">PROTOTYPE DATA</span></div><div className="price-cards">{crops.slice(0, 4).map((crop) => <button type="button" className={`price-card ${selectedCrop === crop.name ? 'selected' : ''}`} onClick={() => setSelectedCrop(crop.name)} key={crop.name}><span>{crop.name}</span><strong>₹{crop.name === 'Banana' ? '42' : crop.name === 'Tomato' ? '38' : crop.name === 'Onion' ? '46' : '54'}</strong><small className="positive-trend">↑ {crop.priceTrend}</small></button>)}</div></article>
        <article className="intelligence-panel score-panel"><div className="panel-heading"><div><p className="intelligence-eyebrow">Decision support</p><h2>Opportunity Scores</h2></div><span className="sample-label">/ 100</span></div><div className="score-list">{[...crops].sort((a, b) => b.score - a.score).map((crop) => <div className="score-row" key={crop.name}><span>{crop.name}</span><div className="score-track"><i style={{ width: `${crop.score}%` }} /></div><strong>{crop.score}</strong></div>)}</div><p className="score-note">Score considers demand, expected supply, price trend and historical trend.</p></article>
      </section>

      <section className="recommendation-section"><div className="recommendation-copy"><p className="intelligence-eyebrow">What should I grow?</p><h2>Data points toward Banana</h2><p>High expected demand, relatively lower supply, and a positive price trend indicate a strong market opportunity.</p><span className="recommendation-note">This is an expected trend, not a guarantee of profitability.</span></div><div className="recommendation-metrics"><div><span>Demand outlook</span><strong>High</strong></div><div><span>Supply outlook</span><strong>Lower</strong></div><div><span>Price outlook</span><strong>Positive ↑</strong></div><div className="recommendation-score"><span>Opportunity score</span><strong>91<span>/100</span></strong></div></div></section>

      <section className="warning-card"><div className="warning-icon">!</div><div><p className="intelligence-eyebrow">Oversupply warning</p><h2>{oversupplyCrop.name}: monitor market conditions</h2><p>Expected supply is higher than projected demand. Consider monitoring market conditions before increasing cultivation.</p></div></section>

      <section className="forecasting-section"><div className="forecasting-icon">↗</div><div><div className="forecasting-title"><h2>AI Forecasting Engine</h2><span>Prototype</span></div><p>Historical market data will be processed using machine learning to forecast future demand, supply and price trends.</p></div></section>
    </div>
  )
}

export default MarketIntelligence
