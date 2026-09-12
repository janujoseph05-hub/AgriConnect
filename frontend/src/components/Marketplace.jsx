import React from 'react'
import { useListings } from '../context/useListings'

const ListingCard = ({item}) => (
  <div className="listing-card premium-listing">
    <div className="listing-image">{item.crop.charAt(0)}</div>
    <div className="listing-body">
      <h4>{item.crop} <span className={`status ${item.status === 'Available' ? 'ok' : 'limited'}`}>{item.status}</span></h4>
      <p className="muted">{item.quantity} {item.unit} • {item.location}</p>
      <p className="muted">Farmer: {item.farmer}</p>
    </div>
    <div className="listing-actions">
      <button className="btn btn-outline">View Details</button>
    </div>
  </div>
)

const Marketplace = () => {
  const { listings } = useListings()

  return (
    <section className="marketplace premium-market" id="marketplace">
      <div className="market-header">
        <h2>Marketplace Preview</h2>
        <p className="muted">Browse fresh produce listings from farmers</p>
      </div>
      <div className="listings-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} item={l} />
        ))}
      </div>
      <div className="market-actions">
        <button className="btn btn-primary">Browse All Produce →</button>
      </div>
    </section>
  )
}

export default Marketplace
