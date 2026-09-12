import React, { useMemo, useState } from 'react'
import { useListings } from '../context/useListings'
import { useAuth } from '../context/useAuth'
import { createPurchaseRequest } from '../services/api'
import './BuyerMarketplace.css'

const cropIcons = { Tomato: 'T', Banana: 'B', Onion: 'O' }
const initialFilters = { crop: 'All crops', location: 'All locations', availability: 'All availability', price: 'Any price' }

const formatAvailableDate = (date) => {
  if (!date) return 'Not specified'
  const parsedDate = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BuyerMarketplace() {
  const { listings, isLoading, error } = useListings()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [selectedProduce, setSelectedProduce] = useState(null)
  const [contactProduce, setContactProduce] = useState(null)
  const [requestProduce, setRequestProduce] = useState(null)
  const [requestForm, setRequestForm] = useState({ quantity: '', price: '', message: '' })
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')

  const locations = [...new Set(listings.map((produce) => produce.location))]
  const filteredProduce = useMemo(() => {
    const query = search.trim().toLowerCase()
    return listings.filter((produce) => {
      const matchesSearch = !query || [produce.crop, produce.farmer, produce.location].some((value) => value.toLowerCase().includes(query))
      const matchesCrop = filters.crop === 'All crops' || produce.crop === filters.crop
      const matchesLocation = filters.location === 'All locations' || produce.location === filters.location
      const matchesAvailability = filters.availability === 'All availability' || produce.status === filters.availability
      const matchesPrice = filters.price === 'Any price' || (filters.price === 'Under ₹35/kg' ? Number(produce.price) < 35 : Number(produce.price) >= 35)
      return matchesSearch && matchesCrop && matchesLocation && matchesAvailability && matchesPrice
    })
  }, [filters, listings, search])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const resetFilters = () => {
    setSearch('')
    setFilters({ ...initialFilters })
  }

  const openRequestForm = (produce) => {
    setRequestProduce(produce)
    setRequestForm({ quantity: '', price: produce.price || '', message: '' })
    setRequestError('')
    setRequestSuccess('')
  }

  const handleRequestSubmit = async (event) => {
    event.preventDefault()
    const quantity = Number(requestForm.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) return setRequestError('Enter a requested quantity greater than zero.')
    if (quantity > Number(requestProduce.quantity)) return setRequestError('Requested quantity cannot exceed available quantity.')
    const offeredPrice = requestForm.price === '' ? null : Number(requestForm.price)
    if (offeredPrice !== null && (!Number.isFinite(offeredPrice) || offeredPrice < 0)) return setRequestError('Enter a valid offered price.')
    try {
      await createPurchaseRequest({ listing_id: requestProduce.id, requested_quantity: quantity, offered_price: offeredPrice, message: requestForm.message.trim() || null })
      setRequestSuccess('Purchase request sent successfully.')
      setRequestError('')
      setTimeout(() => setRequestProduce(null), 900)
    } catch (requestFailure) { setRequestError(requestFailure.message); setRequestSuccess('') }
  }

  return (
    <div className="buyer-marketplace">
      <header className="marketplace-hero">
        <div>
          <p className="marketplace-eyebrow"><span>+</span> Direct farmer marketplace</p>
          <h1>Find Fresh Produce Directly from Farmers</h1>
          <p className="marketplace-subtitle">{user ? `Welcome, ${user.name}. ` : ''}Connect with farmers and source produce directly without unnecessary intermediaries.</p>
        </div>
        <div className="marketplace-hero-stat"><strong>{listings.length}</strong><span>fresh listings<br />ready to source</span></div>
      </header>

      {error && <div className="marketplace-feedback" role="alert">{error}</div>}

      <section className="marketplace-tools" aria-label="Search and filter produce">
        <label className="market-search"><span className="search-icon">⌕</span><span className="sr-only">Search produce</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by crop, farmer, or location" /></label>
        <div className="market-filter-row">
          <label>Crop<select name="crop" value={filters.crop} onChange={updateFilter}><option>All crops</option>{[...new Set(listings.map((produce) => produce.crop))].map((crop) => <option key={crop}>{crop}</option>)}</select></label>
          <label>Location<select name="location" value={filters.location} onChange={updateFilter}><option>All locations</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
          <label>Availability<select name="availability" value={filters.availability} onChange={updateFilter}><option>All availability</option><option>Available</option><option>Limited</option></select></label>
          <label>Price range<select name="price" value={filters.price} onChange={updateFilter}><option>Any price</option><option>Under ₹35/kg</option><option>₹35/kg and above</option></select></label>
          <button className="reset-filters" type="button" onClick={resetFilters}>Reset</button>
        </div>
      </section>

      <div className="marketplace-results-heading"><div><p className="marketplace-eyebrow">Fresh from the source</p><h2>Available Produce</h2></div><span>{filteredProduce.length} {filteredProduce.length === 1 ? 'listing' : 'listings'}</span></div>
      <section className="buyer-produce-grid" aria-label="Available produce">
        {isLoading && listings.length === 0 ? <div className="market-empty"><strong>Loading produce...</strong><span>Fetching the latest listings from AgriConnect.</span></div> : filteredProduce.length === 0 ? <div className="market-empty"><strong>No produce matches your search</strong><span>Try clearing a filter or searching for another crop, farmer, or location.</span><button className="market-button secondary" type="button" onClick={resetFilters}>Clear filters</button></div> : filteredProduce.map((produce) => (
          <article className="buyer-produce-card" key={`${produce.sourceType}-${produce.id}`}>
            <div className={`produce-banner ${produce.crop.toLowerCase()}`}><span className="produce-visual">{cropIcons[produce.crop] || produce.crop.charAt(0).toUpperCase()}</span><span className="market-status">{produce.status}</span></div>
            <div className="buyer-card-body"><div className="buyer-card-title"><h3>{produce.crop}</h3><span className="price-tag">₹{produce.price}<small>/{produce.unit}</small></span></div><div className="buyer-card-meta"><span><b>Source</b><strong className="source-badge">{produce.sourceType === 'fpo' ? 'FPO' : 'Farmer'}</strong></span><span><b>Quantity</b>{produce.quantity} {produce.unit}</span><span><b>Location</b>{produce.location}</span><span><b>{produce.sourceType === 'fpo' ? 'FPO' : 'Farmer'}</b>{produce.sourceName}</span></div><div className="buyer-card-actions"><button className="market-button primary request-buy-button" type="button" onClick={() => openRequestForm(produce)}>Request to Buy</button><button className="market-button secondary" type="button" onClick={() => setSelectedProduce(produce)}>View Details</button><button className="market-button secondary" type="button" onClick={() => setContactProduce(produce)}>Contact Farmer</button></div></div>
          </article>
        ))}
      </section>

      <p className="marketplace-demo-note"><span>i</span> Listings are sourced directly from farmer submissions.</p>

      {selectedProduce && <div className="market-modal-backdrop" role="presentation" onClick={() => setSelectedProduce(null)}><section className="market-modal" role="dialog" aria-modal="true" aria-labelledby="produce-details-title" onClick={(event) => event.stopPropagation()}><div className="market-modal-heading"><div><p className="marketplace-eyebrow">Produce listing</p><h2 id="produce-details-title">{selectedProduce.crop}</h2></div><button className="market-close" type="button" onClick={() => setSelectedProduce(null)} aria-label="Close produce details">x</button></div><dl className="produce-detail-grid"><div><dt>Crop</dt><dd>{selectedProduce.crop}</dd></div><div><dt>Quantity</dt><dd>{selectedProduce.quantity} {selectedProduce.unit}</dd></div><div><dt>Location</dt><dd>{selectedProduce.location}</dd></div><div><dt>Farmer</dt><dd>{selectedProduce.farmer}</dd></div><div><dt>Expected Price</dt><dd>₹{selectedProduce.price}/{selectedProduce.unit}</dd></div><div><dt>Available Date</dt><dd>{formatAvailableDate(selectedProduce.availableFrom)}</dd></div><div className="detail-wide"><dt>Description</dt><dd>{selectedProduce.description || 'No description added.'}</dd></div></dl><button className="market-button primary modal-contact-button" type="button" onClick={() => { setSelectedProduce(null); setContactProduce(selectedProduce) }}>Contact Farmer</button></section></div>}

      {requestProduce && <div className="market-modal-backdrop" role="presentation" onClick={() => setRequestProduce(null)}><section className="purchase-request-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-request-title" onClick={(event) => event.stopPropagation()}><div className="market-modal-heading"><div><p className="marketplace-eyebrow">Purchase request</p><h2 id="purchase-request-title">Request {requestProduce.crop}</h2></div><button className="market-close" type="button" onClick={() => setRequestProduce(null)} aria-label="Close purchase request">x</button></div><div className="purchase-request-summary"><span>Available</span><strong>{requestProduce.quantity} {requestProduce.unit}</strong><span>Seller</span><strong>{requestProduce.sourceName} ({requestProduce.sourceType === 'fpo' ? 'FPO' : 'Farmer'})</strong></div>{requestError && <div className="marketplace-feedback request-error" role="alert">{requestError}</div>}{requestSuccess && <div className="marketplace-feedback request-success" role="status">{requestSuccess}</div>}<form className="purchase-request-form" onSubmit={handleRequestSubmit}><label>Requested Quantity<input type="number" min="0.01" step="0.01" value={requestForm.quantity} onChange={(event) => setRequestForm({ ...requestForm, quantity: event.target.value })} placeholder={`Up to ${requestProduce.quantity}`} required /></label><label>Offered Price (optional)<input type="number" min="0" step="0.01" value={requestForm.price} onChange={(event) => setRequestForm({ ...requestForm, price: event.target.value })} /></label><label className="request-message-field">Message (optional)<textarea rows="3" value={requestForm.message} onChange={(event) => setRequestForm({ ...requestForm, message: event.target.value })} placeholder="Add a note for the seller" /></label><div className="purchase-request-actions"><button className="market-button secondary" type="button" onClick={() => setRequestProduce(null)}>Cancel</button><button className="market-button primary" type="submit">Send Purchase Request</button></div></form></section></div>}

      {contactProduce && <div className="market-modal-backdrop" role="presentation" onClick={() => setContactProduce(null)}><section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onClick={(event) => event.stopPropagation()}><div className="market-modal-heading"><div><p className="marketplace-eyebrow">Demo contact</p><h2 id="contact-title">Contact {contactProduce.farmer}</h2></div><button className="market-close" type="button" onClick={() => setContactProduce(null)} aria-label="Close contact details">x</button></div><div className="contact-notice"><span>i</span> Demo information only. No real contact details are used.</div><div className="contact-details"><div><span className="contact-icon">F</span><div><small>Farmer</small><strong>{contactProduce.farmer}</strong></div></div><div><span className="contact-icon">L</span><div><small>Location</small><strong>{contactProduce.location}</strong></div></div><div><span className="contact-icon">P</span><div><small>Phone</small><strong>+91 90000 12345</strong></div></div><div><span className="contact-icon">@</span><div><small>Email</small><strong>demo.farmer@agriconnect.test</strong></div></div></div><button className="market-button secondary modal-contact-button" type="button" onClick={() => setContactProduce(null)}>Close</button></section></div>}
    </div>
  )
}

export default BuyerMarketplace
