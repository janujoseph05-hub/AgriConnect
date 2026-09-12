import { useContext } from 'react'
import { ListingsContext } from './ListingsContextValue'

export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) throw new Error('useListings must be used inside ListingsProvider')
  return context
}
