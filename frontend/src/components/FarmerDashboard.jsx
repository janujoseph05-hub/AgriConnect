import React, { useState } from 'react'
import { useListings } from '../context/useListings'
import { useAuth } from '../context/useAuth'
import './FarmerDashboard.css'

const opportunities = [
  { crop: 'Tomato', demand: 'High Demand', supply: 'Medium Supply', score: 86, tone: 'strong' },
  { crop: 'Banana', demand: 'High Demand', supply: 'Low Supply', score: 91, tone: 'strong' },
  { crop: 'Onion', demand: 'Moderate Demand', supply: 'High Supply', score: 61, tone: 'steady' },
]

const emptyForm = {
  crop: '',
  quantity: '',
  unit: 'kg',
  location: '',
  price: '',
  availableFrom: '',
  description: '',
}

const cropIcons = {
  Tomato: 'T',
  Banana: 'B',
  Onion: 'O',
}

function FarmerDashboard() {
  const { listings, isLoading, error, addListing, updateListing, deleteListing } = useListings()
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const [validationMessage, setValidationMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const openAddForm = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setIsFormOpen(true)
    setSelectedListing(null)
    setValidationMessage('')
  }

  const openEditForm = (listing) => {
    setEditingId(listing.id)
    setForm({ ...emptyForm, ...listing, crop: listing.crop, quantity: listing.quantity })
    setIsFormOpen(true)
    setSelectedListing(null)
    setValidationMessage('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.crop.trim() || !form.quantity.trim() || !form.location.trim()) {
      setValidationMessage('Crop Name, Quantity, and Location are required.')
      return
    }

    setValidationMessage('')

    try {
      if (editingId) {
        await updateListing(editingId, { ...form, crop: form.crop.trim(), location: form.location.trim() })
        setSuccessMessage('Produce listing updated successfully!')
      } else {
        await addListing({ ...form, crop: form.crop.trim(), location: form.location.trim() })
        setSuccessMessage('Produce listed successfully!')
      }

      setForm({ ...emptyForm })
      setEditingId(null)
      setIsFormOpen(false)
    } catch {
      setSuccessMessage('')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this produce listing?')) return
    try {
      await deleteListing(id)
      if (selectedListing?.id === id) setSelectedListing(null)
      setSuccessMessage('Produce listing deleted successfully!')
    } catch {
      setSuccessMessage('')
    }
  }

  const handleCancel = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setIsFormOpen(false)
    setValidationMessage('')
  }

  return (
    <div className="farmer-dashboard">
      <header className="farmer-dashboard-header">
        <div>
          <p className="dashboard-eyebrow"><span className="eyebrow-mark">+</span> Farmer workspace</p>
          <h1>Welcome, {user?.name || 'Farmer'}</h1>
          <p className="dashboard-subtitle">Manage your produce and make smarter market decisions.</p>
        </div>
        <button className="dashboard-primary-button" type="button" onClick={openAddForm}>
          <span className="button-icon">+</span>
          Add Produce
        </button>
      </header>

      {successMessage && (
        <div className="dashboard-feedback success-feedback" role="status">
          <span className="feedback-icon">✓</span>
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} aria-label="Dismiss success message">x</button>
        </div>
      )}

      {error && (
        <div className="dashboard-feedback error-feedback" role="alert">
          <span className="feedback-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <section className="summary-grid" aria-label="Farm summary">
        <article className="summary-card">
          <div className="summary-icon summary-icon-green">L</div>
          <div><span>Active Listings</span><strong>{listings.length}</strong><small>+2 this month</small></div>
        </article>
        <article className="summary-card">
          <div className="summary-icon summary-icon-gold">K</div>
          <div><span>Total Produce</span><strong>{listings.reduce((total, listing) => total + Number(listing.quantity || 0), 0)} kg</strong><small>Across all listings</small></div>
        </article>
        <article className="summary-card">
          <div className="summary-icon summary-icon-blue">C</div>
          <div><span>Buyer Connections</span><strong>24</strong><small>+8% from last month</small></div>
        </article>
        <article className="summary-card">
          <div className="summary-icon summary-icon-orange">O</div>
          <div><span>Market Opportunities</span><strong>08</strong><small>2 high-potential crops</small></div>
        </article>
      </section>

      {isFormOpen && (
        <section className="produce-form-section" aria-labelledby="produce-form-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="dashboard-eyebrow">{editingId ? 'Update listing' : 'New listing'}</p>
              <h2 id="produce-form-title">{editingId ? 'Edit produce listing' : 'Add your produce'}</h2>
            </div>
            <button className="close-button" type="button" onClick={handleCancel} aria-label="Close form">x</button>
          </div>
          <form className="produce-form" onSubmit={handleSubmit}>
            <label>Crop Name<input name="crop" value={form.crop} onChange={handleChange} placeholder="e.g. Tomato" aria-required="true" /></label>
            <label>Quantity<div className="input-with-select"><input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="50" aria-required="true" /><select name="unit" value={form.unit} onChange={handleChange}><option value="kg">kg</option><option value="quintal">quintal</option><option value="tonne">tonne</option></select></div></label>
            <label>Location<input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Kanyakumari" aria-required="true" /></label>
            <label>Expected Price<input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="Price per kg" /></label>
            <label>Available From<input name="availableFrom" type="date" value={form.availableFrom} onChange={handleChange} /></label>
            <label className="description-field">Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="Add details about your produce" rows="3" /></label>
            {validationMessage && <p className="validation-message" role="alert">{validationMessage}</p>}
            <div className="form-actions"><button className="dashboard-secondary-button" type="button" onClick={handleCancel}>Cancel</button><button className="dashboard-primary-button" type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Submit Listing'}</button></div>
          </form>
        </section>
      )}

      <div className="dashboard-content-grid">
        <section className="listings-section" aria-labelledby="listings-title">
          <div className="section-heading">
            <div><p className="dashboard-eyebrow">Your inventory</p><h2 id="listings-title">My Produce Listings</h2></div>
            <span className="listing-count">{listings.length} listings</span>
          </div>
          <div className="produce-list">
            {isLoading && listings.length === 0 ? <div className="empty-state"><strong>Loading listings...</strong><span>Fetching the latest produce from AgriConnect.</span></div> : listings.length === 0 ? <div className="empty-state"><strong>No produce listed yet</strong><span>Add your first listing to start connecting with buyers.</span></div> : listings.map((listing) => (
              <article className="produce-card" key={listing.id}>
                <div className="crop-avatar">{cropIcons[listing.crop] || listing.crop.charAt(0).toUpperCase()}</div>
                <div className="produce-details"><h3>{listing.crop}</h3><div className="produce-meta"><span>{listing.quantity} {listing.unit}</span><span className="meta-divider">/</span><span>{listing.location}</span></div></div>
                <span className={`status-pill ${listing.status.toLowerCase()}`}>{listing.status}</span>
                <div className="produce-actions"><button type="button" onClick={() => setSelectedListing(listing)}>View</button><button type="button" onClick={() => openEditForm(listing)}>Edit</button><button className="delete-action" type="button" onClick={() => handleDelete(listing.id)}>Delete</button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="opportunities-section" aria-labelledby="opportunities-title">
          <div className="section-heading opportunity-heading"><div><p className="dashboard-eyebrow">Plan your next harvest</p><h2 id="opportunities-title">Market Opportunities</h2></div><span className="demo-badge">Demo Market Intelligence</span></div>
          <div className="opportunity-list">{opportunities.map((opportunity) => <article className="opportunity-card" key={opportunity.crop}><div className="opportunity-top"><div className="opportunity-crop"><span className={`opportunity-icon ${opportunity.tone}`}>{cropIcons[opportunity.crop]}</span><h3>{opportunity.crop}</h3></div><div className="opportunity-score"><strong>{opportunity.score}</strong><span>/100</span></div></div><div className="opportunity-bar"><span style={{ width: `${opportunity.score}%` }} /></div><div className="opportunity-meta"><span className="demand"><i />{opportunity.demand}</span><span className="supply"><i />{opportunity.supply}</span></div></article>)}</div>
        </section>
      </div>

      {selectedListing && (
        <div className="listing-modal-backdrop" role="presentation" onClick={() => setSelectedListing(null)}>
          <section className="listing-modal" role="dialog" aria-modal="true" aria-labelledby="listing-detail-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div><p className="dashboard-eyebrow">Listing details</p><h2 id="listing-detail-title">{selectedListing.crop}</h2></div>
              <button className="close-button" type="button" onClick={() => setSelectedListing(null)} aria-label="Close listing details">x</button>
            </div>
            <dl className="listing-detail-grid">
              <div><dt>Crop Name</dt><dd>{selectedListing.crop}</dd></div>
              <div><dt>Quantity</dt><dd>{selectedListing.quantity}</dd></div>
              <div><dt>Unit</dt><dd>{selectedListing.unit}</dd></div>
              <div><dt>Location</dt><dd>{selectedListing.location}</dd></div>
              <div><dt>Expected Price</dt><dd>{selectedListing.price ? `₹${selectedListing.price}` : 'Not specified'}</dd></div>
              <div><dt>Available From</dt><dd>{selectedListing.availableFrom || 'Not specified'}</dd></div>
              <div className="modal-description"><dt>Description</dt><dd>{selectedListing.description || 'No description added.'}</dd></div>
              <div><dt>Status</dt><dd><span className={`status-pill ${selectedListing.status.toLowerCase()}`}>{selectedListing.status}</span></dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  )
}

export default FarmerDashboard
