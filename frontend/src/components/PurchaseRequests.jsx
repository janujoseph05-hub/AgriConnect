import { useCallback, useEffect, useState } from 'react'
import {
  getBuyerPurchaseRequests,
  getReceivedPurchaseRequests,
  updatePurchaseRequestStatus,
} from '../services/api'
import './PurchaseRequests.css'

const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not specified'

function PurchaseRequests({ mode }) {
  const [requests, setRequests] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setRequests(await (mode === 'buyer' ? getBuyerPurchaseRequests() : getReceivedPurchaseRequests()))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  useEffect(() => { refresh() }, [refresh])

  const changeStatus = async (request, status) => {
    const confirmation = status === 'cancelled' ? 'Cancel this purchase request?' : status === 'rejected' ? 'Reject this purchase request?' : status === 'completed' ? 'Mark this request completed?' : 'Accept this purchase request?'
    if (!window.confirm(confirmation)) return
    try {
      await updatePurchaseRequestStatus(request.id, status)
      setMessage(`Request #${request.id} marked ${status}.`)
      setSelected(null)
      await refresh()
    } catch (requestError) { setError(requestError.message); setMessage('') }
  }

  const sellerView = mode !== 'buyer'
  const title = mode === 'buyer' ? 'My Purchase Requests' : mode === 'fpo' ? 'Buyer Requests' : 'Purchase Requests'
  const empty = mode === 'buyer' ? 'You have not sent any purchase requests yet.' : 'No purchase requests have been received yet.'

  return (
    <div className="purchase-page">
      <header className="purchase-header"><div><p className="purchase-eyebrow">Request center</p><h1>{title}</h1><p>{sellerView ? 'Review buyer interest and keep every sale moving clearly.' : 'Track the produce you have asked to buy from farmers and FPOs.'}</p></div><span className="purchase-count">{requests.length} requests</span></header>
      {message && <div className="purchase-feedback success" role="status">{message}</div>}
      {error && <div className="purchase-feedback error" role="alert">{error}</div>}
      <section className="purchase-panel" aria-label={title}>
        <div className="purchase-table-wrap"><table className="purchase-table"><thead><tr>{sellerView ? <><th>Request</th><th>Buyer</th><th>Crop</th><th>Quantity</th><th>Offered Price</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th></> : <><th>Request</th><th>Crop</th><th>Quantity</th><th>Seller</th><th>Seller Type</th><th>Offered Price</th><th>Date</th><th>Status</th><th>Actions</th></>}</tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan="9" className="purchase-empty">{isLoading ? 'Loading purchase requests...' : empty}</td></tr> : requests.map((request) => <tr key={request.id}>{sellerView ? <><td className="request-id">#{request.id}</td><td>{request.buyer_name}</td><td className="request-crop">{request.crop_name}</td><td>{request.requested_quantity} {request.unit}</td><td>{request.offered_price == null ? 'Not offered' : `Rs ${request.offered_price}`}</td><td className="request-message">{request.message || 'No message'}</td><td>{dateLabel(request.created_at)}</td><td><span className={`request-status ${request.status}`}>{request.status}</span></td><td><RequestActions request={request} sellerView={sellerView} onStatus={changeStatus} onView={setSelected} /></td></> : <><td className="request-id">#{request.id}</td><td className="request-crop">{request.crop_name}</td><td>{request.requested_quantity} {request.unit}</td><td>{request.seller_name}</td><td>{request.seller_type}</td><td>{request.offered_price == null ? 'Not offered' : `Rs ${request.offered_price}`}</td><td>{dateLabel(request.created_at)}</td><td><span className={`request-status ${request.status}`}>{request.status}</span></td><td><RequestActions request={request} sellerView={sellerView} onStatus={changeStatus} onView={setSelected} /></td></>}</tr>)}</tbody></table></div>
      </section>
      {selected && <div className="purchase-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="request-details-title" onClick={(event) => event.stopPropagation()}><div className="purchase-modal-heading"><div><p className="purchase-eyebrow">Request #{selected.id}</p><h2 id="request-details-title">{selected.crop_name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close details">x</button></div><dl className="purchase-details"><div><dt>Requested Quantity</dt><dd>{selected.requested_quantity} {selected.unit}</dd></div><div><dt>Offered Price</dt><dd>{selected.offered_price == null ? 'Not offered' : `Rs ${selected.offered_price}`}</dd></div><div><dt>{sellerView ? 'Buyer' : 'Seller'}</dt><dd>{sellerView ? selected.buyer_name : selected.seller_name}</dd></div><div><dt>Status</dt><dd><span className={`request-status ${selected.status}`}>{selected.status}</span>{selected.status === 'accepted' && <small className="delivery-created-note">Delivery created</small>}</dd></div><div className="purchase-wide"><dt>Message</dt><dd>{selected.message || 'No message added.'}</dd></div></dl><div className="purchase-modal-actions"><RequestActions request={selected} sellerView={sellerView} onStatus={changeStatus} onView={() => setSelected(null)} /></div></section></div>}
    </div>
  )
}

function RequestActions({ request, sellerView, onStatus, onView }) {
  return <div className="request-actions"><button type="button" onClick={() => { onView(request) }}>View Details</button>{sellerView && request.status === 'pending' && <><button className="request-accept" type="button" onClick={() => onStatus(request, 'accepted')}>Accept</button><button className="request-reject" type="button" onClick={() => onStatus(request, 'rejected')}>Reject</button></>}{sellerView && request.status === 'accepted' && <button className="request-accept" type="button" onClick={() => onStatus(request, 'completed')}>Mark Completed</button>}{!sellerView && request.status === 'pending' && <button className="request-reject" type="button" onClick={() => onStatus(request, 'cancelled')}>Cancel Request</button>}</div>
}

export default PurchaseRequests
