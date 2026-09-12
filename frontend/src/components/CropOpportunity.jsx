import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { analyzeCropOpportunity, getAllCropOpportunities } from '../utils/cropOpportunityEngine'
import './CropOpportunity.css'

export default function CropOpportunity() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [region, setRegion] = useState(user?.location || 'Tamil Nadu')
  const [quantity, setQuantity] = useState('1000')
  const [harvestPeriod, setHarvestPeriod] = useState('1-3 Months')
  const [expectedPrice, setExpectedPrice] = useState('')

  const [analysisResult, setAnalysisResult] = useState(() =>
    analyzeCropOpportunity({
      crop: 'Tomato',
      region: user?.location || 'Tamil Nadu',
      quantity: 1000,
      harvestPeriod: '1-3 Months',
      expectedPrice: null,
    })
  )

  const allOpportunities = useMemo(() => getAllCropOpportunities(), [])

  const handleAnalyze = (e) => {
    e.preventDefault()
    const result = analyzeCropOpportunity({
      crop: selectedCrop,
      region,
      quantity,
      harvestPeriod,
      expectedPrice: expectedPrice || null,
    })
    setAnalysisResult(result)
  }

  const handleListProduce = () => {
    if (user?.role === 'farmer') {
      navigate('/farmer-dashboard', { state: { prefillCrop: analysisResult.crop } })
    } else if (user) {
      navigate('/marketplace')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="crop-opp-page">
      {/* Header */}
      <div className="crop-opp-header">
        <span className="crop-opp-badge">Decision Support Intelligence</span>
        <h1>AI Crop Opportunity</h1>
        <p className="subtitle">Make smarter crop-planning decisions before you grow.</p>
      </div>

      {/* Main Grid: Form + Analysis Display */}
      <div className="crop-opp-main-grid">
        {/* Form Card */}
        <div className="crop-opp-form-card">
          <h2>🌾 Plan Your Crop</h2>
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label htmlFor="cropSelect">Select Crop</label>
              <select
                id="cropSelect"
                className="form-control"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                <option value="Tomato">Tomato</option>
                <option value="Banana">Banana</option>
                <option value="Onion">Onion</option>
                <option value="Carrot">Carrot</option>
                <option value="Paddy">Paddy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="regionInput">Region / Location</label>
              <input
                id="regionInput"
                type="text"
                className="form-control"
                placeholder="e.g. Dharmapuri, TN"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantityInput">Planned Quantity (kg)</label>
              <input
                id="quantityInput"
                type="number"
                min="100"
                step="100"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="periodSelect">Growing / Harvest Period</label>
              <select
                id="periodSelect"
                className="form-control"
                value={harvestPeriod}
                onChange={(e) => setHarvestPeriod(e.target.value)}
              >
                <option value="1-3 Months">1-3 Months (Short Season)</option>
                <option value="3-6 Months">3-6 Months (Medium Season)</option>
                <option value="6+ Months">6+ Months (Long Season)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priceInput">Optional Expected Price (₹/kg)</label>
              <input
                id="priceInput"
                type="number"
                min="1"
                step="1"
                className="form-control"
                placeholder={`Base approx: ₹${analysisResult.basePrice}`}
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-analyze">
              Analyze Crop Opportunity
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="crop-opp-results-card">
          <div className="results-top">
            <div className="crop-title-group">
              <h3>{analysisResult.crop} Analysis</h3>
              <span className="crop-region-badge">📍 {analysisResult.region}</span>
            </div>
            <div className="score-pill">
              <div className="score-num">{analysisResult.opportunityScore}</div>
              <div className="score-lbl">Opportunity Score</div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-label">Demand Outlook</div>
              <div className={`metric-val ${analysisResult.demandOutlook.toLowerCase()}`}>
                {analysisResult.demandOutlook}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Supply Pressure</div>
              <div className={`metric-val ${analysisResult.supplyPressure.toLowerCase()}`}>
                {analysisResult.supplyPressure}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Price Trend</div>
              <div className={`metric-val ${analysisResult.priceTrend.toLowerCase()}`}>
                {analysisResult.priceTrend === 'Rising' ? '📈 Rising' : analysisResult.priceTrend === 'Falling' ? '📉 Falling' : '➡️ Stable'}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Risk Level</div>
              <div className="metric-val">
                <span className={`risk-tag risk-${analysisResult.riskLevel.toLowerCase()}`}>
                  {analysisResult.riskLevel} Risk
                </span>
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Base Price</div>
              <div className="metric-val">₹{analysisResult.basePrice} / kg</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Projected Range</div>
              <div className="metric-val">{analysisResult.projectedPriceRange}</div>
            </div>
          </div>

          {analysisResult.oversupplyWarning && (
            <div className="oversupply-banner">
              <strong>⚠️ Oversupply Risk Notice:</strong>
              {analysisResult.oversupplyWarning}
            </div>
          )}

          <div className="recommendation-box">
            <h4>💡 Recommended Action</h4>
            <p>{analysisResult.recommendedAction}</p>
          </div>
        </div>
      </div>

      {/* Prominent "What If I Grow This?" Section */}
      <div className="what-if-section">
        <div className="what-if-header">
          <h2>"What If I Grow This?"</h2>
          <span className="what-if-badge">Scenario Simulator</span>
        </div>

        <div className="what-if-grid">
          <div className="what-if-item">
            <div className="lbl">Selected Crop</div>
            <div className="val">{analysisResult.crop}</div>
          </div>
          <div className="what-if-item">
            <div className="lbl">Expected Demand</div>
            <div className="val">{analysisResult.demandOutlook}</div>
          </div>
          <div className="what-if-item">
            <div className="lbl">Supply Pressure</div>
            <div className="val">{analysisResult.supplyPressure}</div>
          </div>
          <div className="what-if-item">
            <div className="lbl">Opportunity Score</div>
            <div className="val">{analysisResult.opportunityScore} / 100</div>
          </div>
        </div>

        <div className="what-if-summary">
          <div className="what-if-text">
            <strong>Outcome Projection:</strong> Planting <strong>{analysisResult.plannedQuantity.toLocaleString()} kg</strong> of <strong>{analysisResult.crop}</strong> in <strong>{analysisResult.region}</strong> carries a <strong>{analysisResult.riskLevel} Risk</strong> profile with <strong>{analysisResult.priceTrend} price trend</strong>.
          </div>
          <button type="button" className="btn-cta-marketplace" onClick={handleListProduce}>
            List this Crop on Marketplace →
          </button>
        </div>
      </div>

      {/* Comparison Section for All 5 Crops */}
      <div className="comparison-section">
        <h2>📊 Compare All 5 Crop Opportunities</h2>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Demand</th>
                <th>Supply Pressure</th>
                <th>Price Trend</th>
                <th>Opportunity Score</th>
                <th>Risk Level</th>
                <th>Suggested Action</th>
              </tr>
            </thead>
            <tbody>
              {allOpportunities.map((opp) => (
                <tr key={opp.crop} style={{ background: opp.crop === analysisResult.crop ? '#f0fdf4' : 'transparent' }}>
                  <td className="crop-name-cell">
                    {opp.crop === analysisResult.crop ? '👉 ' : ''}
                    {opp.crop}
                  </td>
                  <td>
                    <span className={`metric-val ${opp.demandOutlook.toLowerCase()}`}>
                      {opp.demandOutlook}
                    </span>
                  </td>
                  <td>
                    <span className={`metric-val ${opp.supplyPressure.toLowerCase()}`}>
                      {opp.supplyPressure}
                    </span>
                  </td>
                  <td>{opp.priceTrend}</td>
                  <td>
                    <strong>{opp.opportunityScore}</strong> / 100
                  </td>
                  <td>
                    <span className={`risk-tag risk-${opp.riskLevel.toLowerCase()}`}>
                      {opp.riskLevel}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#475569' }}>
                    {opp.recommendedAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-banner">
        ℹ️ <strong>Disclaimer:</strong> Prototype intelligence based on simulated market indicators. Forecasts are decision-support suggestions, not guaranteed prices or returns.
      </div>
    </div>
  )
}
