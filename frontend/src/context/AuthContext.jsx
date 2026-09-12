import { useMemo, useState } from 'react'
import { AuthContext, STORAGE_KEY } from './AuthContextValue'

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const value = useMemo(() => ({
    user,
    setAuthenticatedUser(nextUser) {
      setUser(nextUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    },
    logout() {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

