import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { getDeliveries, updateDeliveryStatus } from '../services/api'
import './LogisticsDashboard.css'
import { optimizeRoute as calculateOptimizedRoute } from '../utils/routeOptimizer'

const statuses = ['All', 'Pending', 'Pickup Scheduled', 'In Transit', 'Delivered', 'Cancelled']
const depot = 'Marthandam'
const prototypeDistances = {
  'Marthandam|Nagercoil': 28,
  'Kanyakumari|Marthandam': 54,
  'Marthandam|Thiruvananthapuram': 92,
  'Nagercoil|Kanyakumari': 20,
  'Nagercoil|Thiruvananthapuram': 76,
  'Kanyakumari|Thiruvananthapuram': 98,
}
const statusLabels = { pending: 'Pending', pickup_scheduled: 'Pickup Scheduled', in_transit: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled' }

const getPrototypeDistance = (from, to) => {
  if (from === to) return 0
  const key = [from, to].sort().join('|')
  return prototypeDistances[key] ?? 50
}

const formatMinutes = (minutes) => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
}

const statusClass = (status) => status.toLowerCase().replaceAll(' ', '-')
const formatDelivery = (delivery) => {
  const distance = delivery.distance ?? getPrototypeDistance(delivery.pickup_location || depot, delivery.destination || depot)
  const minutes = Math.round((distance / 40) * 60)
  return { ...delivery, produce: delivery.crop_name, farmer: `${delivery.seller_name} (${delivery.seller_type === 'fpo' ? 'FPO' : 'Farmer'})`, buyer: delivery.buyer_name, quantityLabel: `${delivery.quantity} ${delivery.unit}`, pickup: delivery.pickup_location || 'Location not provided', destination: delivery.destination || 'Location not provided', statusLabel: statusLabels[delivery.status] || delivery.status, distanceLabel: `${distance} km`, time: delivery.eta || formatMinutes(minutes) }
}

function SummaryCard({ label, value, detail, tone }) {
  return <article className={`logistics-summary-card ${tone}`}><span className="summary-card-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function LogisticsDashboard() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshDeliveries = async () => {
    setIsLoading(true)
    try { setDeliveries((await getDeliveries()).map(formatDelivery)); setError('') } catch (requestError) { setError(requestError.message) } finally { setIsLoading(false) }
  }

  useEffect(() => { refreshDeliveries() }, [])

  const filteredDeliveries = useMemo(() => activeFilter === 'All' ? deliveries : deliveries.filter((delivery) => delivery.statusLabel === activeFilter), [activeFilter, deliveries])
  const deliveryLocations = useMemo(() => [...new Set(deliveries.map((delivery) => delivery.destination).filter((location) => location !== depot && location !== 'Location not provided'))], [deliveries])
  const routePlan = useMemo(() => deliveryLocations.length ? calculateOptimizedRoute({ start: depot, locations: deliveryLocations, distanceBetween: getPrototypeDistance }) : null, [deliveryLocations])
  const displayedRoute = optimizationResult?.optimizedRoute || routePlan?.originalRoute || [depot]
  const totalDistance = deliveries.reduce((total, delivery) => total + (Number.parseFloat(delivery.distanceLabel) || 0), 0)
  const activeCount = deliveries.filter((delivery) => !['Delivered', 'Cancelled'].includes(delivery.statusLabel)).length
  const pendingCount = deliveries.filter((delivery) => delivery.statusLabel === 'Pending').length
  const completedCount = deliveries.filter((delivery) => delivery.statusLabel === 'Delivered').length
  const isSeller = user?.role === 'farmer' || user?.role === 'fpo'

  const updateStatus = async (delivery, status) => {
    try {
      const updated = await updateDeliveryStatus(delivery.id, status)
      const mapped = formatDelivery(updated)
      setDeliveries((current) => current.map((item) => item.id === delivery.id ? mapped : item))
      setSelectedDelivery(mapped)
      setError('')
    } catch (requestError) { setError(requestError.message) }
  }

  const optimizeRoute = () => {
    if (!routePlan) return
    setIsOptimizing(true)
    window.setTimeout(() => { setOptimizationResult(routePlan); setIsOptimizing(false) }, 650)
  }

  return (
    <div className="logistics-dashboard">
      <header className="logistics-header"><div><p className="logistics-eyebrow"><span className="logistics-eyebrow-mark">+</span> Operations workspace</p><h1>Logistics &amp; Delivery</h1><p className="logistics-subtitle">Coordinate produce pickup and delivery between farmers and buyers with greater clarity.</p></div><span className="logistics-demo-pill">Live delivery data</span></header>
      {error && <div className="logistics-empty" role="alert">{error}</div>}
      <section className="logistics-summary-grid" aria-label="Delivery summary"><SummaryCard label="Active Deliveries" value={String(activeCount).padStart(2, '0')} detail="Awaiting completion" tone="green" /><SummaryCard label="Pending Pickups" value={String(pendingCount).padStart(2, '0')} detail="Needs coordination" tone="gold" /><SummaryCard label="Completed Deliveries" value={String(completedCount).padStart(2, '0')} detail="Persisted deliveries" tone="blue" /><SummaryCard label="Total Distance" value={`${totalDistance.toFixed(0)} km`} detail="Prototype estimates" tone="orange" /></section>

      <section className="delivery-section" aria-labelledby="delivery-title"><div className="logistics-section-heading"><div><p className="logistics-eyebrow">Delivery requests</p><h2 id="delivery-title">Manage Delivery Requests</h2></div><span className="logistics-count">{filteredDeliveries.length} deliveries</span></div><div className="status-filters" aria-label="Filter delivery status">{statuses.map((status) => <button className={activeFilter === status ? 'active' : ''} key={status} type="button" onClick={() => setActiveFilter(status)}>{status}</button>)}</div><div className="delivery-table-wrap"><table className="delivery-table"><thead><tr><th>Delivery</th><th>Produce</th><th>Route</th><th>Buyer</th><th>Status</th><th>Estimate</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredDeliveries.map((delivery) => <tr key={delivery.id}><td><strong>DL-{delivery.id}</strong><small>{delivery.farmer}</small></td><td><strong>{delivery.produce}</strong><small>{delivery.quantityLabel}</small></td><td><strong>{delivery.pickup}</strong><small>to {delivery.destination}</small></td><td>{delivery.buyer}</td><td><span className={`delivery-status ${statusClass(delivery.statusLabel)}`}>{delivery.statusLabel}</span></td><td><strong>{delivery.distanceLabel}</strong><small>{delivery.time}</small></td><td><button className="table-action" type="button" onClick={() => setSelectedDelivery(delivery)}>View Details</button></td></tr>)}</tbody></table>{isLoading && <div className="logistics-empty">Loading deliveries...</div>}{!isLoading && filteredDeliveries.length === 0 && <div className="logistics-empty">No delivery requests match this status.</div>}</div></section>

      <section className="route-section" aria-labelledby="route-title"><div className="route-copy"><p className="logistics-eyebrow">Prototype capability</p><h2 id="route-title">Route Optimization</h2><p>Nearest Neighbor builds an initial route, then 2-opt checks stop swaps to reduce the estimated distance.</p><span className="route-demo-label">PROTOTYPE DISTANCES Â· NO ROAD-MAP API</span><button className="logistics-primary-button" type="button" onClick={optimizeRoute} disabled={isOptimizing || !routePlan}>{isOptimizing ? 'Optimizing route...' : 'Optimize Route'}</button></div><div className="route-panel"><div className="route-stats"><div><span>Starting point</span><strong>AgriConnect Depot</strong><small>Marthandam</small></div><div><span>Delivery destinations</span><strong>{deliveryLocations.length} stops</strong><small>{deliveryLocations.join(' Â· ') || 'No destinations yet'}</small></div></div><div className="route-metrics"><div><span>Current route</span><strong>{routePlan ? `${routePlan.originalDistance} km` : 'â€”'}</strong><small>{routePlan ? formatMinutes(routePlan.originalTimeMinutes) : 'No route'}</small></div><div className={optimizationResult ? 'metric-highlight' : ''}><span>Optimized route</span><strong>{optimizationResult ? `${optimizationResult.optimizedDistance} km` : 'â€”'}</strong><small>{optimizationResult ? formatMinutes(optimizationResult.optimizedTimeMinutes) : 'Run optimizer'}</small></div><div className={optimizationResult ? 'metric-highlight' : ''}><span>Distance saved</span><strong>{optimizationResult ? `${optimizationResult.distanceSaved} km` : 'â€”'}</strong></div><div className={optimizationResult ? 'metric-highlight' : ''}><span>Time saved</span><strong>{optimizationResult ? formatMinutes(optimizationResult.timeSavedMinutes) : 'â€”'}</strong></div></div><div className="route-visual" aria-label={`${optimizationResult ? 'Optimized' : 'Current'} route sequence`}><div className="route-line" />{displayedRoute.map((location, index) => <div className="route-stop" key={location}><span className={`route-dot ${index === 0 ? 'depot' : index === displayedRoute.length - 1 ? 'destination' : ''}`} /><strong>{index === 0 ? 'Depot' : index === displayedRoute.length - 1 ? 'Destination' : `Stop ${index}`}</strong><small>{location}</small></div>)}</div>{optimizationResult && <p className="optimization-success" role="status">Optimized sequence calculated with Nearest Neighbor + 2-opt.</p>}</div></section>

      {selectedDelivery && <div className="logistics-modal-backdrop" role="presentation" onClick={() => setSelectedDelivery(null)}><section className="logistics-modal" role="dialog" aria-modal="true" aria-labelledby="delivery-detail-title" onClick={(event) => event.stopPropagation()}><div className="logistics-modal-heading"><div><p className="logistics-eyebrow">Delivery DL-{selectedDelivery.id}</p><h2 id="delivery-detail-title">{selectedDelivery.produce} delivery</h2></div><button className="logistics-close" type="button" onClick={() => setSelectedDelivery(null)} aria-label="Close delivery details">x</button></div><dl className="delivery-detail-grid"><div><dt>Seller</dt><dd>{selectedDelivery.farmer}</dd></div><div><dt>Buyer</dt><dd>{selectedDelivery.buyer}</dd></div><div><dt>Produce</dt><dd>{selectedDelivery.produce}</dd></div><div><dt>Quantity</dt><dd>{selectedDelivery.quantityLabel}</dd></div><div><dt>Pickup location</dt><dd>{selectedDelivery.pickup}</dd></div><div><dt>Destination</dt><dd>{selectedDelivery.destination}</dd></div><div><dt>Distance</dt><dd>{selectedDelivery.distanceLabel}</dd></div><div><dt>Estimated time</dt><dd>{selectedDelivery.time}</dd></div><div className="detail-wide"><dt>Current status</dt><dd><span className={`delivery-status ${statusClass(selectedDelivery.statusLabel)}`}>{selectedDelivery.statusLabel}</span></dd></div></dl>{isSeller && <div className="logistics-status-actions">{selectedDelivery.status === 'pending' && <><button className="logistics-primary-button" type="button" onClick={() => updateStatus(selectedDelivery, 'pickup_scheduled')}>Schedule Pickup</button><button className="logistics-cancel-button" type="button" onClick={() => updateStatus(selectedDelivery, 'cancelled')}>Cancel</button></>}{selectedDelivery.status === 'pickup_scheduled' && <><button className="logistics-primary-button" type="button" onClick={() => updateStatus(selectedDelivery, 'in_transit')}>Mark In Transit</button><button className="logistics-cancel-button" type="button" onClick={() => updateStatus(selectedDelivery, 'cancelled')}>Cancel</button></>}{selectedDelivery.status === 'in_transit' && <button className="logistics-primary-button" type="button" onClick={() => updateStatus(selectedDelivery, 'delivered')}>Mark Delivered</button>}</div>}</section></div>}
    </div>
  )
}

export default LogisticsDashboard
