import React, {useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const dashboardPath = user?.role === 'fpo' ? '/fpo-dashboard' : user?.role === 'buyer' ? '/marketplace' : '/farmer-dashboard'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className={`nav sticky ${open ? 'menu-open' : ''}`}>
      <div className="nav-inner">
        <div className="brand">AgriConnect</div>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <a href="/#home">Home</a>
          <Link to="/crop-opportunity">Crop Opportunity</Link>
          {user && <Link to="/marketplace">Marketplace</Link>}
          {user && <Link to="/logistics">Logistics</Link>}
          {user && <Link to="/market-intelligence">Market Intelligence</Link>}
          {user?.role === 'farmer' && <Link to="/farmer-dashboard">Farmer Dashboard</Link>}
          {user?.role === 'farmer' && <Link to="/farmer-requests">Purchase Requests</Link>}
          {user?.role === 'fpo' && <Link to="/fpo-dashboard">FPO Dashboard</Link>}
          {user?.role === 'fpo' && <Link to="/fpo-requests">Buyer Requests</Link>}
          {user?.role === 'buyer' && <Link to="/marketplace">Buyer Marketplace</Link>}
          {user?.role === 'buyer' && <Link to="/buyer-requests">My Purchase Requests</Link>}
          <a href="/#about">About</a>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link className="nav-user" to={dashboardPath}>
                <strong>{user.name}</strong><span>{user.role.toUpperCase()}</span>
              </Link>
              <button className="btn btn-ghost" type="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">Login</Link>
              <Link className="btn btn-primary" to="/register">Get Started</Link>
            </>
          )}
        </div>
        <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

export default Navbar
