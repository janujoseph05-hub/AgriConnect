const API_BASE_URL = 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  let response

  let userHeaders = {}
  try {
    const user = JSON.parse(localStorage.getItem('agriconnect_user') || 'null')
    if (user?.id) userHeaders['X-User-Id'] = String(user.id)
  } catch {
    // Continue without a prototype identity when localStorage is invalid.
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...userHeaders,
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    throw new Error('Unable to connect to the AgriConnect server. Please make sure the backend is running.')
  }

  if (!response.ok) {
    let message = 'Something went wrong while contacting the AgriConnect server.'

    try {
      const errorBody = await response.json()
      if (errorBody.detail) message = errorBody.detail
    } catch {
      // Keep the friendly fallback when the server does not return JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export function getListings() {
  return request('/api/listings')
}

export function createListing(listing) {
  return request('/api/listings', {
    method: 'POST',
    body: JSON.stringify(listing),
  })
}

export function updateListing(id, listing) {
  return request(`/api/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(listing),
  })
}

export function deleteListing(id) {
  return request(`/api/listings/${id}`, {
    method: 'DELETE',
  })
}

export function registerUser(user) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export function loginUser(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function getFpoFarmers() {
  return request('/api/fpo/farmers')
}

export function addFpoFarmer(email) {
  return request('/api/fpo/farmers', { method: 'POST', body: JSON.stringify({ email }) })
}

export function removeFpoFarmer(farmerId) {
  return request(`/api/fpo/farmers/${farmerId}`, { method: 'DELETE' })
}

export function getFpoProduce() {
  return request('/api/fpo/produce')
}

export function createFpoProduce(produce) {
  return request('/api/fpo/produce', { method: 'POST', body: JSON.stringify(produce) })
}

export function updateFpoProduce(id, produce) {
  return request(`/api/fpo/produce/${id}`, { method: 'PUT', body: JSON.stringify(produce) })
}

export function deleteFpoProduce(id) {
  return request(`/api/fpo/produce/${id}`, { method: 'DELETE' })
}

export function getFpoStats() {
  return request('/api/fpo/stats')
}

export function createPurchaseRequest(payload) {
  return request('/api/purchase-requests', { method: 'POST', body: JSON.stringify(payload) })
}

export function getBuyerPurchaseRequests() {
  return request('/api/purchase-requests/buyer')
}

export function getReceivedPurchaseRequests() {
  return request('/api/purchase-requests/received')
}

export function getPurchaseRequest(id) {
  return request(`/api/purchase-requests/${id}`)
}

export function updatePurchaseRequestStatus(id, status) {
  return request(`/api/purchase-requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
}

export function getDeliveries() {
  return request('/api/deliveries')
}

export function getDelivery(id) {
  return request(`/api/deliveries/${id}`)
}

export function updateDeliveryStatus(id, status) {
  return request(`/api/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
}

export function getForecastModelInfo() { return request('/api/forecast/model-info') }
export function getForecastCommodities() { return request('/api/forecast/commodities') }
export function getForecastMarkets() { return request('/api/forecast/markets') }
export function predictMarketPrice(payload) { return request('/api/forecast/predict', { method: 'POST', body: JSON.stringify(payload) }) }
