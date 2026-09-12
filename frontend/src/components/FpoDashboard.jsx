import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import {
  addFpoFarmer,
  createFpoProduce,
  deleteFpoProduce,
  getFpoFarmers,
  getFpoProduce,
  getFpoStats,
  removeFpoFarmer,
  updateFpoProduce,
} from '../services/api'
import './FpoDashboard.css'

const emptyProduce = { crop_name: '', quantity: '', unit: 'kg', location: '', expected_price: '', available_from: '', description: '' }

function FpoDashboard() {
  const { user } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [produce, setProduce] = useState([])
  const [stats, setStats] = useState({ total_farmers: 0, total_produce_quantity: 0, active_produce_listings: 0, number_of_crops: 0 })
  const [farmerEmail, setFarmerEmail] = useState('')
  const [form, setForm] = useState(emptyProduce)
  const [editingId, setEditingId] = useState(null)
  const [isProduceFormOpen, setIsProduceFormOpen] = useState(false)
  const [selectedProduce, setSelectedProduce] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const refresh = async () => {
    setIsLoading(true)
    try {
      const [farmerData, produceData, statsData] = await Promise.all([getFpoFarmers(), getFpoProduce(), getFpoStats()])
      setFarmers(farmerData)
      setProduce(produceData)
      setStats(statsData)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const showMessage = (text) => { setMessage(text); setError('') }

  const handleAddFarmer = async (event) => {
    event.preventDefault()
    if (!farmerEmail.trim()) return
    try {
      await addFpoFarmer(farmerEmail.trim())
      setFarmerEmail('')
      await refresh()
      showMessage('Farmer associated with your FPO.')
    } catch (requestError) { setError(requestError.message); setMessage('') }
  }

  const handleRemoveFarmer = async (farmerId) => {
    if (!window.confirm('Remove this farmer from your FPO?')) return
    try { await removeFpoFarmer(farmerId); await refresh(); showMessage('Farmer removed from your FPO.') } catch (requestError) { setError(requestError.message) }
  }

  const openProduceForm = (item = null) => {
    setEditingId(item?.id || null)
    setForm(item ? { crop_name: item.crop_name, quantity: item.quantity, unit: item.unit, location: item.location || '', expected_price: item.expected_price ?? '', available_from: item.available_from || '', description: item.description || '' } : { ...emptyProduce })
    setIsProduceFormOpen(true)
    setSelectedProduce(null)
  }

  const handleProduceSubmit = async (event) => {
    event.preventDefault()
    const payload = { ...form, crop_name: form.crop_name.trim(), quantity: Number(form.quantity), expected_price: form.expected_price === '' ? null : Number(form.expected_price), location: form.location.trim() || null, available_from: form.available_from || null, description: form.description.trim() || null }
    try {
      if (editingId) { await updateFpoProduce(editingId, payload); showMessage('FPO produce listing updated.') } else { await createFpoProduce(payload); showMessage('FPO produce listing added.') }
      setIsProduceFormOpen(false)
      setEditingId(null)
      await refresh()
    } catch (requestError) { setError(requestError.message); setMessage('') }
  }

  const handleDeleteProduce = async (produceId) => {
    if (!window.confirm('Delete this FPO produce listing?')) return
    try { await deleteFpoProduce(produceId); await refresh(); showMessage('FPO produce listing deleted.') } catch (requestError) { setError(requestError.message) }
  }

  return (
    <div className="fpo-dashboard">
      <header className="fpo-header">
        <div><p className="fpo-eyebrow"><span>+</span> FPO workspace</p><h1>Welcome, {user?.name || 'FPO partner'}</h1><p>Coordinate your farmer network, manage produce, and build stronger buyer connections.</p></div>
        <button className="fpo-primary-button" type="button" onClick={() => document.getElementById('fpo-farmer-email')?.focus()}>+ Add farmer</button>
      </header>

      {message && <div className="fpo-feedback success" role="status">{message}</div>}
      {error && <div className="fpo-feedback error" role="alert">{error}</div>}

      <section className="fpo-stats" aria-label="FPO summary">
        <article><span className="fpo-stat-icon green">F</span><div><small>Associated Farmers</small><strong>{stats.total_farmers}</strong><em>Current network</em></div></article>
        <article><span className="fpo-stat-icon gold">P</span><div><small>Total Produce</small><strong>{stats.total_produce_quantity} kg</strong><em>Managed by your FPO</em></div></article>
        <article><span className="fpo-stat-icon blue">L</span><div><small>Active Listings</small><strong>{stats.active_produce_listings}</strong><em>Available to buyers</em></div></article>
        <article><span className="fpo-stat-icon orange">C</span><div><small>Crop Types</small><strong>{stats.number_of_crops}</strong><em>Across all listings</em></div></article>
      </section>

      <section className="fpo-panel fpo-management-panel">
        <div className="fpo-panel-heading"><div><p className="fpo-eyebrow">Network management</p><h2>Associated Farmers</h2></div><span className="fpo-count">{farmers.length} farmers</span></div>
        <form className="fpo-inline-form" onSubmit={handleAddFarmer}><label htmlFor="fpo-farmer-email">Registered farmer email</label><input id="fpo-farmer-email" type="email" value={farmerEmail} onChange={(event) => setFarmerEmail(event.target.value)} placeholder="farmer@example.com" required /><button className="fpo-primary-button" type="submit">Add Farmer</button></form>
        <div className="fpo-table-wrap"><table><thead><tr><th>Farmer</th><th>Email</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>{farmers.length === 0 ? <tr><td colSpan="5" className="fpo-empty">{isLoading ? 'Loading farmers...' : 'No farmers associated yet.'}</td></tr> : farmers.map((farmer) => <tr key={farmer.id}><td className="fpo-person">{farmer.name}</td><td>{farmer.email}</td><td>{farmer.joined_at ? new Date(farmer.joined_at).toLocaleDateString() : 'â€”'}</td><td><span className="fpo-status">{farmer.status}</span></td><td><button className="fpo-danger-button" type="button" onClick={() => handleRemoveFarmer(farmer.id)}>Remove</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="fpo-panel fpo-management-panel">
        <div className="fpo-panel-heading"><div><p className="fpo-eyebrow">Inventory management</p><h2>FPO Produce</h2></div><button className="fpo-primary-button" type="button" onClick={() => openProduceForm()}>+ Add Produce</button></div>
        {isProduceFormOpen && <form className="fpo-produce-form" onSubmit={handleProduceSubmit}><div className="fpo-form-grid"><label>Crop<input value={form.crop_name} onChange={(event) => setForm({ ...form, crop_name: event.target.value })} required /></label><label>Quantity<input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></label><label>Unit<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option>kg</option><option>quintal</option><option>tonne</option></select></label><label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Expected Price<input type="number" min="0" step="0.01" value={form.expected_price} onChange={(event) => setForm({ ...form, expected_price: event.target.value })} /></label><label>Available From<input type="date" value={form.available_from} onChange={(event) => setForm({ ...form, available_from: event.target.value })} /></label><label className="fpo-wide-field">Description<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><div className="fpo-form-actions"><button className="fpo-secondary-button" type="button" onClick={() => setIsProduceFormOpen(false)}>Cancel</button><button className="fpo-primary-button" type="submit">{editingId ? 'Save Changes' : 'Create Listing'}</button></div></form>}
        <div className="fpo-table-wrap"><table><thead><tr><th>Crop</th><th>Quantity</th><th>Unit</th><th>Location</th><th>Expected Price</th><th>Available From</th><th>Actions</th></tr></thead><tbody>{produce.length === 0 ? <tr><td colSpan="7" className="fpo-empty">{isLoading ? 'Loading produce...' : 'No FPO produce listings yet.'}</td></tr> : produce.map((item) => <tr key={item.id}><td className="fpo-person">{item.crop_name}</td><td>{item.quantity}</td><td>{item.unit}</td><td>{item.location || 'â€”'}</td><td>{item.expected_price == null ? 'â€”' : `â‚¹${item.expected_price}`}</td><td>{item.available_from || 'â€”'}</td><td className="fpo-row-actions"><button type="button" onClick={() => setSelectedProduce(item)}>View</button><button type="button" onClick={() => openProduceForm(item)}>Edit</button><button className="fpo-danger-button" type="button" onClick={() => handleDeleteProduce(item.id)}>Delete</button></td></tr>)}</tbody></table></div>
      </section>

      <section className="fpo-panel fpo-activity-panel"><div className="fpo-panel-heading"><div><p className="fpo-eyebrow">Network pulse</p><h2>Recent Activity</h2></div></div><div className="fpo-activity-list">{farmers.slice(0, 2).map((farmer) => <article key={`farmer-${farmer.id}`}><span className="fpo-activity-mark">F</span><div><strong>Farmer joined FPO</strong><p>{farmer.name} Â· {farmer.email}</p></div><time>{farmer.joined_at ? new Date(farmer.joined_at).toLocaleDateString() : ''}</time></article>)}{produce.slice(0, 3).map((item) => <article key={`produce-${item.id}`}><span className="fpo-activity-mark">P</span><div><strong>Produce listing added</strong><p>{item.crop_name} Â· {item.quantity} {item.unit}</p></div><time>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</time></article>)}{farmers.length === 0 && produce.length === 0 && <p className="fpo-empty">Your latest FPO activity will appear here.</p>}</div></section>

      {selectedProduce && <div className="fpo-modal-backdrop" role="presentation" onClick={() => setSelectedProduce(null)}><section className="fpo-modal" role="dialog" aria-modal="true" aria-labelledby="fpo-produce-details" onClick={(event) => event.stopPropagation()}><div className="fpo-panel-heading"><div><p className="fpo-eyebrow">Produce details</p><h2 id="fpo-produce-details">{selectedProduce.crop_name}</h2></div><button type="button" onClick={() => setSelectedProduce(null)} aria-label="Close details">x</button></div><dl className="fpo-details"><div><dt>Quantity</dt><dd>{selectedProduce.quantity} {selectedProduce.unit}</dd></div><div><dt>Location</dt><dd>{selectedProduce.location || 'Not specified'}</dd></div><div><dt>Expected Price</dt><dd>{selectedProduce.expected_price == null ? 'Not specified' : `â‚¹${selectedProduce.expected_price}`}</dd></div><div><dt>Available From</dt><dd>{selectedProduce.available_from || 'Not specified'}</dd></div><div className="fpo-wide-field"><dt>Description</dt><dd>{selectedProduce.description || 'No description added.'}</dd></div></dl></section></div>}
    </div>
  )
}

export default FpoDashboard
