import React, { useCallback, useEffect, useState } from 'react'
import { ListingsContext } from './ListingsContextValue'
import { createListing as createListingRequest, deleteListing as deleteListingRequest, getListings, updateListing as updateListingRequest } from '../services/api'

const mapListing = (listing) => ({
  id: listing.id,
  crop: listing.crop_name,
  quantity: String(listing.quantity),
  unit: listing.unit,
  location: listing.location,
  farmer: listing.farmer_name,
  price: listing.expected_price == null ? '' : String(listing.expected_price),
  availableFrom: listing.available_from || '',
  description: listing.description || '',
  status: Number(listing.quantity) > 0 ? 'Available' : 'Unavailable',
  sourceType: listing.source_type || 'farmer',
  sourceName: listing.source_name || listing.farmer_name,
})

const toApiListing = (listing) => ({
  crop_name: listing.crop.trim(),
  quantity: Number(listing.quantity),
  unit: listing.unit.trim(),
  location: listing.location.trim(),
  farmer_name: (listing.farmer || 'Demo Farmer').trim(),
  expected_price: listing.price === '' || listing.price == null ? null : Number(listing.price),
  available_from: listing.availableFrom || null,
  description: listing.description?.trim() || null,
})

export function ListingsProvider({ children }) {
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshListings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await getListings()
      setListings(response.map(mapListing))
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshListings()
  }, [refreshListings])

  const addListing = async (listing) => {
    setIsLoading(true)
    try {
      await createListingRequest(toApiListing(listing))
      await refreshListings()
      return true
    } catch (requestError) {
      setError(requestError.message)
      setIsLoading(false)
      throw requestError
    }
  }

  const updateListing = async (id, changes) => {
    setIsLoading(true)
    try {
      await updateListingRequest(id, toApiListing(changes))
      await refreshListings()
      return true
    } catch (requestError) {
      setError(requestError.message)
      setIsLoading(false)
      throw requestError
    }
  }

  const deleteListing = async (id) => {
    setIsLoading(true)
    try {
      await deleteListingRequest(id)
      await refreshListings()
      return true
    } catch (requestError) {
      setError(requestError.message)
      setIsLoading(false)
      throw requestError
    }
  }

  return (
    <ListingsContext.Provider value={{ listings, isLoading, error, refreshListings, addListing, updateListing, deleteListing }}>
      {children}
    </ListingsContext.Provider>
  )
}

