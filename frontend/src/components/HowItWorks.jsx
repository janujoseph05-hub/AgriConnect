import React from 'react'

const Step = ({number, title, text}) => (
  <div className="how-step">
    <div className="step-badge">{String(number).padStart(2,'0')}</div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
)

const HowItWorks = () => {
  return (
    <section className="how" id="how">
      <h2>How It Works</h2>
      <div className="how-grid flow">
        <Step number={1} title="Farmers List Produce" text="Add crop name, quantity, location and details." />
        <Step number={2} title="Buyers Discover & Connect" text="Browse produce and contact farmers directly." />
        <Step number={3} title="AI Helps Farmers Plan" text="Market intelligence recommends better crop opportunities." />
      </div>
    </section>
  )
}

export default HowItWorks
