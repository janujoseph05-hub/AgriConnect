import React from 'react'

const Card = ({icon, title, text}) => (
  <div className="feature-card premium">
    <div className="feature-icon">{icon}</div>
    <h4>{title}</h4>
    <p>{text}</p>
  </div>
)

const Features = () => {
  return (
    <section className="features" id="features">
      <h2>Why AgriConnect</h2>
      <div className="features-grid">
        <Card icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12l2-2 4 4 8-8 4 4" stroke="#2f855a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} title="Direct Farmer-Buyer Connection" text="Connect directly without middlemen to improve margins and trust." />
        <Card icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M3 12h18" stroke="#2f855a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} title="Better Market Visibility" text="Showcase available produce to a wider set of buyers quickly." />
        <Card icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17l6-6 4 4 8-8" stroke="#2f855a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} title="AI-Powered Market Insights" text="Market intelligence provides demand forecasting and recommendations." />
        <Card icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="#2f855a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>} title="Reduced Oversupply Risk" text="Balanced supply signals reduce waste and improve allocation." />
      </div>
    </section>
  )
}

export default Features
