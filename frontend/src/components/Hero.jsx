import React from 'react'
import { useNavigate } from 'react-router-dom'
import { insights } from '../data/mockData'

const Stat = ({title, value}) => (
  <div className="stat">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
  </div>
)

const DashboardCard = ({crop, demand, supply, trend, score}) => (
  <div className="dash-card">
    <div className="dash-card-head">
      <div className="crop-icon">{crop.charAt(0)}</div>
      <div>
        <div className="crop-name">{crop}</div>
        <div className="crop-meta">Demand: {demand} • Supply: {supply}</div>
      </div>
    </div>
    <div className="dash-card-body">
      <div className={`trend ${trend}`}>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</div>
      <div className="score">{score}</div>
    </div>
  </div>
)

const Hero = () => {
  const navigate = useNavigate()

  return (
    <section id="home" className="hero-section premium">
      <div className="hero-content premium-grid">
        <div className="hero-text">
          <div className="badge">AI-Powered Agricultural Marketplace</div>
          <h1>Connect Farmers Directly. Grow Smarter.</h1>
          <p className="lead">AgriConnect connects farmers directly with buyers and uses market intelligence to help farmers make smarter crop-planning decisions.</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => navigate('/farmer-dashboard')}>I'm a Farmer</button>
            <button className="btn btn-outline" onClick={() => navigate('/marketplace')}>I'm a Buyer</button>
          </div>

          <div className="trust-row">
            <Stat title="Direct Connections" value="1,200+" />
            <Stat title="Market Insights" value="Demo Data" />
            <Stat title="Smarter Planning" value="Beta" />
          </div>
        </div>

        <div className="hero-visual dashboard">
          <div className="dashboard-top">
            <div className="mini-card">Supply Index <strong>72%</strong></div>
            <div className="mini-card">Demand Index <strong>81%</strong></div>
            <div className="mini-card">AI Score <strong>84</strong></div>
          </div>

          <div className="dashboard-cards">
            {insights.map((it) => (
              <DashboardCard key={it.crop} crop={it.crop} demand={it.demand} supply={it.expectedSupply} trend={it.priceTrend} score={it.score} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
